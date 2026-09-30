import { afterEach, describe, expect, it } from 'vitest';
import { THEMES, THEME_KEY, Theme, applyTheme } from './theme.svelte.ts';

describe('the theme', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('follows the device until a person chooses', () => {
    expect(new Theme().name).toBe('system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('is set on the page’s root for every choice, and none for the system’s', () => {
    for (const theme of THEMES) {
      applyTheme(theme);
      expect(document.documentElement.dataset.theme).toBe(theme === 'system' ? undefined : theme);
    }
  });

  it('is kept, and applied when the page comes back', () => {
    new Theme().name = 'dark';
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    delete document.documentElement.dataset.theme;
    expect(new Theme().name).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignores a kept value it does not know', () => {
    localStorage.setItem(THEME_KEY, 'sepia');
    expect(new Theme().name).toBe('system');
  });
});
