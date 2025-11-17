const DEFAULT_BETTING_PROPS = Object.freeze({
  pass_att: null,
  completions: null,
  pass_yds: null,
  pass_td: null,
  rush_yds: null,
  rush_td: null,
  int_line: null,
});

const BETTING_LABEL_MAP = new Map([
  ["passingattempts", "pass_att"],
  ["passattempts", "pass_att"],
  ["pass att", "pass_att"],
  ["attempts", "pass_att"],
  ["completions", "completions"],
  ["passingyards", "pass_yds"],
  ["passyards", "pass_yds"],
  ["passingyds", "pass_yds"],
  ["passyds", "pass_yds"],
  ["passingtds", "pass_td"],
  ["passingtd", "pass_td"],
  ["passingtd's", "pass_td"],
  ["passingtouchdowns", "pass_td"],
  ["pass touchdowns", "pass_td"],
  ["interceptions", "int_line"],
  ["ints", "int_line"],
  ["intline", "int_line"],
  ["rushyards", "rush_yds"],
  ["rushingyards", "rush_yds"],
  ["rushyds", "rush_yds"],
  ["rushingtds", "rush_td"],
  ["rushingtd", "rush_td"],
  ["rushingtd's", "rush_td"],
  ["rushingtouchdowns", "rush_td"],
]);

export const BETTING_PROPS_LABEL_RANGE = (tab) => `'${tab}'!A33:A39`;
export const BETTING_PROPS_VALUE_RANGE = (tab) => `'${tab}'!B33:B39`;

function normalizeBettingLabel(value) {
  return (value || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseBettingNumber(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value).replace(/[^0-9.\-]/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

export function createEmptyBettingProps() {
  return { ...DEFAULT_BETTING_PROPS };
}

export function parseBettingPropsFromRanges(labelRows = [], valueRows = []) {
  const bettingProps = createEmptyBettingProps();
  const rowCount = Math.max(labelRows.length, valueRows.length);
  for (let i = 0; i < rowCount; i += 1) {
    const label = labelRows[i]?.[0];
    const normalized = normalizeBettingLabel(label);
    const field = BETTING_LABEL_MAP.get(normalized);
    if (!field) continue;
    const rawValue = valueRows[i]?.[0];
    bettingProps[field] = parseBettingNumber(rawValue);
  }
  return bettingProps;
}
