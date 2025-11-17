import mongoose from "mongoose";
import Player from "../models/Player.js";
import PlayerWeekStat from "../models/PlayerWeekStat.js";
import { connectMongo } from "../db/mongo.js";
import { syncWeeklyStats } from "../jobs/syncWeeklyStats.js";
import { ALLOWED_POSITIONS } from "../utils/pruneNonFantasyPlayers.js";
import { getCachedOrLoad } from "../utils/memoryCache.js";
import { getStatsProvider } from "../providers/statsProviderRegistry.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function parseNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function ensureNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizePositionFilter(value) {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (upper === "ALL") return null;
  return ALLOWED_POSITIONS.includes(upper) ? upper : null;
}

function normalizeTeamFilter(value) {
  if (!value) return null;
  const upper = String(value).toUpperCase();
  if (upper === "ALL") return null;
  return upper;
}

function normalizeSearchTerm(value) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeLimit(value, fallback = DEFAULT_LIMIT) {
  const parsed = parseNumber(value, fallback);
  if (!parsed || parsed < 1) return fallback;
  return Math.min(MAX_LIMIT, parsed);
}

function sanitizeOffset(value) {
  const parsed = parseNumber(value, 0);
  if (!parsed || parsed < 0) return 0;
  return parsed;
}

function toISO(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
}

function mapWeeklyItem(doc, { season, week }) {
  const stat = doc.stat || {};
  const updatedAt = doc.statUpdatedAt || stat.updatedAt || null;
  return {
    player_id: String(doc._id),
    external_id: doc.externalId ? String(doc.externalId) : null,
    player_name: doc.name,
    team: doc.team || "",
    position: doc.position,
    season,
    week,
    pass_attempts: ensureNumber(stat.passAtt),
    pass_completions: ensureNumber(stat.passCmp),
    pass_yards: ensureNumber(stat.passYds),
    pass_tds: ensureNumber(stat.passTD),
    interceptions: ensureNumber(stat.interceptions),
    rush_attempts: ensureNumber(stat.rushAtt),
    rush_yards: ensureNumber(stat.rushYds),
    rush_tds: ensureNumber(stat.rushTD),
    rec_receptions: ensureNumber(stat.rec),
    rec_yards: ensureNumber(stat.recYds),
    rec_tds: ensureNumber(stat.recTD),
    two_pt: ensureNumber(stat.twoPt),
    fgm_0_19: ensureNumber(stat.fgm_0_19),
    fgm_20_29: ensureNumber(stat.fgm_20_29),
    fgm_30_39: ensureNumber(stat.fgm_30_39),
    fgm_40_49: ensureNumber(stat.fgm_40_49),
    fgm_50_59: ensureNumber(stat.fgm_50_59),
    fgm_60_plus: ensureNumber(stat.fgm_60_plus),
    xpm: ensureNumber(stat.xpm),
    fg_miss: ensureNumber(stat.fgMiss),
    xp_miss: ensureNumber(stat.xpMiss),
    updated_at: toISO(updatedAt),
    has_stats: Boolean(stat && Object.keys(stat).length > 0),
  };
}

function mapSeasonItem(doc, season) {
  return {
    player_id: String(doc._id),
    external_id: doc.externalId ? String(doc.externalId) : null,
    player_name: doc.name,
    team: doc.team || "",
    position: doc.position,
    season,
    pass_attempts: ensureNumber(doc.passAtt),
    pass_completions: ensureNumber(doc.passCmp),
    pass_yards: ensureNumber(doc.passYds),
    pass_tds: ensureNumber(doc.passTD),
    interceptions: ensureNumber(doc.interceptions),
    rush_attempts: ensureNumber(doc.rushAtt),
    rush_yards: ensureNumber(doc.rushYds),
    rush_tds: ensureNumber(doc.rushTD),
    rec_receptions: ensureNumber(doc.rec),
    rec_yards: ensureNumber(doc.recYds),
    rec_tds: ensureNumber(doc.recTD),
    two_pt: ensureNumber(doc.twoPt),
    fgm_0_19: ensureNumber(doc.fgm_0_19),
    fgm_20_29: ensureNumber(doc.fgm_20_29),
    fgm_30_39: ensureNumber(doc.fgm_30_39),
    fgm_40_49: ensureNumber(doc.fgm_40_49),
    fgm_50_59: ensureNumber(doc.fgm_50_59),
    fgm_60_plus: ensureNumber(doc.fgm_60_plus),
    xpm: ensureNumber(doc.xpm),
    fg_miss: ensureNumber(doc.fgMiss),
    xp_miss: ensureNumber(doc.xpMiss),
    games_played: ensureNumber(doc.gamesPlayed),
    updated_at: toISO(doc.latestUpdate),
  };
}

