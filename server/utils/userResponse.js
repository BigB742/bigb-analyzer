import { canUseFreeUnlock } from "./freeUnlock.js";
import { getCurrentWeek } from "./currentWeek.js";

export function buildUserResponse(user) {
  if (!user) return null;
  const currentWeek = getCurrentWeek();
  const unlockStatus = canUseFreeUnlock(user);
  const weeklyUnlock = {
    playerId: user.weeklyUnlockPlayerId || null,
    playerName: user.weeklyUnlockPlayerName || null,
    week: user.weeklyUnlockWeek ?? null,
    usedAt: user.weeklyUnlockUsedAt || null,
  };
  const hasWeeklyUnlockThisWeek = Boolean(
    weeklyUnlock.playerId && weeklyUnlock.week === currentWeek,
  );
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isPremium: user.isPremium,
    canUseFreeUnlock: unlockStatus.allowed,
    weeklyUnlock,
    canUseWeeklyUnlock: !user.isPremium && !hasWeeklyUnlockThisWeek,
    currentWeek,
  };
}
