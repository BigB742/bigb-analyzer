import { getBigbPicks } from "../providers/bigbPicksProvider.js";
import { getCache, setCache } from "../cache.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY = "bigbPicks:list";

export async function getBigbPicksHandler(req, res) {
  const start = Date.now();
  const forceRefresh = req.query.forceRefresh === "1" || req.query.forceRefresh === "true";
  try {
    if (!forceRefresh) {
      const cached = getCache(CACHE_KEY);
      if (cached) {
        return res.json({ picks: cached });
      }
    }
    const picks = await getBigbPicks({ forceRefresh });
    console.log(
      `[GET /api/bigb-picks] rows=${picks.length} cached=${!forceRefresh} duration=${Date.now() - start}ms`,
    );
    setCache(CACHE_KEY, picks, CACHE_TTL_MS);
    res.json({ picks });
  } catch (error) {
    console.error("[GET /api/bigb-picks] ERROR", error);
    const cached = getCache(CACHE_KEY);
    if (cached) {
      return res.json({ picks: cached });
    }
    res.status(500).json({ message: "Unable to load picks right now." });
  }
}
