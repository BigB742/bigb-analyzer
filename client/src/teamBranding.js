export const teamBranding = {
  BAL: { primary: "#241773", secondary: "#9E7C0C" },
  IND: { primary: "#002C5F", secondary: "#C5C7CF" },
  JAX: { primary: "#006778", secondary: "#D7A22A" },
  BUF: { primary: "#00338D", secondary: "#C60C30" },
  MIA: { primary: "#008E97", secondary: "#FC4C02" },
  NE: { primary: "#002244", secondary: "#C60C30" },
  DEN: { primary: "#0A2342", secondary: "#FB4F14" },
  KC: { primary: "#E31837", secondary: "#FFB81C" },
  LAC: { primary: "#0080C6", secondary: "#FFC20E" },
  GB: { primary: "#203731", secondary: "#FFB612" },
  TB: { primary: "#D50A0A", secondary: "#FF7900" },
  DAL: { primary: "#003594", secondary: "#869397" },
  PHI: { primary: "#004C54", secondary: "#ACC0C6" },
  LAR: { primary: "#003594", secondary: "#FFA300" },
  NYG: { primary: "#0B2265", secondary: "#A71930" },
};

const DEFAULT_BRANDING = {
  primary: "#1f2937",
  secondary: "#4b5563",
};

export function getTeamBrand(team) {
  if (!team) return DEFAULT_BRANDING;
  return teamBranding[team] || DEFAULT_BRANDING;
}
