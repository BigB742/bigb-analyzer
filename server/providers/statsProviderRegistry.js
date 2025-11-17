import {
  getWeeklyStats as getSleeperWeeklyStats,
  debugWeeklyStatKeys as sleeperDebugKeys,
  debugWeeklyRaw as sleeperDebugRaw,
} from "./sleeper.js";

const PROVIDERS = {
  sleeper: {
    name: "sleeper",
    async fetchWeeklyStats({ season, week }) {
      const rows = await getSleeperWeeklyStats({ season, week });
      return rows.map((row) => ({
        provider_player_id: row.externalId,
        season: row.season,
        week: row.week,
        position: row.position,
        team: row.team,
        name: row.name,
        stats: {
          pass_attempts: row.passAttempts ?? 0,
          pass_completions: row.completions ?? 0,
          pass_yards: row.passYds ?? 0,
          pass_tds: row.passTDs ?? 0,
          interceptions: row.interceptions ?? 0,
          rush_attempts: row.rushAtt ?? 0,
          rush_yards: row.rushYds ?? 0,
          rush_tds: row.rushTDs ?? 0,
          rec_targets: row.recTargets ?? 0,
          rec_receptions: row.rec ?? 0,
          rec_yards: row.recYds ?? 0,
          rec_tds: row.recTD ?? 0,
          fumbles: row.fumbles ?? 0,
          two_pt: row.twoPt ?? 0,
          fgm_0_19: row.fgm_0_19 ?? 0,
          fgm_20_29: row.fgm_20_29 ?? 0,
          fgm_30_39: row.fgm_30_39 ?? 0,
          fgm_40_49: row.fgm_40_49 ?? 0,
          fgm_50_59: row.fgm_50_59 ?? 0,
          fgm_60_plus: row.fgm_60_plus ?? 0,
          xpm: row.xpm ?? 0,
          fg_miss: row.fgMiss ?? 0,
          xp_miss: row.xpMiss ?? 0,
        },
      }));
    },
    async debugStatKeys(params) {
      return sleeperDebugKeys(params);
    },
    async debugRaw(params) {
      return sleeperDebugRaw(params);
    },
  },
};

export function getStatsProvider(providerName = process.env.DATA_SOURCE) {
  const key = String(providerName || "sleeper").toLowerCase();
  const provider = PROVIDERS[key];
  if (!provider) {
    const available = Object.keys(PROVIDERS).join(", ") || "none";
    throw new Error(`Unknown stats provider "${providerName}". Available: ${available}`);
  }
  return provider;
}

export function listProviders() {
  return Object.keys(PROVIDERS);
}
