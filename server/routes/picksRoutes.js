import { Router } from "express";
import Pick from "../models/Pick.js";

const router = Router();

router.get("/picks", async (req, res) => {
  try {
    const { season, week } = req.query;
    const query = {};
    if (season) {
      const parsedSeason = Number(season);
      if (!Number.isNaN(parsedSeason)) {
        query.season = parsedSeason;
      }
    }

    if (week) {
      const parsedWeek = Number(week);
      if (!Number.isNaN(parsedWeek)) {
        query.week = parsedWeek;
      }
    }

    const picks = await Pick.find(query)
      .sort({ season: -1, week: -1, createdAt: -1 })
      .lean()
      .exec();

    res.json(picks);
  } catch (error) {
    console.error("Failed to load BigB picks:", error.message);
    res.status(500).json({ message: "Unable to load picks right now." });
  }
});

export default router;
