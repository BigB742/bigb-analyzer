import Player from "../models/Player.js";
import { connectMongo } from "../db/mongo.js";
import { upsertPlayer } from "../utils/upsertPlayer.js";
import { normalizeName, normalizePosition, normalizeTeam } from "../utils/playerNormalization.js";
import { ALLOWED_POSITIONS } from "../utils/pruneNonFantasyPlayers.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const listPlayers = async (req, res) => {
  try {
    await connectMongo();
    const limit = Number(req.query.limit || 0);
    const and = [{ position: { $in: ALLOWED_POSITIONS } }];

    if (req.query.position) {
      const posNorm = normalizePosition(req.query.position);
      if (posNorm && posNorm !== "ALL" && ALLOWED_POSITIONS.includes(posNorm)) {
        and.push({ position: posNorm });
      }
    }

    if (req.query.team) {
      const teamNorm = normalizeTeam(req.query.team);
      if (teamNorm && teamNorm !== "ALL") {
        if (teamNorm === "FA") {
          and.push({ $or: [{ team: null }, { team: "" }, { team: "FA" }] });
        } else {
          and.push({ team: teamNorm });
        }
      }
    }

    if (req.query.q && req.query.q.trim()) {
      const safe = escapeRegex(normalizeName(req.query.q));
      const nameRegex = new RegExp(safe, "i");
      and.push({ name: nameRegex });
    }

    const query = { $and: and };

    const q = Player.find(query).sort({ name: 1 }).lean();
    if (limit > 0) q.limit(limit);
    const players = await q;
    res.json({ ok: true, players });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const createOrUpdatePlayer = async (req, res) => {
  try {
    await connectMongo();
    const {
      externalId,
      name,
      team,
      position = "QB",
      passAttempts = 0,
      completions = 0,
      passYds = 0,
      passTDs = 0,
      interceptions = 0,
      rushAtt = 0,
      rushYds = 0,
      rushTDs = 0,
      fumbles = 0,
      rec = 0,
      recYds = 0,
      recTD = 0,
      twoPt = 0,
      fgm_0_19 = 0,
      fgm_20_29 = 0,
      fgm_30_39 = 0,
      fgm_40_49 = 0,
      fgm_50_59 = 0,
      fgm_60_plus = 0,
      xpm = 0,
      fgMiss = 0,
      xpMiss = 0,
      season,
      lastWeek,
    } = req.body;

    const externalIdStr = externalId ? String(externalId) : undefined;

    const numOr = (value, fallback = 0) => {
      const num = Number(value);
      return Number.isNaN(num) ? fallback : num;
    };

    const payload = {
      name,
      team,
      position,
      passAttempts: numOr(passAttempts, 0),
      completions: numOr(completions, 0),
      passYds: numOr(passYds, 0),
      passTDs: numOr(passTDs, 0),
      interceptions: numOr(interceptions, 0),
      rushAtt: numOr(rushAtt, 0),
      rushYds: numOr(rushYds, 0),
      rushTDs: numOr(rushTDs, 0),
      fumbles: numOr(fumbles, 0),
      rec: numOr(rec, 0),
      recYds: numOr(recYds, 0),
      recTD: numOr(recTD, 0),
      twoPt: numOr(twoPt, 0),
      fgm_0_19: numOr(fgm_0_19, 0),
      fgm_20_29: numOr(fgm_20_29, 0),
      fgm_30_39: numOr(fgm_30_39, 0),
      fgm_40_49: numOr(fgm_40_49, 0),
      fgm_50_59: numOr(fgm_50_59, 0),
      fgm_60_plus: numOr(fgm_60_plus, 0),
      xpm: numOr(xpm, 0),
      fgMiss: numOr(fgMiss, 0),
      xpMiss: numOr(xpMiss, 0),
    };

    if (externalIdStr) payload.externalId = externalIdStr;
    if (season !== undefined) {
      const seasonNum = Number(season);
      if (!Number.isNaN(seasonNum)) payload.season = seasonNum;
    }
    if (lastWeek !== undefined) {
      const weekNum = Number(lastWeek);
      if (!Number.isNaN(weekNum)) payload.lastWeek = weekNum;
    }

    const { identity } = await upsertPlayer(payload);

    let doc = identity
      ? await Player.findOne(identity).lean()
      : externalIdStr
        ? await Player.findOne({ externalId: externalIdStr }).lean()
        : null;

    res.status(201).json({ ok: true, player: doc });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

export const deletePlayer = async (req, res) => {
  try {
    await connectMongo();
    const { id } = req.params;
    await Player.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
};

export const summarizePositions = async (req, res) => {
  try {
    await connectMongo();
    const rows = await Player.aggregate([
      {
        $match: {
          position: { $in: ALLOWED_POSITIONS },
        },
      },
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {};
    for (const pos of ALLOWED_POSITIONS) {
      summary[pos] = 0;
    }
    for (const row of rows) {
      const key = row?._id;
      if (key && summary[key] !== undefined) {
        summary[key] = row.count;
      }
    }

    res.json({ ok: true, positions: summary });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

export const summarizeTeams = async (req, res) => {
  try {
    await connectMongo();
    const rows = await Player.aggregate([
      {
        $match: {
          position: { $in: ALLOWED_POSITIONS },
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              {
                $or: [
                  { $eq: ["$team", null] },
                  { $eq: ["$team", ""] },
                  { $eq: ["$team", "FA"] },
                ],
              },
              "FA",
              "$team",
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const teams = new Set();
    let freeAgents = 0;
    for (const row of rows) {
      const code = (row?._id || "").toString().trim().toUpperCase();
      if (!code || code === "FA") {
        freeAgents += row.count;
      } else {
        teams.add(code);
      }
    }

    res.json({
      ok: true,
      teams: Array.from(teams).sort(),
      freeAgents,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
