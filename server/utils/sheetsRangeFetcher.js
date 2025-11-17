import { getSheetValues } from "../services/googleSheetsClient.js";

const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

function cacheKey(spreadsheetId, range) {
  return `${spreadsheetId || "default"}:${range}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadRange({ spreadsheetId, range }) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const start = Date.now();
    try {
      const rows = await getSheetValues(range, spreadsheetId);
      const duration = Date.now() - start;
      console.log(
        `[Sheets] range:${range} attempt:${attempt} duration:${duration}ms rows:${rows?.length || 0}`,
      );
      return rows || [];
    } catch (error) {
      lastError = error;
      console.error(`[Sheets] range:${range} attempt:${attempt} failed:`, error.message);
      if (attempt < MAX_ATTEMPTS) {
        await wait(RETRY_DELAY_MS);
      }
    }
  }
  console.error(`[Sheets] range:${range} FAILED after ${MAX_ATTEMPTS} attempts`, lastError);
  throw lastError;
}

export async function fetchSheetRange({
  spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  range,
  ttlMs = DEFAULT_TTL_MS,
  forceRefresh = false,
}) {
  if (!range) {
    throw new Error("Google Sheets range is required");
  }
  const key = cacheKey(spreadsheetId, range);
  const now = Date.now();
  const entry = cache.get(key);
  if (!forceRefresh && entry && entry.expiresAt > now) {
    return entry.data;
  }

  const data = await loadRange({ spreadsheetId, range });
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

export function clearSheetRangeCache(range, spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
  if (!range) return;
  cache.delete(cacheKey(spreadsheetId, range));
}
