import fetch from "node-fetch";
import {
  normalizeName,
  normalizePosition,
  normalizeTeam,
} from "../utils/playerNormalization.js";

const SLEEPER = {
  players: "https://api.sleeper.app/v1/players/nfl",
  leagueRosters: (leagueId) => `https://api.sleeper.app/v1/league/${leagueId}/rosters`,
  weeklyStatsA:  (season, week) => `https://api.sleeper.app/v1/stats/nfl/${season}/${week}?type=regular`,
  weeklyStatsB:  (season, week) => `https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}`,
};
const ALLOWED_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K"]);

function getStatsObject(row) {
  if (!row) return {};
  const stats = row.stats || row.stat || row.player_stats || row.playerStats || row;
  return stats && typeof stats === "object" ? stats : {};
}

function val(stats, key) {
  return Number(stats?.[key] ?? 0);
}

function extractStatMetrics(row) {
  const stat = getStatsObject(row);

  const passAttempts = val(stat, "pass_att") + val(stat, "passAttempts") + val(stat, "passing_attempts");
  const completions = val(stat, "pass_cmp") + val(stat, "completions") + val(stat, "passing_completions");
  const passYds = val(stat, "pass_yd") + val(stat, "pass_yds") + val(stat, "passing_yards");
  const passTDs = val(stat, "pass_td") + val(stat, "passing_tds");
  const interceptions = val(stat, "pass_int") + val(stat, "interceptions");
  const rushAtt = val(stat, "rush_att") + val(stat, "rushing_att");
  const rushYds = val(stat, "rush_yd") + val(stat, "rush_yds") + val(stat, "rushing_yards");
  const rushTDs = val(stat, "rush_td") + val(stat, "rushing_tds");
  const fumbles = val(stat, "fum_lost") + val(stat, "fumbles_lost") + val(stat, "fumbles");

  const rec = val(stat, "rec") + val(stat, "receiving_receptions");
  const recYds = val(stat, "rec_yd") + val(stat, "receiving_yards");
  const recTD = val(stat, "rec_td") + val(stat, "receiving_tds");

  const twoPt =
    val(stat, "two_pt") +
    val(stat, "twopt") +
    val(stat, "rush_2pt") +
    val(stat, "rec_2pt") +
    val(stat, "pass_2pt") +
    val(stat, "two_pt_conv") +
    val(stat, "two_ptm") +
    val(stat, "two_pt_conv_rush") +
    val(stat, "two_pt_conv_rec") +
    val(stat, "two_pt_conv_pass");

  const fgm_0_19 = val(stat, "fgm_0_19") + val(stat, "field_goals_made_0_19") + val(stat, "fgm_19");
  const fgm_20_29 = val(stat, "fgm_20_29") + val(stat, "field_goals_made_20_29");
  const fgm_30_39 = val(stat, "fgm_30_39") + val(stat, "field_goals_made_30_39");
  const fgm_40_49 = val(stat, "fgm_40_49") + val(stat, "field_goals_made_40_49");
  const fgm_50_59 = val(stat, "fgm_50_59") + val(stat, "field_goals_made_50_59");
  const fgm_60_plus = val(stat, "fgm_60_") + val(stat, "fgm_60_99") + val(stat, "field_goals_made_60_plus");

  const xpm = val(stat, "xpm") + val(stat, "xp") + val(stat, "xp_made") + val(stat, "extra_points_made");
  const fgMiss = val(stat, "fgmiss") + val(stat, "fg_miss") + val(stat, "field_goals_missed");
  const xpMiss = val(stat, "xpmiss") + val(stat, "xp_miss") + val(stat, "extra_points_missed");

  return {
    passAttempts: Number(passAttempts || 0),
    completions: Number(completions || 0),
    passYds: Number(passYds || 0),
    passTDs: Number(passTDs || 0),
    interceptions: Number(interceptions || 0),
    rushAtt: Number(rushAtt || 0),
    rushYds: Number(rushYds || 0),
    rushTDs: Number(rushTDs || 0),
    fumbles: Number(fumbles || 0),
    rec: Number(rec || 0),
    recYds: Number(recYds || 0),
    recTD: Number(recTD || 0),
    twoPt: Number(twoPt || 0),
    fgm_0_19: Number(fgm_0_19 || 0),
    fgm_20_29: Number(fgm_20_29 || 0),
    fgm_30_39: Number(fgm_30_39 || 0),
    fgm_40_49: Number(fgm_40_49 || 0),
    fgm_50_59: Number(fgm_50_59 || 0),
    fgm_60_plus: Number(fgm_60_plus || 0),
    xpm: Number(xpm || 0),
    fgMiss: Number(fgMiss || 0),
    xpMiss: Number(xpMiss || 0),
  };
}

