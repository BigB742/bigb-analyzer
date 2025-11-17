const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

const store = new Map();

function now() {
  return Date.now();
}

function setEntry(key, value, ttlMs) {
  store.set(key, {
    value,
    cachedAt: now(),
    ttlMs,
    refreshing: null,
  });
}

export async function getCachedOrLoad(key, loader, options = {}) {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const allowStale = options.allowStale ?? true;
  const entry = store.get(key);
  const timestamp = now();

  if (entry) {
    const age = timestamp - entry.cachedAt;
    if (age < ttlMs) {
      return { data: entry.value, cacheStatus: "hit" };
    }

    if (allowStale) {
      if (!entry.refreshing) {
        entry.refreshing = Promise.resolve()
          .then(() => loader())
          .then((value) => setEntry(key, value, ttlMs))
          .catch((err) => {
            console.error(`[cache] refresh failed for ${key}:`, err?.message || err);
            // reset refreshing flag but keep stale data
            const current = store.get(key);
            if (current) current.refreshing = null;
          });
      }
      return { data: entry.value, cacheStatus: "stale" };
    }
  }

  const value = await loader();
  setEntry(key, value, ttlMs);
  return { data: value, cacheStatus: entry ? "refreshed" : "miss" };
}

export function clearCache(key) {
  if (key) {
    store.delete(key);
  } else {
    store.clear();
  }
}

export function getCacheSnapshot() {
  const snapshot = {};
  for (const [key, entry] of store.entries()) {
    snapshot[key] = {
      cachedAt: entry.cachedAt,
      ttlMs: entry.ttlMs,
      hasRefreshInFlight: Boolean(entry.refreshing),
    };
  }
  return snapshot;
}
