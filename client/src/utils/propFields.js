export const PROP_FIELDS = [
  { key: "projPassAtt", label: "Proj Pass Att", type: "number", placeholder: "31.5", unit: "att", bettingKey: "pass_att" },
  { key: "opponent", label: "Opponent", type: "text", placeholder: "@ CLE" },
  {
    key: "passYds",
    label: "Proj Pass Yds",
    type: "number",
    placeholder: "245.5",
    unit: "yds",
    summaryLabel: "Pass",
    bettingKey: "pass_yds",
  },
  {
    key: "passTD",
    label: "Proj Pass TD",
    type: "number",
    placeholder: "1.5",
    unit: "TD",
    bettingKey: "pass_td",
  },
  {
    key: "rushYds",
    label: "Proj Rush Yds",
    type: "number",
    placeholder: "48.5",
    unit: "yds",
    summaryLabel: "Rush",
    bettingKey: "rush_yds",
  },
  {
    key: "rushTD",
    label: "Proj Rush TD",
    type: "number",
    placeholder: "0.5",
    unit: "TD",
    bettingKey: "rush_td",
  },
  {
    key: "interceptions",
    label: "Proj INT",
    type: "number",
    placeholder: "0.5",
    unit: "INT",
    bettingKey: "int_line",
  },
];

const SUMMARY_FIELDS = PROP_FIELDS.filter((field) => Boolean(field.summaryLabel));

export function getPropFieldValue(qb, field) {
  if (!qb) return "";
  if (field.key === "opponent") {
    return qb.opponent ?? "";
  }
  if (field.key === "projPassAtt") {
    const explicit = qb.projPassAtt;
    return explicit ?? qb.props?.pass_att ?? "";
  }
  if (field.bettingKey) {
    return qb.props?.[field.bettingKey] ?? "";
  }
  return qb[field.key];
}

export function buildPropSummary(qb) {
  return SUMMARY_FIELDS.map((field) => {
    const value = getPropFieldValue(qb, field);
    if (value === undefined || value === null || value === "") {
      return `${field.summaryLabel}: —`;
    }
    const unit = field.unit ? ` ${field.unit}` : "";
    return `${field.summaryLabel}: ${value}${unit}`;
  }).join(" • ");
}
