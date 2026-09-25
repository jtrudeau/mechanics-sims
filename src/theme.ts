export type ThemeName = 'light' | 'dark';

const KEY = 'sn1-theme';

export function readTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyStoredTheme() {
  applyTheme(readTheme());
}
