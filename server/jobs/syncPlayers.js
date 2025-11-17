import cron from "node-cron";
import { fetchLeagueQBWeek } from "../providers/sleeper.js";
import { normalizeAndDedupePlayers } from "../utils/dedupePlayers.js";
import { upsertPlayer } from "../utils/upsertPlayer.js";
import { connectMongo } from "../db/mongo.js";

const LEAGUE_ID   = process.env.SLEEPER_LEAGUE_ID;
const SEASON      = process.env.SEASON || new Date().getFullYear();
const SEASON_TYPE = "regular";

function currentNFLWeek() {
  if (process.env.WEEK) return Number(process.env.WEEK);
  const now = new Date();
  const oneJan = new Date(now.getFullYear(),0,1);
  const week = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay()+1)/7);
  return Math.max(1, Math.min(18, week - 35));
}

export async function runSyncOnce({ week = currentNFLWeek() } = {}) {
  if (!LEAGUE_ID) throw new Error("SLEEPER_LEAGUE_ID missing in .env");
  await connectMongo();
  const dedupeResults = await normalizeAndDedupePlayers();
  console.log(
    `[sync] Pre-sync: duplicates pruned = ${dedupeResults.removedCount} (normalized ${dedupeResults.normalizedCount})`
  );
  console.log(`[sleeper] Fetching season ${SEASON}, week ${week}, type=${SEASON_TYPE}`);
  const rows = await fetchLeagueQBWeek({ leagueId: LEAGUE_ID, season: SEASON, week });
  console.log(`[sync] Rows to upsert: ${rows.length}`);

  let inserted = 0;
  let updated = 0;

  for (const r of rows) {
    const { inserted: isNew } = await upsertPlayer(r);
    if (isNew) inserted++;
    else updated++;
  }

  return { ok: true, count: rows.length, inserted, updated };
}

cron.schedule("30 3 * * *", async () => {
  try {
    await runSyncOnce();
  } catch (e) {
    console.error("[cron daily] error:", e.message);
  }
});

const every40s = "*/40 * * * * *";
cron.schedule(every40s, async () => {
  const now = new Date();
  const dow = now.getUTCDay();
  const hour = now.getUTCHours();
  const inWindow = (dow === 0 && hour >= 17) || (dow === 1 && hour <= 6);
  if (!inWindow) return;
  try {
    await runSyncOnce();
  } catch (e) {
    console.error("[cron sunday-window] error:", e.message);
  }
});
