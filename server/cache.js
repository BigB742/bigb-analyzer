const store = new Map();

export function setCache(key, data, ttlMs) {
  if (!key) return;
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function getCache(key) {
  if (!key) return null;
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}
