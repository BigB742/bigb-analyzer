import { listAllPlayerMetadata } from "../data/playerMetadata.js";
import {
  BETTING_PROPS_LABEL_RANGE,
  BETTING_PROPS_VALUE_RANGE,
  createEmptyBettingProps,
  parseBettingPropsFromRanges,
} from "../utils/bettingProps.js";
import { fetchSheetRange } from "../utils/sheetsRangeFetcher.js";

const OPPONENT_NAME_RANGE = (tab) => `'${tab}'!F15:F15`;
const PROJECTION_WEEK_RANGE = (tab) => `'${tab}'!E13:E13`;
const SHEET_TTL_MS = 120 * 1000;

function cleanOpponent(value = "") {
  return value.replace(/^(vs|@)\s*/i, "").trim();
}

function normalizeProjectionWeek(value = "") {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const weekMatch = trimmed.match(/week\s*#?\s*(\d+)/i);
  if (weekMatch) {
    return `Week ${weekMatch[1]}`;
  }
  return trimmed.replace(/#/g, "").trim();
}

function buildLine(meta, rawProps, opponentRaw, projectionWeekRaw) {
  const opponentLabel = (opponentRaw || "").trim();
  const props = rawProps || createEmptyBettingProps();
  return {
    player_id: meta.id,
    name: meta.name,
    team: meta.team || "",
    opponent: cleanOpponent(opponentLabel) || opponentLabel || "",
    projectionWeek: normalizeProjectionWeek(projectionWeekRaw || ""),
    props,
    bettingProps: props,
    pass_att: props.pass_att,
    pass_yds: props.pass_yds,
    pass_td: props.pass_td,
    rush_yds: props.rush_yds,
    rush_td: props.rush_td,
    int_line: props.int_line,
  };
}

async function fetchPlayerLine(meta, options = {}) {
  if (!meta?.tab) {
    throw new Error(`Player ${meta.name || meta.id} is missing a sheet tab.`);
  }

  const { forceRefresh = false } = options;
  const shared = (range) => ({ range, ttlMs: SHEET_TTL_MS, forceRefresh });

  const [labelRows, valueRows, opponentRows, weekRows] = await Promise.all([
    fetchSheetRange(shared(BETTING_PROPS_LABEL_RANGE(meta.tab))),
    fetchSheetRange(shared(BETTING_PROPS_VALUE_RANGE(meta.tab))),
    fetchSheetRange(shared(OPPONENT_NAME_RANGE(meta.tab))),
    fetchSheetRange(shared(PROJECTION_WEEK_RANGE(meta.tab))),
  ]);

  const bettingProps = parseBettingPropsFromRanges(labelRows, valueRows);
  const opponentRaw = opponentRows?.[0]?.[0] || "";
  const projectionWeekRaw = weekRows?.[0]?.[0] || "";
  return buildLine(meta, bettingProps, opponentRaw, projectionWeekRaw);
}

export async function fetchQBLines(options = {}) {
  const { forceRefresh = false } = options;
  const start = Date.now();
  const metadataList = listAllPlayerMetadata();
  if (!metadataList.length) {
    throw new Error("No player metadata available.");
  }
  const qbLines = await Promise.all(metadataList.map((meta) => fetchPlayerLine(meta, { forceRefresh })));
  console.log(
    `[fetchQBLines] fetched ${qbLines.length} players in ${Date.now() - start}ms`,
  );
  return qbLines;
}
