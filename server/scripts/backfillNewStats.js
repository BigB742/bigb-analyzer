import "dotenv/config";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import Player from "../models/Player.js";

const FIELDS = [
  "rec",
  "recYds",
  "recTD",
  "twoPt",
  "fgm_0_19",
  "fgm_20_29",
  "fgm_30_39",
  "fgm_40_49",
  "fgm_50_59",
  "fgm_60_plus",
  "xpm",
  "fgMiss",
  "xpMiss",
];

async function main() {
  await connectMongo();
  const pipelineSet = {};
  for (const field of FIELDS) {
    pipelineSet[field] = { $ifNull: [`$${field}`, 0] };
  }

  const res = await Player.updateMany({}, [{ $set: pipelineSet }]);
  console.log(
    `[backfill-new-stats] Matched ${res.matchedCount ?? res.matched ?? 0}, modified ${res.modifiedCount ?? res.modified ?? 0}`
  );
}

main()
  .catch((err) => {
    console.error("[backfill-new-stats] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
