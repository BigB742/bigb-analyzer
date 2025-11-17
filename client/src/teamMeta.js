const NFL_LOGO_BASE = "https://static.www.nfl.com/t_q-best/league/api/clubs/logos";

export const TEAM_META = {
  BAL: { name: "Baltimore Ravens", logoUrl: `${NFL_LOGO_BASE}/BAL` },
  IND: { name: "Indianapolis Colts", logoUrl: `${NFL_LOGO_BASE}/IND` },
  JAX: { name: "Jacksonville Jaguars", logoUrl: `${NFL_LOGO_BASE}/JAX` },
  BUF: { name: "Buffalo Bills", logoUrl: `${NFL_LOGO_BASE}/BUF` },
  MIA: { name: "Miami Dolphins", logoUrl: `${NFL_LOGO_BASE}/MIA` },
  NE: { name: "New England Patriots", logoUrl: `${NFL_LOGO_BASE}/NE` },
  DEN: { name: "Denver Broncos", logoUrl: `${NFL_LOGO_BASE}/DEN` },
  KC: { name: "Kansas City Chiefs", logoUrl: `${NFL_LOGO_BASE}/KC` },
  LAC: { name: "Los Angeles Chargers", logoUrl: `${NFL_LOGO_BASE}/LAC` },
  GB: { name: "Green Bay Packers", logoUrl: `${NFL_LOGO_BASE}/GB` },
  TB: { name: "Tampa Bay Buccaneers", logoUrl: `${NFL_LOGO_BASE}/TB` },
  DAL: { name: "Dallas Cowboys", logoUrl: `${NFL_LOGO_BASE}/DAL` },
  PHI: { name: "Philadelphia Eagles", logoUrl: `${NFL_LOGO_BASE}/PHI` },
  LAR: { name: "Los Angeles Rams", logoUrl: `${NFL_LOGO_BASE}/LAR` },
};

const FALLBACK_META = { name: "—", logoUrl: null };

export function getTeamMeta(code) {
  if (!code) return FALLBACK_META;
  return TEAM_META[code] || { name: code, logoUrl: null };
}
