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

async function main() {
  const args = parseArgs();
  const season = Number(args.season ?? args.s ?? process.env.SEASON);
  const week = Number(args.week ?? args.w);
  if (!season || Number.isNaN(season)) {
    throw new Error("--season is required (e.g. --season=2025)");
  }
  if (!week || Number.isNaN(week)) {
    throw new Error("--week is required (e.g. --week=6)");
  }

  const providerName = args.provider ?? args.dataSource ?? process.env.DATA_SOURCE ?? "sleeper";

  const result = await syncWeeklyStats({ season, week, providerName });
  console.log(
    `[stats-week] season=${season} week=${week} provider=${result.provider} fetched=${result.fetched} matched=${result.matched} upserted=${result.upserted} updated=${result.updated} unchanged=${result.unchanged} skipped=${result.skipped} missing=${result.missingExternalIds.length}`
  );
}

main()
  .catch((err) => {
    console.error("[stats-week] Error:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
