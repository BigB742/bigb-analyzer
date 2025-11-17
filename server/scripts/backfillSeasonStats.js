import "dotenv/config";
import { disconnectMongo } from "../db/mongo.js";
import { syncWeeklyStats } from "../jobs/syncWeeklyStats.js";

function parseArgs() {
  const args = {};
  for (const token of process.argv.slice(2)) {
    if (!token.startsWith("--")) continue;
    const [key, value = "true"] = token.slice(2).split("=");
    args[key] = value;
  }
  return args;
}

function currentNFLWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
  return Math.max(1, Math.min(18, week - 35));
}

async function main() {
  const args = parseArgs();
  const season = Number(args.season ?? args.s);
  if (!season || Number.isNaN(season)) {
    throw new Error("--season is required (e.g. --season=2025)");
  }

  const endWeek = args.endWeek ? Number(args.endWeek) : currentNFLWeek();
  if (!endWeek || Number.isNaN(endWeek)) {
    throw new Error("Invalid endWeek value");
  }

  for (let week = 1; week <= endWeek; week++) {
    try {
      const result = await syncWeeklyStats({ season, week });
      console.log(
        `[stats-backfill] season=${season} week=${week} fetched=${result.fetched} upserted=${result.upserted} updated=${result.updated} skipped=${result.skipped}`
      );
    } catch (err) {
      console.error(`[stats-backfill] week ${week} failed:`, err.message || err);
    }
  }
}

main()
  .catch((err) => {
    console.error("[stats-backfill] Error:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
