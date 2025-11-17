import { connectMongo } from "../db/mongo.js";
import PlayerWeekStat from "../models/PlayerWeekStat.js";

export async function healthcheckController(req, res) {
  try {
    await connectMongo();
    const latest = await PlayerWeekStat.findOne({})
      .sort({ updatedAt: -1 })
      .select("season week updatedAt")
      .lean();

    res.json({
      ok: true,
      status: "healthy",
      lastStatsUpdate: latest?.updatedAt ? latest.updatedAt.toISOString() : null,
      lastStatsSeason: latest?.season ?? null,
      lastStatsWeek: latest?.week ?? null,
    });
  } catch (err) {
    res.status(500).json({ ok: false, status: "unhealthy", error: err.message });
  }
}
