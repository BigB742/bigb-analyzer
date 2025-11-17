const PLAYER_METADATA = {
  "lamar-jackson": { name: "Lamar Jackson", team: "BAL", tab: "Lamar Jackson" },
  "daniel-jones": { name: "Daniel Jones", team: "IND", tab: "Daniel Jones" },
  "trevor-lawrence": { name: "Trevor Lawrence", team: "JAX", tab: "Trevor Lawrence" },
  "josh-allen": { name: "Josh Allen", team: "BUF", tab: "Josh Allen" },
  "tua-tagovailoa": { name: "Tua Tagovailoa", team: "MIA", tab: "Tua Tagovailoa" },
  "drake-maye": { name: "Drake Maye", team: "NE", tab: "Drake Maye" },
  "bo-nix": { name: "Bo Nix", team: "DEN", tab: "Bo Nix" },
  "patrick-mahomes": { name: "Patrick Mahomes", team: "KC", tab: "Patrick Mahomes" },
  "justin-herbert": { name: "Justin Herbert", team: "LAC", tab: "Justin Herbert" },
  "jordan-love": { name: "Jordan Love", team: "GB", tab: "Jordan Love" },
  "baker-mayfield": { name: "Baker Mayfield", team: "TB", tab: "Baker Mayfield" },
  "dak-prescott": { name: "Dak Prescott", team: "DAL", tab: "Dak Prescott" },
  "jalen-hurts": { name: "Jalen Hurts", team: "PHI", tab: "Jalen Hurts" },
  "matthew-stafford": { name: "Matthew Stafford", team: "LAR", tab: "Matthew Stafford" },
};

function normalizePlayerId(playerId = "") {
  return String(playerId).trim().toLowerCase();
}

function titleCaseFromSlug(slug) {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getPlayerMetadata(playerId) {
  const normalized = normalizePlayerId(playerId);
  const match = PLAYER_METADATA[normalized];
  if (match) {
    return { ...match, id: normalized };
  }
  const fallbackName = titleCaseFromSlug(normalized || playerId || "Player");
  return {
    id: normalized,
    name: fallbackName,
    team: undefined,
    tab: fallbackName,
  };
}

export function listAllPlayerMetadata() {
  return Object.entries(PLAYER_METADATA).map(([id, data]) => ({
    id,
    ...data,
  }));
}
