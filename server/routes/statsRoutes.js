import { Router } from "express";
import {
  syncWeeklyStatsController,
  listWeeklyStats,
  listSeasonStats,
  getSeasonStatsForPlayer,
  debugWeeklyStatKeysController,
  debugWeeklyRawController,
  debugMissingStatsController,
} from "../controllers/statsController.js";

const router = Router();

router.post("/sync/week", syncWeeklyStatsController);
router.get("/weekly", listWeeklyStats);
router.get("/season", listSeasonStats);
router.get("/season/:playerId", getSeasonStatsForPlayer);
router.get("/debug/keys", debugWeeklyStatKeysController);
router.get("/debug/raw", debugWeeklyRawController);
router.get("/debug/missing-stats", debugMissingStatsController);

export default router;
