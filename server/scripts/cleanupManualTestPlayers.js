import "dotenv/config";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import Player from "../models/Player.js";

async function main() {
  await connectMongo();

  const res = await Player.deleteMany({
    $or: [
      { name: "Patrick Mahomes", team: "KANSAS CITY CHIEFS" },
      { name: "Jayden Daniels", team: "WASHINGTON COMMANDERS" },
    ],
  });

  console.log(`[cleanup] Removed ${res.deletedCount} manual test players`);
}

main()
  .catch((err) => {
    console.error("[cleanup] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
