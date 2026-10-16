import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Icon, { type IconName } from './Icon.svelte';

const NAMES: IconName[] = [
  'sound',
  'session',
  'style',
  'time',
  'key',
  'muse',
  'timing',
  'song',
  'melody',
  'rhythm',
  'mix',
];

describe('the shell’s icons', () => {
  it('draws a picture for every name, hidden from a screen reader', () => {
    for (const name of NAMES) {
      const { container, unmount } = render(Icon, { name });
      const glyph = container.querySelector('svg.glyph')!;
      expect(glyph, name).toHaveAttribute('aria-hidden', 'true');
      expect(glyph.children.length, name).toBeGreaterThan(0);
      unmount();
    }
  });

  it('draws each one differently', () => {
    const drawn = NAMES.map((name) => {
      const { container, unmount } = render(Icon, { name });
      const html = container.innerHTML;
      unmount();
      return html;
    });
    expect(new Set(drawn).size).toBe(NAMES.length);
  });
});
