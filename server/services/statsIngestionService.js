import { connectMongo } from "../db/mongo.js";
import Player from "../models/Player.js";
import PlayerWeekStat from "../models/PlayerWeekStat.js";
import { getStatsProvider } from "../providers/statsProviderRegistry.js";

function ensureNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function fetchAndUpsertStats({ season, week, providerName } = {}) {
  const seasonNum = Number(season);
  const weekNum = Number(week);

  if (!seasonNum || Number.isNaN(seasonNum)) {
    throw new Error("fetchAndUpsertStats requires a valid season");
  }
  if (!weekNum || Number.isNaN(weekNum)) {
    throw new Error("fetchAndUpsertStats requires a valid week");
  }

  await connectMongo();

  const provider = getStatsProvider(providerName);
  const startedAt = Date.now();
  const rows = await provider.fetchWeeklyStats({ season: seasonNum, week: weekNum });
  const durationMs = Date.now() - startedAt;

  const providerIds = Array.from(new Set(rows.map((row) => String(row.provider_player_id || "")))).filter(Boolean);

  const players = await Player.find({ externalId: { $in: providerIds } })
    .select("_id externalId team position name")
    .lean();

  const playersByExternalId = new Map(players.map((p) => [String(p.externalId), p]));
  const missingExternalIds = [];

  let upserted = 0;
  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  const now = new Date();
  const samples = [];

  for (const row of rows) {
    const externalId = String(row.provider_player_id || "");
    if (!externalId) {
      skipped++;
      continue;
    }

    const playerDoc = playersByExternalId.get(externalId);
    if (!playerDoc) {
      missingExternalIds.push(externalId);
      skipped++;
      continue;
    }

    const stats = row.stats || {};
    const update = {
      playerId: playerDoc._id,
      externalId,
      season: seasonNum,
      week: weekNum,
      position: row.position || playerDoc.position,
      team: row.team || playerDoc.team || "",
      passAtt: ensureNumber(stats.pass_attempts),
      passCmp: ensureNumber(stats.pass_completions),
      passYds: ensureNumber(stats.pass_yards),
      passTD: ensureNumber(stats.pass_tds),
      interceptions: ensureNumber(stats.interceptions),
      rushAtt: ensureNumber(stats.rush_attempts),
      rushYds: ensureNumber(stats.rush_yards),
      rushTD: ensureNumber(stats.rush_tds),
      rec: ensureNumber(stats.rec_receptions),
      recYds: ensureNumber(stats.rec_yards),
      recTD: ensureNumber(stats.rec_tds),
      twoPt: ensureNumber(stats.two_pt),
      fgm_0_19: ensureNumber(stats.fgm_0_19),
      fgm_20_29: ensureNumber(stats.fgm_20_29),
      fgm_30_39: ensureNumber(stats.fgm_30_39),
      fgm_40_49: ensureNumber(stats.fgm_40_49),
      fgm_50_59: ensureNumber(stats.fgm_50_59),
      fgm_60_plus: ensureNumber(stats.fgm_60_plus),
      xpm: ensureNumber(stats.xpm ?? stats.extra_points_made),
      fgMiss: ensureNumber(stats.fg_miss),
      xpMiss: ensureNumber(stats.xp_miss),
      updatedAt: now,
    };

    const response = await PlayerWeekStat.updateOne(
      { playerId: playerDoc._id, season: seasonNum, week: weekNum },
      {
        $set: update,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    if (response.upsertedCount > 0) {
      upserted++;
    } else if (response.modifiedCount > 0) {
      updated++;
    } else {
      unchanged++;
    }

    if (samples.length < 10) {
      samples.push({
        player_id: String(playerDoc._id),
        name: playerDoc.name,
        team: update.team,
        position: update.position,
        pass_attempts: update.passAtt,
        rush_yards: update.rushYds,
        rec_yards: update.recYds,
        xpm: update.xpm,
      });
    }
  }

  const finishedAt = Date.now();
  const summary = {
    ok: true,
    provider: provider.name,
    season: seasonNum,
    week: weekNum,
    fetched: rows.length,
    matched: playersByExternalId.size,
    upserted,
    updated,
    skipped,
    unchanged,
    missingExternalIds: Array.from(new Set(missingExternalIds)).sort(),
    fetchDurationMs: durationMs,
    totalDurationMs: finishedAt - startedAt,
    sample: samples,
  };

  console.log(
    `[stats][ingest] provider=${provider.name} season=${seasonNum} week=${weekNum} fetched=${rows.length} matched=${playersByExternalId.size} upserted=${upserted} updated=${updated} unchanged=${unchanged} skipped=${skipped} missing=${summary.missingExternalIds.length} fetchMs=${durationMs} totalMs=${summary.totalDurationMs}`
  );
  if (summary.missingExternalIds.length > 0) {
    console.warn(`[stats][ingest] missing externalIds sample:`, summary.missingExternalIds.slice(0, 15));
  }
  if (samples.length > 0) {
    console.log("[stats][ingest] sample rows:", samples);
  }

  return summary;
}
