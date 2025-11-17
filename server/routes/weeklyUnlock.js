import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import { getCurrentWeek } from "../utils/currentWeek.js";
import { buildUserResponse } from "../utils/userResponse.js";
import { listAllPlayerMetadata } from "../data/playerMetadata.js";

const PLAYER_LOOKUP = (() => {
  const map = new Map();
  listAllPlayerMetadata().forEach((player) => {
    if (player?.id) {
      map.set(player.id, player.name || player.id);
    }
  });
  return map;
})();

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { playerId, playerName } = req.body || {};
    if (!playerId) {
      return res.status(400).json({ message: "playerId is required." });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.isPremium) {
      return res.status(400).json({ message: "Premium members already have full access." });
    }
    const currentWeek = getCurrentWeek();
    if (user.weeklyUnlockWeek === currentWeek && user.weeklyUnlockPlayerId) {
      return res.status(400).json({ message: "Weekly unlock already used this week." });
    }
    user.weeklyUnlockPlayerId = String(playerId);
    user.weeklyUnlockPlayerName = playerName || PLAYER_LOOKUP.get(String(playerId)) || null;
    user.weeklyUnlockWeek = currentWeek;
    user.weeklyUnlockUsedAt = new Date();
    user.hasUsedWeeklyUnlock = true;
    await user.save();
    return res.json({ user: buildUserResponse(user) });
  } catch (error) {
    console.error("[weekly-unlock] error", error);
    return res.status(500).json({ message: "Unable to use weekly unlock." });
  }
});

export default router;
