import { Router } from "express";
import { fetchQBLines } from "../providers/qbLinesFromSheets.js";
import { getCache, setCache } from "../cache.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const QB_LINES_CACHE_KEY = "qbLines:list";

const router = Router();

router.get("/qb-lines", async (req, res) => {
  const start = Date.now();
  try {
    const forceRefresh = req.query.forceRefresh === "1" || req.query.forceRefresh === "true";
    if (!forceRefresh) {
      const cached = getCache(QB_LINES_CACHE_KEY);
      if (cached) {
        console.log(`[GET /api/qb-lines] cache hit rows=${cached.length}`);
        return res.json(cached);
      }
    }
    const qbLines = await fetchQBLines({ forceRefresh });
    console.log(`[GET /api/qb-lines] returned ${qbLines.length} rows in ${Date.now() - start}ms`);
    setCache(QB_LINES_CACHE_KEY, qbLines, CACHE_TTL_MS);
    res.json(qbLines);
  } catch (error) {
    console.error("[GET /api/qb-lines] ERROR", error);
    const cached = getCache(QB_LINES_CACHE_KEY);
    if (cached) {
      console.warn("[GET /api/qb-lines] serving cached data due to error.");
      return res.json(cached);
    }
    res.status(500).json({
      message: "Unable to load QB prop lines from Google Sheets.",
    });
  }
});

export default router;
