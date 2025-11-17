const STORAGE_KEY = "fantasy-analyzer.watchlist";

function safeParse(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    return fallback;
  }
}

export function loadWatchlist() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return safeParse(raw);
}

export function persistWatchlist(list) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("[watchlist] Unable to persist", err);
  }
}

export function toggleWatchlist(list, id) {
  const normalized = String(id);
  const set = new Set(list.map(String));
  if (set.has(normalized)) {
    set.delete(normalized);
  } else {
    set.add(normalized);
  }
  return Array.from(set);
}

export function isStarred(listOrSet, id) {
  const normalized = String(id);
  if (listOrSet instanceof Set) {
    return listOrSet.has(normalized);
  }
  if (Array.isArray(listOrSet)) {
    return listOrSet.map(String).includes(normalized);
  }
  return false;
}