async function loadWeeklyStatsDataset({
  season,
  week,
  positionFilter,
  teamFilter,
  searchTerm,
  limit,
  offset,
}) {
  await connectMongo();

  const conditions = [{ position: { $in: ALLOWED_POSITIONS } }];

  if (positionFilter) {
    conditions.push({ position: positionFilter });
  }

  if (teamFilter) {
    if (teamFilter === "FA") {
      conditions.push({ $or: [{ team: null }, { team: "" }, { team: "FA" }] });
    } else {
      conditions.push({ team: teamFilter });
    }
  }

  if (searchTerm) {
    const regex = new RegExp(escapeRegex(searchTerm), "i");
    conditions.push({ name: regex });
  }

  const matchStage = conditions.length === 1 ? conditions[0] : { $and: conditions };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "player_week_stats",
        let: { pid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$playerId", "$$pid"] },
                  { $eq: ["$season", season] },
                  { $eq: ["$week", week] },
                ],
              },
            },
          },
          {
            $project: {
              passAtt: 1,
              passCmp: 1,
              passYds: 1,
              passTD: 1,
              interceptions: 1,
              rushAtt: 1,
              rushYds: 1,
              rushTD: 1,
              rec: 1,
              recYds: 1,
              recTD: 1,
              twoPt: 1,
              fgm_0_19: 1,
              fgm_20_29: 1,
              fgm_30_39: 1,
              fgm_40_49: 1,
              fgm_50_59: 1,
              fgm_60_plus: 1,
              xpm: 1,
              fgMiss: 1,
              xpMiss: 1,
              updatedAt: 1,
            },
          },
          { $limit: 1 },
        ],
        as: "weeklyStat",
      },
    },
    { $addFields: { stat: { $first: "$weeklyStat" } } },
    { $addFields: { statUpdatedAt: { $ifNull: ["$stat.updatedAt", null] } } },
    { $project: { weeklyStat: 0 } },
    {
      $facet: {
        data: [
          { $sort: { name: 1 } },
          { $skip: offset },
          { $limit: limit },
        ],
        total: [
          { $count: "count" },
        ],
        lastUpdated: [
          { $match: { statUpdatedAt: { $ne: null } } },
          { $group: { _id: null, lastUpdated: { $max: "$statUpdatedAt" } } },
        ],
      },
    },
  ];

  const aggResult = await Player.aggregate(pipeline).exec();
  const facet = aggResult[0] || { data: [], total: [], lastUpdated: [] };

  const items = (facet.data || []).map((doc) => mapWeeklyItem(doc, { season, week }));
  const total = facet.total?.[0]?.count ?? 0;
  const lastUpdatedDate = facet.lastUpdated?.[0]?.lastUpdated || null;

  return {
    season,
    week,
    total,
    items,
    lastUpdated: toISO(lastUpdatedDate),
  };
}

