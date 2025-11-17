import { fetchPlayerDetails } from "../providers/playerDetailProvider.js";
import { getCache, setCache } from "../cache.js";

const CACHE_TTL_MS = 15 * 60 * 1000;

function summarizeDetail(detail = {}) {
  const seasonValues = Object.values(detail.season || {});
  const homeValues = Object.values(detail.home || {});
  const awayValues = Object.values(detail.away || {});
  return {
    seasonFilled: seasonValues.filter((value) => value !== null && value !== undefined).length,
    homeFilled: homeValues.filter((value) => value !== null && value !== undefined).length,
    awayFilled: awayValues.filter((value) => value !== null && value !== undefined).length,
  };
}

export async function getPlayerDetails(req, res) {
  const { playerId } = req.params;
  const forceRefresh = req.query.forceRefresh === "true" || req.query.forceRefresh === "1";
  const opponent = req.query.opponent || "";
  const start = Date.now();
  const cacheKey = `playerDetail:${playerId}:${opponent || "default"}`;
  try {
    if (!forceRefresh) {
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }
    const detail = await fetchPlayerDetails(playerId, { forceRefresh, opponent });
    const summary = summarizeDetail(detail);
    console.log(
      `[GET /api/qb/${playerId}/details] opponent="${opponent}" seasonFilled=${summary.seasonFilled} homeFilled=${summary.homeFilled} awayFilled=${summary.awayFilled} duration=${Date.now() - start}ms`,
    );
    setCache(cacheKey, detail, CACHE_TTL_MS);
    res.json(detail);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error(`Failed to load details for ${playerId}:`, error);
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    res.status(status).json({ message: error.message || "Unable to load player details." });
  }
}

export async function getPlayerDetailsDebug(req, res) {
  const { playerId } = req.params;
  const opponent = req.query.opponent || "";
  const start = Date.now();
  try {
    const detail = await fetchPlayerDetails(playerId, { opponent });
    const summary = summarizeDetail(detail);
    const duration = Date.now() - start;
    res.json({
      playerId,
      opponent,
      ...summary,
      durationMs: duration,
    });
  } catch (error) {
    console.error(`[GET /api/qb/${playerId}/debug] ERROR`, error);
    res.status(error.statusCode || 500).json({ message: error.message || "Unable to debug player." });
  }
}
