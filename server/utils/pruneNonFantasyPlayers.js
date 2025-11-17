import Player from "../models/Player.js";

const ALLOWED_POSITIONS = ["QB", "RB", "WR", "TE", "K"];

export async function pruneNonFantasyPlayers() {
  const res = await Player.deleteMany({ position: { $nin: ALLOWED_POSITIONS } });
  return res.deletedCount || 0;
}

export { ALLOWED_POSITIONS };