function normalizeStatRecord({ meta, stat = {}, pid, season, week, position }) {
  const first = meta?.first_name?.trim();
  const last = meta?.last_name?.trim();
  const rawName = meta?.full_name?.trim() ||
    (first && last ? `${first} ${last}` : (last || first || "Unknown"));
  const name = normalizeName(rawName);
  if (!name) return null;

  const metrics = extractStatMetrics(stat);
  return {
    externalId: String(pid),
    name,
    team: normalizeTeam(meta?.team ?? ""),
    position: normalizePosition(position || meta?.position || ""),
    season: Number(season) || 0,
    week: Number(week) || 0,
    ...metrics,
  };
}

function mapQBRow({ meta, stat = {}, pid, season, week }) {
  const record = normalizeStatRecord({ meta, stat, pid, season, week, position: "QB" });
  if (!record) return null;
  const {
    externalId,
    name,
    team,
    position,
    passAttempts,
    completions,
    passYds,
    passTDs,
    interceptions,
    rushAtt,
    rushYds,
    rushTDs,
    fumbles,
    rec,
    recYds,
    recTD,
    twoPt,
    fgm_0_19,
    fgm_20_29,
    fgm_30_39,
    fgm_40_49,
    fgm_50_59,
    fgm_60_plus,
    xpm,
    fgMiss,
    xpMiss,
  } = record;

  return {
    externalId,
    name,
    team,
    position,
    passAttempts,
    completions,
    passYds,
    passTDs,
    interceptions,
    rushAtt,
    rushYds,
    rushTDs,
    fumbles,
    rec,
    recYds,
    recTD,
    twoPt,
    fgm_0_19,
    fgm_20_29,
    fgm_30_39,
    fgm_40_49,
    fgm_50_59,
    fgm_60_plus,
    xpm,
    fgMiss,
    xpMiss,
    season: Number(season) || 0,
    lastWeek: Number(week) || 0,
  };
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const text = await r.text().catch(()=> "");
    throw new Error(`[${r.status}] ${r.statusText} ${text}`.trim());
  }
  return r.json();
}

export async function fetchLeagueQBWeek({ leagueId, season, week }) {
  if (!leagueId) throw new Error("Missing leagueId");
  if (!season)   throw new Error("Missing season (e.g., 2025)");
  if (!week)     throw new Error("Missing week (e.g., 6)");

  const playersMeta = await getJSON(SLEEPER.players);
  const rosters = await getJSON(SLEEPER.leagueRosters(leagueId));
  const leaguePlayerIds = new Set();
  for (const r of rosters || []) {
    (r.players || []).forEach(pid => leaguePlayerIds.add(String(pid)));
    (r.reserve || []).forEach(pid => leaguePlayerIds.add(String(pid)));
    (r.taxi || []).forEach(pid => leaguePlayerIds.add(String(pid)));
  }

  let weeklyStats;
  try {
    weeklyStats = await getJSON(SLEEPER.weeklyStatsA(season, week));
  } catch {
    weeklyStats = await getJSON(SLEEPER.weeklyStatsB(season, week));
  }

  let byId = new Map();
  if (Array.isArray(weeklyStats)) {
    for (const s of weeklyStats) {
      if (s.player_id) byId.set(String(s.player_id), s);
    }
  } else if (weeklyStats && typeof weeklyStats === "object") {
    for (const [pid, s] of Object.entries(weeklyStats)) {
      byId.set(String(pid), s);
    }
  }

  const rows = [];
  for (const pid of leaguePlayerIds) {
    const meta = playersMeta[pid];
    if (!meta) continue;
    const pos = (meta.position || "").toUpperCase();
    if (pos !== "QB") continue;

    const stat = byId.get(pid) || {};
    const row = mapQBRow({ meta, stat, pid, season, week });
    if (row) rows.push(row);
  }

  return rows;
}

