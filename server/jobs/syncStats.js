import cron from "node-cron";
import { runSyncOnce } from "./syncPlayers.js";

export async function syncOnce({ week } = {}) {
  return runSyncOnce({ week });
}

export function startStatsJob() {
  syncOnce().catch((e) => console.error("[sync stats] initial failed:", e.message));

  cron.schedule("0 4 * * *", async () => {
    try {
      console.log("[cron stats] nightly sync");
      await runSyncOnce();
    } catch (e) {
      console.error("[cron stats nightly]", e);
    }
  });

  cron.schedule("*/40 * * * * 0", async () => {
    try {
      console.log("[cron stats] Sunday fast sync");
      await runSyncOnce();
    } catch (e) {
      console.error("[cron stats sunday]", e);
    }
  });
}