async function loadSeasonStatsDataset({
  season,
  positionFilter,
  teamFilter,
  searchTerm,
  limit,
  offset,
}) {
  await connectMongo();

  const pipeline = [
    { $match: { season } },
    {
      $group: {
        _id: "$playerId",
        passAtt: { $sum: "$passAtt" },
        passCmp: { $sum: "$passCmp" },
        passYds: { $sum: "$passYds" },
        passTD: { $sum: "$passTD" },
        interceptions: { $sum: "$interceptions" },
        rushAtt: { $sum: "$rushAtt" },
        rushYds: { $sum: "$rushYds" },
        rushTD: { $sum: "$rushTD" },
        rec: { $sum: "$rec" },
        recYds: { $sum: "$recYds" },
        recTD: { $sum: "$recTD" },
        twoPt: { $sum: "$twoPt" },
        fgm_0_19: { $sum: "$fgm_0_19" },
        fgm_20_29: { $sum: "$fgm_20_29" },
        fgm_30_39: { $sum: "$fgm_30_39" },
        fgm_40_49: { $sum: "$fgm_40_49" },
        fgm_50_59: { $sum: "$fgm_50_59" },
        fgm_60_plus: { $sum: "$fgm_60_plus" },
        xpm: { $sum: "$xpm" },
        fgMiss: { $sum: "$fgMiss" },
        xpMiss: { $sum: "$xpMiss" },
        gamesPlayed: { $sum: 1 },
        latestUpdate: { $max: "$updatedAt" },
        teamFromStats: { $last: "$team" },
        positionFromStats: { $last: "$position" },
        externalIdFromStats: { $last: "$externalId" },
      },
    },
    {
      $lookup: {
        from: "players",
        localField: "_id",
        foreignField: "_id",
        as: "player",
      },
    },
    { $unwind: "$player" },
    {
      $addFields: {
        name: "$player.name",
        position: {
          $ifNull: ["$player.position", "$positionFromStats"],
        },
        team: {
          $let: {
            vars: {
              primary: { $ifNull: ["$player.team", ""] },
              fallback: { $ifNull: ["$teamFromStats", ""] },
            },
            in: {
              $cond: [{ $ne: ["$$primary", ""] }, "$$primary", "$$fallback"],
            },
          },
        },
        externalId: {
          $let: {
            vars: {
              primary: { $ifNull: ["$player.externalId", ""] },
              fallback: { $ifNull: ["$externalIdFromStats", ""] },
            },
            in: {
              $cond: [{ $ne: ["$$primary", ""] }, "$$primary", "$$fallback"],
            },
          },
        },
      },
    },
    {
      $addFields: {
        team: {
          $cond: [
            { $in: ["$team", [null, undefined]] },
            "",
            { $ifNull: ["$team", ""] },
          ],
        },
      },
    },
  ];

  if (positionFilter) {
    pipeline.push({ $match: { position: positionFilter } });
  } else {
    pipeline.push({ $match: { position: { $in: ALLOWED_POSITIONS } } });
  }

  if (teamFilter) {
    if (teamFilter === "FA") {
      pipeline.push({ $match: { $or: [{ team: "" }, { team: "FA" }, { team: null }] } });
    } else {
      pipeline.push({ $match: { team: teamFilter } });
    }
  }

  if (searchTerm) {
    const regex = new RegExp(escapeRegex(searchTerm), "i");
    pipeline.push({ $match: { name: regex } });
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: { name: 1 } },
        { $skip: offset },
        { $limit: limit },
      ],
      total: [
        { $count: "count" },
      ],
      lastUpdated: [
        { $match: { latestUpdate: { $ne: null } } },
        { $group: { _id: null, lastUpdated: { $max: "$latestUpdate" } } },
      ],
    },
  });

  const aggResult = await PlayerWeekStat.aggregate(pipeline).exec();
  const facet = aggResult[0] || { data: [], total: [], lastUpdated: [] };

  const items = (facet.data || []).map((doc) => mapSeasonItem(doc, season));
  const total = facet.total?.[0]?.count ?? 0;
  const lastUpdatedDate = facet.lastUpdated?.[0]?.lastUpdated || null;

  return {
    season,
    total,
    items,
    lastUpdated: toISO(lastUpdatedDate),
  };
}

