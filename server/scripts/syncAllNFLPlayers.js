import "dotenv/config";
import { syncAllPlayers } from "../jobs/syncAllPlayers.js";
import { disconnectMongo } from "../db/mongo.js";

async function main() {
  const result = await syncAllPlayers();
  console.log(
    `[sync-all] Completed: fetched ${result.fetched}, filteredOut ${result.filteredOut}, inserted ${result.inserted}, updated ${result.updated}, skipped ${result.skipped}, duration ${result.durationMs}ms`
  );
}

main()
  .catch((err) => {
    console.error("[sync-all] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
