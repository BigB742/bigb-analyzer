import { fetchSheetRange } from "../utils/sheetsRangeFetcher.js";
import { getPlayerMetadata } from "../data/playerMetadata.js";
import {
  BETTING_PROPS_LABEL_RANGE,
  BETTING_PROPS_VALUE_RANGE,
  parseBettingPropsFromRanges,
} from "../utils/bettingProps.js";

const CACHE_TTL_MS = 60 * 1000;
const SHEET_TTL_MS = 120 * 1000;
const cache = new Map();

const FIELD_ALIASES = {
  games: ["games", "gp"],
  opponent: ["opponent", "opp"],
  pass_att: ["pass att", "pass attempts", "attempts"],
  completions: ["completions", "comp"],
  pass_yds: ["pass yds", "pass yards", "passing yards"],
  pass_td: ["pass td", "passing tds", "pass touchdowns"],
  interceptions: ["int", "ints", "interceptions"],
  rush_yds: ["rush yds", "rush yards", "rushing yards"],
  rush_td: ["rush td", "rush touchdowns"],
  context: ["context"],
  note: ["note"],
};

const METRIC_ALIASES = {
  pass_att: ["passingattempts", "passattempts", "attempts", "passatt"],
  completions: ["completions", "comp"],
  pass_yds: ["passingyards", "passyards", "yards"],
  pass_td: ["passingtds", "passingtd", "passingtouchdowns", "passingtouchdown"],
  interceptions: ["interceptions", "ints"],
  rush_yds: ["rushingyards", "rushyards", "rushingys", "rushys"],
  rush_td: ["rushingtds", "rushingtd", "rushingtouchdowns", "rushingtouchdown"],
};

const LABEL_FIELD_MAP = new Map();
Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
  aliases.forEach((alias) => {
    LABEL_FIELD_MAP.set(normalizeLabel(alias), field);
  });
});

const METRIC_FIELD_MAP = new Map();
Object.entries(METRIC_ALIASES).forEach(([field, aliases]) => {
  aliases.forEach((alias) => METRIC_FIELD_MAP.set(normalizeLabel(alias), field));
});

const STAT_FIELDS = ["pass_att", "completions", "pass_yds", "pass_td", "interceptions", "rush_yds", "rush_td"];

const LABEL_TO_FIELD = {
  passingattempts: "pass_att",
  passattempts: "pass_att",
  attempts: "pass_att",
  completions: "completions",
  comp: "completions",
  passingyards: "pass_yds",
  passyards: "pass_yds",
  yards: "pass_yds",
  passingtds: "pass_td",
  passingtd: "pass_td",
  passingtouchdowns: "pass_td",
  touchdowns: "pass_td",
  "passingtd's": "pass_td",
  interception: "interceptions",
  interceptions: "interceptions",
  ints: "interceptions",
  rushingyards: "rush_yds",
  rushyards: "rush_yds",
  rushingtds: "rush_td",
  rushingtd: "rush_td",
  rushingtouchdowns: "rush_td",
  "rushingtd's": "rush_td",
};

const SEASON_LABEL_RANGE = (tab) => `'${tab}'!A5:A11`;
const SEASON_HEADER_RANGE = (tab) => `'${tab}'!B4:Z4`;
const SEASON_STATS_RANGE = (tab) => `'${tab}'!B5:Z11`;
const HOME_LABEL_RANGE = (tab) => `'${tab}'!A14:A20`;
const HOME_VALUE_RANGE = (tab) => `'${tab}'!C14:C20`;
const AWAY_LABEL_RANGE = (tab) => `'${tab}'!A23:A29`;
const AWAY_VALUE_RANGE = (tab) => `'${tab}'!C23:C29`;
const BETTING_RANGE = (tab) => `'${tab}'!A46:H60`;
const OPPONENT_NAME_RANGE = (tab) => `'${tab}'!F15:F15`;
const QB_ALL_TIME_LABEL_RANGES = {
  all: (tab) => `'${tab}'!F16:F22`,
  home: (tab) => `'${tab}'!F26:F32`,
  away: (tab) => `'${tab}'!F36:F42`,
};
const QB_ALL_TIME_VALUE_RANGES = {
  all: (tab) => `'${tab}'!G16:G22`,
  home: (tab) => `'${tab}'!G26:G32`,
  away: (tab) => `'${tab}'!G36:G42`,
};
const SEASON_AGG_LABEL_RANGES = {
  all: (tab) => `'${tab}'!J16:J22`,
  home: (tab) => `'${tab}'!J26:J32`,
  away: (tab) => `'${tab}'!J36:J42`,
};
const SEASON_AGG_VALUE_RANGES = {
  all: (tab) => `'${tab}'!K16:K22`,
  home: (tab) => `'${tab}'!K26:K32`,
  away: (tab) => `'${tab}'!K36:K42`,
};

