const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export function canUseFreeUnlock(user) {
  if (!user) {
    return { allowed: false, reason: "unauthorized" };
  }
  if (user.isPremium) {
    return { allowed: true, reason: "premium" };
  }
  if (!user.hasUsedWeeklyUnlock) {
    return { allowed: true, reason: "never_used" };
  }
  if (!user.lastFreeUnlockAt) {
    return { allowed: true, reason: "missing_timestamp", needsReset: true };
  }
  const lastUsed = new Date(user.lastFreeUnlockAt).getTime();
  if (Number.isNaN(lastUsed)) {
    return { allowed: true, reason: "invalid_timestamp", needsReset: true };
  }
  const now = Date.now();
  if (now - lastUsed >= WEEK_IN_MS) {
    return { allowed: true, reason: "week_passed", needsReset: true };
  }
  return { allowed: false, reason: "free_unlock_used" };
}

export async function markFreeUnlockUsed(user) {
  if (!user) return;
  user.lastFreeUnlockAt = new Date();
  user.hasUsedWeeklyUnlock = true;
  await user.save();
}

export async function resetFreeUnlock(user) {
  if (!user) return;
  user.hasUsedWeeklyUnlock = false;
  user.lastFreeUnlockAt = null;
  await user.save();
}
