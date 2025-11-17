import { fetchSheetRange } from "../utils/sheetsRangeFetcher.js";
import { listAllPlayerMetadata } from "../data/playerMetadata.js";

const RANGE = "'BigB_Picks'!A2:J";
const SHEET_TTL_MS = 120 * 1000;

function parseNumber(value) {
  if (value === undefined || value === null) return null;
  const raw = typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  if (raw === "") return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

const PLAYER_NAME_MAP = (() => {
  const map = new Map();
  listAllPlayerMetadata().forEach(({ id, name }) => {
    if (name) {
      map.set(name.toLowerCase(), id);
    }
  });
  return map;
})();

function lookupPlayerId(name) {
  if (!name) return null;
  return PLAYER_NAME_MAP.get(String(name).toLowerCase()) || null;
}

function parseWeekNumber(value) {
  if (value === undefined || value === null) return null;
  const match = String(value).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function rowToPick(row = []) {
  const [
    week,
    date,
    qb,
    team,
    opponent,
    market,
    line,
    projection,
    pick,
    result,
  ] = row;

  return {
    week: week ?? "",
    date: date ?? "",
    qb: qb ?? "",
    team: team ?? "",
    opponent: opponent ?? "",
    market: market ?? "",
    line: parseNumber(line),
    projection: parseNumber(projection),
    pick: pick ?? "",
    result: (result ?? "").toUpperCase(),
    playerId: lookupPlayerId(qb),
    weekNumber: parseWeekNumber(week),
  };
}

function normalizeRows(rows = []) {
  return rows
    .filter((row) => row?.some((cell) => cell && String(cell).trim() !== ""))
    .map((row) => rowToPick(row));
}

export async function getBigbPicks(options = {}) {
  const { forceRefresh = false } = options;
  const rows = await fetchSheetRange({ range: RANGE, ttlMs: SHEET_TTL_MS, forceRefresh });
  console.log(`[bigbPicksProvider] rows from sheet: ${rows?.length || 0}`);
  return normalizeRows(rows || []);
}