function normalizeLabel(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function parseNumber(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.\-]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseStatValue(field, raw) {
  if (field === "opponent" || field === "context" || field === "note") {
    if (raw === undefined || raw === null) return "";
    return String(raw).trim();
  }
  return parseNumber(raw);
}

function normalizeMetricLabel(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findSeasonAverageColumnIndex(headerRow = []) {
  const normalizedHeaders = headerRow.map((cell) => String(cell ?? "").trim());
  const exactIndex = normalizedHeaders.findIndex(
    (value) => value && value.toLowerCase() === "season average",
  );
  if (exactIndex !== -1) {
    return exactIndex;
  }
  for (let i = normalizedHeaders.length - 1; i >= 0; i -= 1) {
    if (normalizedHeaders[i]) {
      return i;
    }
  }
  return null;
}

function buildValueRowsFromColumn(rows = [], columnIndex = null, expectedLength = rows.length) {
  const safeIndex = typeof columnIndex === "number" && columnIndex >= 0 ? columnIndex : null;
  const length = Math.max(expectedLength, rows.length);
  const valueRows = [];
  for (let i = 0; i < length; i += 1) {
    const row = rows[i] || [];
    const cellValue = safeIndex === null ? "" : row[safeIndex];
    valueRows.push([cellValue]);
  }
  return valueRows;
}

function findStatRowIndex(labelRows = [], targetField) {
  return labelRows.findIndex((row) => {
    const labelCell = row?.[0];
    const normalized = LABEL_TO_FIELD[normalizeMetricLabel(labelCell)];
    return normalized === targetField;
  });
}

function buildPassingYardsSeries(headerRow = [], statsRows = [], labelRows = []) {
  const normalizedHeaders = headerRow.map((cell) => String(cell ?? "").trim());
  const passYdsRowIndex = findStatRowIndex(labelRows, "pass_yds");
  if (passYdsRowIndex === -1) return [];
  const passYdsRow = statsRows[passYdsRowIndex] || [];
  const points = [];
  normalizedHeaders.forEach((label, index) => {
    if (!label) return;
    if (/season\s+average/i.test(label)) return;
    if (label.trim().toLowerCase() === "average") return;
    const yards = parseNumber(passYdsRow[index]);
    if (yards === null) return;
    points.push({
      weekLabel: label,
      yards,
    });
  });
  return points;
}

function buildStatObjectFromRanges(labelRows = [], valueRows = []) {
  const season = {};
  const maxRows = Math.max(labelRows.length, valueRows.length);
  for (let i = 0; i < maxRows; i += 1) {
    const labelCell = labelRows[i]?.[0] || "";
    const valueCellRaw = valueRows[i]?.[0] ?? "";
    const sanitizedValue = typeof valueCellRaw === "number"
      ? valueCellRaw
      : String(valueCellRaw).replace(/,/g, "").trim();
    const field = LABEL_TO_FIELD[normalizeMetricLabel(labelCell)];
    if (!field) continue;
    const numericValue = sanitizedValue === "" ? null : Number(sanitizedValue);
    season[field] = Number.isNaN(numericValue) ? null : numericValue;
  }

  STAT_FIELDS.forEach((key) => {
    if (!(key in season)) {
      season[key] = null;
    }
  });

  return season;
}

function parseBettingBlock(rows = []) {
  const cleaned = rows.filter((row) => row?.some((cell) => cell && String(cell).trim() !== ""));
  if (!cleaned.length) return null;

  const betting = {};
  const firstRow = cleaned.shift();
  if (firstRow) {
    const contextCell = firstRow.find((cell, idx) => {
      if (!cell) return false;
      const text = String(cell).trim();
      if (!text) return false;
      if (idx === 0 && /betting/i.test(text)) return false;
      return true;
    });
    betting.context = contextCell ? String(contextCell).trim() : String(firstRow[0] || "").trim();
  }

  cleaned.forEach((row) => {
    if (!row.length) return;
    const normalized = normalizeLabel(row[0]);
    if (normalized.includes("note")) {
      const noteCell = row.slice(1).find((cell) => cell && String(cell).trim() !== "");
      betting.note = noteCell ? String(noteCell).trim() : String(row[0]).replace(/note[:\-]*/i, "").trim();
      return;
    }
    const field = LABEL_FIELD_MAP.get(normalized);
    if (!field) return;
    const value = row.slice(1).find((cell) => cell && String(cell).trim() !== "");
    betting[field] = parseStatValue(field, value);
  });

  return betting;
}

function normalizeOpponent(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function fetchPlayerDetails(playerId, options = {}) {
  const { forceRefresh = false, opponent = "" } = options;
  const opponentKey = normalizeOpponent(opponent);
  const cacheKey = `${playerId}:${opponentKey}`;
  const now = Date.now();
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
  }

  const metadata = getPlayerMetadata(playerId);
  const tab = metadata.tab;
  if (!tab) {
    const error = new Error("Player tab not found.");
    error.statusCode = 404;
    throw error;
  }

  const [
    seasonLabelRows,
    seasonHeaderRows,
    seasonStatsRows,
    homeLabelRows,
    homeValueRows,
    awayLabelRows,
    awayValueRows,
    bettingPropLabelRows,
    bettingPropValueRows,
    bettingRows,
    opponentNameRows,
    qbAllTimeLabelAll,
    qbAllTimeValueAll,
    qbAllTimeLabelHome,
    qbAllTimeValueHome,
    qbAllTimeLabelAway,
    qbAllTimeValueAway,
    seasonAggLabelAll,
    seasonAggValueAll,
    seasonAggLabelHome,
    seasonAggValueHome,
    seasonAggLabelAway,
    seasonAggValueAway,
  ] = await Promise.all([
    fetchSheetRange({ range: SEASON_LABEL_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_HEADER_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_STATS_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: HOME_LABEL_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: HOME_VALUE_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: AWAY_LABEL_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: AWAY_VALUE_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({
      range: BETTING_PROPS_LABEL_RANGE(tab),
      ttlMs: SHEET_TTL_MS,
      forceRefresh,
    }),
    fetchSheetRange({
      range: BETTING_PROPS_VALUE_RANGE(tab),
      ttlMs: SHEET_TTL_MS,
      forceRefresh,
    }),
    fetchSheetRange({ range: BETTING_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: OPPONENT_NAME_RANGE(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: QB_ALL_TIME_LABEL_RANGES.all(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: QB_ALL_TIME_VALUE_RANGES.all(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: QB_ALL_TIME_LABEL_RANGES.home(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: QB_ALL_TIME_VALUE_RANGES.home(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: QB_ALL_TIME_LABEL_RANGES.away(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: QB_ALL_TIME_VALUE_RANGES.away(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_AGG_LABEL_RANGES.all(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_AGG_VALUE_RANGES.all(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_AGG_LABEL_RANGES.home(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_AGG_VALUE_RANGES.home(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_AGG_LABEL_RANGES.away(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
    fetchSheetRange({ range: SEASON_AGG_VALUE_RANGES.away(tab), ttlMs: SHEET_TTL_MS, forceRefresh }),
  ]);

  const seasonHeaderRow = seasonHeaderRows?.[0] || [];
  const seasonAverageColumnIndex = findSeasonAverageColumnIndex(seasonHeaderRow);
  const dynamicSeasonValueRows = buildValueRowsFromColumn(
    seasonStatsRows || [],
    seasonAverageColumnIndex,
    seasonLabelRows?.length || 0,
  );
  const season = buildStatObjectFromRanges(seasonLabelRows, dynamicSeasonValueRows);
  const passingYardsByGame = buildPassingYardsSeries(seasonHeaderRow, seasonStatsRows, seasonLabelRows);
  const home = buildStatObjectFromRanges(homeLabelRows, homeValueRows);
  const away = buildStatObjectFromRanges(awayLabelRows, awayValueRows);
  const props = parseBettingPropsFromRanges(bettingPropLabelRows, bettingPropValueRows);
  const betting = parseBettingBlock(bettingRows);
  const opponentNameRaw = (opponentNameRows?.[0]?.[0] || "").trim();
  const cleanedOpponentName = opponentNameRaw.replace(/^(vs|@)\s*/i, "").trim();

  const opponentAllTime = {
    opponentName: opponentNameRaw,
    all: buildStatObjectFromRanges(qbAllTimeLabelAll, qbAllTimeValueAll),
    home: buildStatObjectFromRanges(qbAllTimeLabelHome, qbAllTimeValueHome),
    away: buildStatObjectFromRanges(qbAllTimeLabelAway, qbAllTimeValueAway),
  };

  const opponentSeasonAgg = {
    opponentName: opponentNameRaw,
    all: buildStatObjectFromRanges(seasonAggLabelAll, seasonAggValueAll),
    home: buildStatObjectFromRanges(seasonAggLabelHome, seasonAggValueHome),
    away: buildStatObjectFromRanges(seasonAggLabelAway, seasonAggValueAway),
  };

  const detail = {
    player_id: metadata.id || playerId,
    name: metadata.name,
    team: metadata.team,
    opponent: cleanedOpponentName || opponent,
    season,
    opponentLabel: opponentNameRaw,
    home,
    away,
    props,
    bettingProps: props,
    betting: betting || undefined,
    opponentAllTime,
    opponentSeasonAgg,
    passingYardsByGame,
  };

  cache.set(cacheKey, {
    data: detail,
    expiresAt: now + CACHE_TTL_MS,
  });

  return detail;
}
