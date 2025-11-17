import "dotenv/config";
import Player from "../models/Player.js";
import { connectMongo, disconnectMongo } from "../db/mongo.js";
import { normalizeAndDedupePlayers } from "../utils/dedupePlayers.js";

function parseTargetKey(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("DEDUP_KEY must be JSON for {name,team,position}");
    }
    const required = ["name", "team", "position"];
    for (const key of required) {
      if (!parsed[key]) {
        throw new Error(`DEDUP_KEY missing required field "${key}"`);
      }
    }
    return parsed;
  } catch (err) {
    throw new Error(`Unable to parse DEDUPE_KEY JSON: ${err.message}`);
  }
}

async function ensureUniqueIndex() {
  try {
    await Player.collection.createIndex(
      { name: 1, team: 1, position: 1 },
      { unique: true, name: "name_1_team_1_position_1" }
    );
    console.log("[dedupe] Unique index ensured on {name, team, position}");
  } catch (err) {
    console.error("[dedupe] Unable to (re)create unique index:", err.message);
    throw err;
  }
}

async function main() {
  const target = parseTargetKey(process.env.DEDUPE_KEY);
  await connectMongo();

  if (target) {
    console.log(`[dedupe] Targeting key ${JSON.stringify(target)}`);
  }

  const { normalizedCount, duplicateGroups, removedCount } =
    await normalizeAndDedupePlayers({ target });

  console.log(`[dedupe] Normalized ${normalizedCount} docs`);
  console.log(
    `[dedupe] Found ${duplicateGroups} duplicate groups. Removed ${removedCount} duplicates`
  );

  await ensureUniqueIndex();
}

main()
  .catch((err) => {
    console.error("[dedupe] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo().catch(() => {});
  });
