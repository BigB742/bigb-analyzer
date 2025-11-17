import { Router } from "express";
import { runSyncOnce } from "../jobs/syncPlayers.js";
import { syncAllPlayers } from "../jobs/syncAllPlayers.js";

const router = Router();

async function handleSyncOnce(req, res) {
  try {
    const weekParam = req.query.week ?? req.body?.week;
    const parsedWeek = weekParam !== undefined ? Number(weekParam) : undefined;
    const week = parsedWeek !== undefined && !Number.isNaN(parsedWeek) ? parsedWeek : undefined;
    const out = await runSyncOnce({ week });
    res.json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

router.get("/once", handleSyncOnce);
router.post("/once", handleSyncOnce);

router.post("/all", async (req, res) => {
  try {
    const out = await syncAllPlayers();
    res.json(out);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
