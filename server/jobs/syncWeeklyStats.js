import { fetchAndUpsertStats } from "../services/statsIngestionService.js";

export async function syncWeeklyStats({ season, week, providerName } = {}) {
  return fetchAndUpsertStats({ season, week, providerName });
}
