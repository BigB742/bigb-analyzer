export function normalizeName(name) {
  if (name === undefined || name === null) return "";
  return String(name).trim();
}

export function normalizeTeam(team) {
  if (team === undefined || team === null) return "";
  return String(team).trim().toUpperCase();
}

export function normalizePosition(position) {
  if (position === undefined || position === null) return "";
  return String(position).trim().toUpperCase();
}

export function normalizeIdentity({ name, team, position }) {
  return {
    name: normalizeName(name),
    team: normalizeTeam(team),
    position: normalizePosition(position),
  };
}

export function normalizePlayerData(data = {}) {
  const identity = normalizeIdentity({
    name: data.name,
    team: data.team,
    position: data.position,
  });

  return {
    ...data,
    ...identity,
  };
}
