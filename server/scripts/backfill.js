import "dotenv/config";
import { disconnectMongo } from "../db/mongo.js";
import { fetchAndUpsertStats } from "../services/statsIngestionService.js";

function parseArgs() {
  const args = {};
  for (const token of process.argv.slice(2)) {
    if (!token.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = token.slice(2).split("=");
    args[rawKey] = rawValue;
  }
  return args;
}

function currentNFLWeek() {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 1); // Sept 1
  const diffDays = Math.floor((now - seasonStart) / 86400000);
  const weekOffset = Math.floor(diffDays / 7);
  return Math.max(1, Math.min(18, weekOffset + 1));
}

async function main() {
  const args = parseArgs();
  const season = Number(args.season ?? args.s ?? process.env.SEASON);
  if (!season || Number.isNaN(season)) {
    throw new Error("--season is required (e.g. --season=2025)");
  }

  const fromWeek = Number(args.fromWeek ?? args.from ?? 1);
  if (!fromWeek || Number.isNaN(fromWeek) || fromWeek < 1) {
    throw new Error("--fromWeek must be a positive integer");
  }

  const toWeek = Number(args.toWeek ?? args.to ?? currentNFLWeek());
  if (!toWeek || Number.isNaN(toWeek) || toWeek < fromWeek) {
    throw new Error("--toWeek must be >= fromWeek");
  }

  const providerName = args.provider ?? args.dataSource ?? process.env.DATA_SOURCE ?? "sleeper";

  console.log(
    `[stats-backfill] start provider=${providerName} season=${season} weeks=${fromWeek}-${toWeek}`
  );

  for (let week = fromWeek; week <= toWeek; week++) {
    try {
      const result = await fetchAndUpsertStats({ season, week, providerName });
      console.log(
        `[stats-backfill] season=${season} week=${week} fetched=${result.fetched} matched=${result.matched} upserted=${result.upserted} updated=${result.updated} unchanged=${result.unchanged} skipped=${result.skipped} missing=${result.missingExternalIds.length}`
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