export async function syncWeeklyStatsController(req, res) {
  try {
    const season = parseNumber(
      req.body?.season ?? req.query?.season,
      parseNumber(process.env.SEASON, null)
    );
    const week = parseNumber(req.body?.week ?? req.query?.week, null);
    if (!season || !week) {
      return res.status(400).json({ ok: false, error: "season and week are required" });
    }

    const providerName =
      req.body?.provider ??
      req.body?.dataSource ??
      req.query?.provider ??
      req.query?.dataSource ??
      null;

    const result = await syncWeeklyStats({ season, week, providerName });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function listWeeklyStats(req, res) {
  try {
    const season = parseNumber(req.query.season, parseNumber(process.env.SEASON, null));
    const week = parseNumber(req.query.week, null);
    if (!season || !week) {
      return res.status(400).json({ ok: false, error: "season and week query params are required" });
    }

    const positionFilter = normalizePositionFilter(req.query.position);
    const teamFilterRaw = normalizeTeamFilter(req.query.team);
    const teamFilter = teamFilterRaw === "ALL" ? null : teamFilterRaw;
    const searchTerm = normalizeSearchTerm(req.query.q);
    const limit = sanitizeLimit(req.query.limit);
    const offset = sanitizeOffset(req.query.offset);

    const cacheKey = [
      "weekly",
      season,
      week,
      positionFilter || "ALL",
      teamFilter || "ALL",
      searchTerm || "",
      `limit:${limit}`,
      `offset:${offset}`,
    ].join(":");

    const { data, cacheStatus } = await getCachedOrLoad(
      cacheKey,
      () =>
        loadWeeklyStatsDataset({
          season,
          week,
          positionFilter,
          teamFilter,
          searchTerm,
          limit,
          offset,
        }),
      { ttlMs: CACHE_TTL_MS, allowStale: true }
    );

    if (cacheStatus) {
      res.set("X-Cache-Status", cacheStatus);
    }

    res.json({
      ok: true,
      cacheStatus,
      ...data,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function listSeasonStats(req, res) {
  try {
    const season = parseNumber(req.query.season, parseNumber(process.env.SEASON, null));
    if (!season) {
      return res.status(400).json({ ok: false, error: "season query param is required" });
    }

    const positionFilter = normalizePositionFilter(req.query.position);
    const teamFilterRaw = normalizeTeamFilter(req.query.team);
    const teamFilter = teamFilterRaw === "ALL" ? null : teamFilterRaw;
    const searchTerm = normalizeSearchTerm(req.query.q);
    const limit = sanitizeLimit(req.query.limit);
    const offset = sanitizeOffset(req.query.offset);

    const cacheKey = [
      "season",
      season,
      positionFilter || "ALL",
      teamFilter || "ALL",
      searchTerm || "",
      `limit:${limit}`,
      `offset:${offset}`,
    ].join(":");

    const { data, cacheStatus } = await getCachedOrLoad(
      cacheKey,
      () =>
        loadSeasonStatsDataset({
          season,
          positionFilter,
          teamFilter,
          searchTerm,
          limit,
          offset,
        }),
      { ttlMs: CACHE_TTL_MS, allowStale: true }
    );

    if (cacheStatus) {
      res.set("X-Cache-Status", cacheStatus);
    }

    res.json({
      ok: true,
      cacheStatus,
      ...data,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function getSeasonStatsForPlayer(req, res) {
  try {
    await connectMongo();
    const { playerId } = req.params;
    const season = parseNumber(req.query.season, parseNumber(process.env.SEASON, null));
    if (!season) {
      return res.status(400).json({ ok: false, error: "season query param is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ ok: false, error: "Invalid playerId" });
    }

    const player = await Player.findById(playerId).lean();
    if (!player) {
      return res.status(404).json({ ok: false, error: "Player not found" });
    }

    const totalsAgg = await PlayerWeekStat.aggregate([
      { $match: { playerId: player._id, season } },
      {
        $group: {
          _id: "$playerId",
          passAtt: { $sum: "$passAtt" },
          passCmp: { $sum: "$passCmp" },
          passYds: { $sum: "$passYds" },
          passTD: { $sum: "$passTD" },
          interceptions: { $sum: "$interceptions" },
          rushAtt: { $sum: "$rushAtt" },
          rushYds: { $sum: "$rushYds" },
          rushTD: { $sum: "$rushTD" },
          rec: { $sum: "$rec" },
          recYds: { $sum: "$recYds" },
          recTD: { $sum: "$recTD" },
          twoPt: { $sum: "$twoPt" },
          fgm_0_19: { $sum: "$fgm_0_19" },
          fgm_20_29: { $sum: "$fgm_20_29" },
          fgm_30_39: { $sum: "$fgm_30_39" },
          fgm_40_49: { $sum: "$fgm_40_49" },
          fgm_50_59: { $sum: "$fgm_50_59" },
          fgm_60_plus: { $sum: "$fgm_60_plus" },
          xpm: { $sum: "$xpm" },
          fgMiss: { $sum: "$fgMiss" },
          xpMiss: { $sum: "$xpMiss" },
          games: { $sum: 1 },
          latestUpdate: { $max: "$updatedAt" },
        },
      },
    ]);

    const totalsRaw = totalsAgg[0] || {};
    const totals = {
      season,
      pass_attempts: ensureNumber(totalsRaw.passAtt),
      pass_completions: ensureNumber(totalsRaw.passCmp),
      pass_yards: ensureNumber(totalsRaw.passYds),
      pass_tds: ensureNumber(totalsRaw.passTD),
      interceptions: ensureNumber(totalsRaw.interceptions),
      rush_attempts: ensureNumber(totalsRaw.rushAtt),
      rush_yards: ensureNumber(totalsRaw.rushYds),
      rush_tds: ensureNumber(totalsRaw.rushTD),
      rec_receptions: ensureNumber(totalsRaw.rec),
      rec_yards: ensureNumber(totalsRaw.recYds),
      rec_tds: ensureNumber(totalsRaw.recTD),
      two_pt: ensureNumber(totalsRaw.twoPt),
      fgm_0_19: ensureNumber(totalsRaw.fgm_0_19),
      fgm_20_29: ensureNumber(totalsRaw.fgm_20_29),
      fgm_30_39: ensureNumber(totalsRaw.fgm_30_39),
      fgm_40_49: ensureNumber(totalsRaw.fgm_40_49),
      fgm_50_59: ensureNumber(totalsRaw.fgm_50_59),
      fgm_60_plus: ensureNumber(totalsRaw.fgm_60_plus),
      xpm: ensureNumber(totalsRaw.xpm),
      fg_miss: ensureNumber(totalsRaw.fgMiss),
      xp_miss: ensureNumber(totalsRaw.xpMiss),
      games_played: ensureNumber(totalsRaw.games),
      updated_at: toISO(totalsRaw.latestUpdate),
    };

    const weekly = await PlayerWeekStat.find({ playerId: player._id, season })
      .sort({ week: 1 })
      .lean();

    const weeklyRows = weekly.map((row) => ({
      season,
      week: row.week,
      pass_attempts: ensureNumber(row.passAtt),
      pass_completions: ensureNumber(row.passCmp),
      pass_yards: ensureNumber(row.passYds),
      pass_tds: ensureNumber(row.passTD),
      interceptions: ensureNumber(row.interceptions),
      rush_attempts: ensureNumber(row.rushAtt),
      rush_yards: ensureNumber(row.rushYds),
      rush_tds: ensureNumber(row.rushTD),
      rec_receptions: ensureNumber(row.rec),
      rec_yards: ensureNumber(row.recYds),
      rec_tds: ensureNumber(row.recTD),
      two_pt: ensureNumber(row.twoPt),
      fgm_0_19: ensureNumber(row.fgm_0_19),
      fgm_20_29: ensureNumber(row.fgm_20_29),
      fgm_30_39: ensureNumber(row.fgm_30_39),
      fgm_40_49: ensureNumber(row.fgm_40_49),
      fgm_50_59: ensureNumber(row.fgm_50_59),
      fgm_60_plus: ensureNumber(row.fgm_60_plus),
      xpm: ensureNumber(row.xpm),
      fg_miss: ensureNumber(row.fgMiss),
      xp_miss: ensureNumber(row.xpMiss),
      updated_at: toISO(row.updatedAt),
    }));

    res.json({
      ok: true,
      season,
      player: {
        id: playerId,
        external_id: player.externalId || null,
        name: player.name,
        team: player.team,
        position: player.position,
      },
      totals,
      weekly: weeklyRows,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function debugWeeklyStatKeysController(req, res) {
  try {
    const season = parseNumber(req.query.season, null);
    const week = parseNumber(req.query.week, null);
    const sample = sanitizeLimit(req.query.sample, 50);
    if (!season || !week) {
      return res.status(400).json({ ok: false, error: "season and week are required" });
    }

    const provider = getStatsProvider(req.query.provider);
    if (!provider.debugStatKeys) {
      return res.status(400).json({ ok: false, error: "Provider does not expose debugStatKeys" });
    }

    const keys = await provider.debugStatKeys({ season, week, sample });
    res.json({ ok: true, provider: provider.name, season, week, sample, keys });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function debugWeeklyRawController(req, res) {
  try {
    const season = parseNumber(req.query.season, null);
    const week = parseNumber(req.query.week, null);
    const sample = sanitizeLimit(req.query.sample, 5);
    if (!season || !week) {
      return res.status(400).json({ ok: false, error: "season and week are required" });
    }

    const provider = getStatsProvider(req.query.provider);
    if (!provider.debugRaw) {
      return res.status(400).json({ ok: false, error: "Provider does not expose debugRaw" });
    }

    const rows = await provider.debugRaw({ season, week, sample });
    res.json({ ok: true, provider: provider.name, season, week, sample, rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}

export async function debugMissingStatsController(req, res) {
  try {
    const season = parseNumber(req.query.season, parseNumber(process.env.SEASON, null));
    const week = parseNumber(req.query.week, null);
    if (!season || !week) {
      return res
        .status(400)
        .json({ ok: false, error: "season and week query params are required" });
    }

    const limit = sanitizeLimit(req.query.limit, 200);

    await connectMongo();

    const players = await Player.find({ position: { $in: ALLOWED_POSITIONS } })
      .select("_id name team position externalId updatedAt createdAt")
      .lean();

    const stats = await PlayerWeekStat.find({ season, week })
      .select("playerId externalId team position updatedAt")
      .lean();

    const statPlayerIds = new Set(stats.map((row) => String(row.playerId)));

    const missing = [];
    for (const player of players) {
      if (!statPlayerIds.has(String(player._id))) {
        missing.push({
          player_id: String(player._id),
          player_name: player.name,
          team: player.team || "",
          position: player.position,
          external_id: player.externalId || null,
          player_updated_at: toISO(player.updatedAt),
        });
        if (missing.length >= limit) break;
      }
    }

    res.json({
      ok: true,
      season,
      week,
      totalPlayers: players.length,
      statsRows: stats.length,
      missingCount: missing.length,
      players: missing,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
