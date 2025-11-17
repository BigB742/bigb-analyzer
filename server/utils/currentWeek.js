export function getCurrentWeek() {
  const raw = process.env.CURRENT_WEEK;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
}