function mapPlayerMeta(pid, meta, position) {
  const first = meta?.first_name?.trim();
  const last = meta?.last_name?.trim();
  const rawName =
    meta?.full_name?.trim() ||
    (first && last ? `${first} ${last}` : (last || first || ""));
  const name = normalizeName(rawName);
  if (!name) return null;

  const active = meta?.active;
  if (active === false) return null;

  return {
    externalId: String(pid),
    name,
    team: normalizeTeam(meta?.team ?? ""),
    position,
  };
}

export async function fetchAllNFLPlayers() {
  const playersMeta = await getJSON(SLEEPER.players);
  const rows = [];
  let filteredOut = 0;

  for (const [pid, meta] of Object.entries(playersMeta || {})) {
    const positionRaw =
      meta?.position ||
      (Array.isArray(meta?.fantasy_positions) ? meta.fantasy_positions[0] : "") ||
      "";
    const position = normalizePosition(positionRaw);

    if (!position || !ALLOWED_POSITIONS.has(position)) {
      filteredOut++;
      continue;
    }

    const mapped = mapPlayerMeta(pid, meta, position);
    if (mapped) rows.push(mapped);
  }

  return { players: rows, filteredOut };
}

async function fetchWeeklyStatsRaw(season, week) {
  let weeklyStats;
  try {
    weeklyStats = await getJSON(SLEEPER.weeklyStatsA(season, week));
  } catch {
    weeklyStats = await getJSON(SLEEPER.weeklyStatsB(season, week));
  }
  return weeklyStats;
}

export async function fetchSleeperWeeklyStats({ season, week }) {
  const raw = await fetchWeeklyStatsRaw(season, week);
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const rows = [];
    for (const [playerId, stats] of Object.entries(raw)) {
      rows.push({ player_id: playerId, stats });
    }
    return rows;
  }
  return [];
}

export function extractStatKeys(rawRows, sample = 200) {
  const keys = new Set();
  for (const row of rawRows.slice(0, sample)) {
    const statsObj = row?.stats || row?.stat || row?.player_stats || null;
    if (statsObj && typeof statsObj === "object") {
      Object.keys(statsObj).forEach((k) => keys.add(k));
    }
  }
  return Array.from(keys).sort();
}

export async function debugWeeklyRaw({ season, week, sample = 5 }) {
  const raw = await fetchSleeperWeeklyStats({ season, week });
  return raw.slice(0, sample);
}

export async function getWeeklyStats({ season, week }) {
  if (!season) throw new Error("Missing season");
  if (!week) throw new Error("Missing week");

  const playersMeta = await getJSON(SLEEPER.players);
  const weeklyStats = await fetchSleeperWeeklyStats({ season, week });

  const rows = [];
  const addRow = (pid, rawRow) => {
    const meta = playersMeta[pid];
    if (!meta) return;
    const positionRaw = normalizePosition(meta.position || (Array.isArray(meta.fantasy_positions) ? meta.fantasy_positions[0] : ""));
    if (!positionRaw || !ALLOWED_POSITIONS.has(positionRaw)) return;
    const record = normalizeStatRecord({ meta, stat: rawRow, pid, season, week, position: positionRaw });
    if (record) rows.push(record);
  };

  for (const row of weeklyStats) {
    if (!row) continue;
    const pid = String(row.player_id ?? row.playerId ?? row.id ?? "");
    if (!pid) continue;
    addRow(pid, row);
  }

  return rows.map((row) => ({
    ...row,
    team: row.team || "",
  }));
}

export async function debugWeeklyStatKeys({ season, week, sample = 50 }) {
  const raw = await fetchSleeperWeeklyStats({ season, week });
  return extractStatKeys(raw, sample);
}
