import { connectMongo } from "../db/mongo.js";
import { fetchAllNFLPlayers } from "../providers/sleeper.js";
import { normalizeAndDedupePlayers } from "../utils/dedupePlayers.js";
import { upsertPlayer } from "../utils/upsertPlayer.js";
import { pruneNonFantasyPlayers } from "../utils/pruneNonFantasyPlayers.js";

export async function syncAllPlayers() {
  const startedAt = Date.now();
  await connectMongo();
  const dedupeResults = await normalizeAndDedupePlayers();
  console.log(
    `[sync-all] Pre-sync dedupe: normalized ${dedupeResults.normalizedCount}, removed ${dedupeResults.removedCount}`
  );

  const { players, filteredOut } = await fetchAllNFLPlayers();
  console.log(`[sync-all] Filtered out ${filteredOut} non-fantasy positions`);
  console.log(`[sync-all] Fetched ${players.length} active NFL players from Sleeper`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of players) {
    const result = await upsertPlayer(row);
    if (result.skipped) {
      skipped++;
      continue;
    }
    if (result.inserted) inserted++;
    else updated++;
  }

  console.log(
    `[sync-all] Upserted ${inserted + updated} players (inserted ${inserted}, updated ${updated}, skipped ${skipped})`
  );

  const pruned = await pruneNonFantasyPlayers();
  if (pruned > 0) {
    console.log(`[sync-all] Post-sync prune removed ${pruned} non-fantasy players`);
  }

  const durationMs = Date.now() - startedAt;

  return {
    ok: true,
    fetched: players.length,
    filteredOut,
    inserted,
    updated,
    skipped,
    durationMs,
  };
}
