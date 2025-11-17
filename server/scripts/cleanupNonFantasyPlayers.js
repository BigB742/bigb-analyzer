import "dotenv/config";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { pruneNonFantasyPlayers } from "../utils/pruneNonFantasyPlayers.js";

async function main() {
  await connectMongo();
  const removed = await pruneNonFantasyPlayers();
  console.log(`[cleanup-nonfantasy] Removed ${removed} non-fantasy players`);
}

main()
  .catch((err) => {
    console.error("[cleanup-nonfantasy] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
