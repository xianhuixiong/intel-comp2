const FAVORITES_KEY = "aicp_favorites_v2";
const PREFS_KEY = "aicp_prefs_v2";

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr);
  } catch {
    // ignore
  }
  return new Set();
}

export function saveFavorites(set) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
}

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { bilingual: true };
    const obj = JSON.parse(raw);
    return {
      bilingual: Boolean(obj?.bilingual ?? true),
    };
  } catch {
    return { bilingual: true };
  }
}

export function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
