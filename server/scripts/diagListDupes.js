import "dotenv/config";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import Player from "../models/Player.js";

async function main() {
  await connectMongo();

  const dupes = await Player.aggregate([
    {
      $group: {
        _id: { name: "$name", team: "$team", position: "$position" },
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
  ]);

  console.log(JSON.stringify(dupes, null, 2));
}

main()
  .catch((err) => {
    console.error("[diag:dupes] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
