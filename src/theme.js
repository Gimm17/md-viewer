// theme.js — light/dark theme toggle with persistence via Neutralino storage.

const KEY = "theme";
let current = "light";

/** Load persisted theme (falls back to light). Returns the theme string. */
export async function loadTheme() {
  try {
    const val = await Neutralino.storage.getData(KEY);
    if (val === "dark" || val === "light") current = val;
  } catch (_) {
    // No stored value yet.
  }
  applyTheme(current);
  return current;
}

/** Apply a theme to the DOM + native window. */
export function applyTheme(theme) {
  current = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", current);
  try {
    Neutralino.window.setTheme(current);
  } catch (_) {
    /* window.setTheme may be unsupported on some platforms */
  }
}

/** Toggle and persist. Returns the new theme. */
export async function toggleTheme() {
  current = current === "dark" ? "light" : "dark";
  applyTheme(current);
  try {
    await Neutralino.storage.setData(KEY, current);
  } catch (_) {
    /* ignore persistence failure */
  }
  return current;
}

export function isDark() {
  return current === "dark";
}
