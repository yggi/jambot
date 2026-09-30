/**
 * The theme: follow the device (`system`), or always dark or light. Kept in
 * the browser and applied to the page's root as `data-theme` (`app.css` has
 * the colours for each), where `system` sets none and the device's own
 * preference decides. Storage may be missing or refuse (a private window):
 * the choice then lasts as long as the page.
 */

export const THEME_KEY = 'jambot:theme';

export const THEMES = ['system', 'dark', 'light'] as const;
export type ThemeName = (typeof THEMES)[number];

const isTheme = (value: unknown): value is ThemeName => THEMES.includes(value as ThemeName);

/** Set a theme on a page's root element. */
export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement) {
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

const stored = (): unknown => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};

export class Theme {
  #name = $state<ThemeName>('system');

  constructor() {
    const kept = stored();
    if (isTheme(kept)) this.#name = kept;
    applyTheme(this.#name);
  }

  get name(): ThemeName {
    return this.#name;
  }

  set name(name: ThemeName) {
    this.#name = name;
    applyTheme(name);
    try {
      localStorage.setItem(THEME_KEY, name);
    } catch {
      // Nothing is lost but a choice to make again.
    }
  }
}
