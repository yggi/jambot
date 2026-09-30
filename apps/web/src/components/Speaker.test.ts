import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Speaker, { wavesOf } from './Speaker.svelte';

const drawn = (props: { level: number; muted?: boolean; soloed?: boolean }) => {
  const { container } = render(Speaker, props);
  return {
    waves: container.querySelectorAll('.wave').length,
    crossed: container.querySelector('.cross') !== null,
    solo: container.querySelector('.solo-s')?.textContent ?? null,
    hidden: container.querySelector('svg')?.getAttribute('aria-hidden'),
  };
};

describe('the volume glyph', () => {
  it('reads the level in waves: none at none, then one, two, three, never fewer as the level rises', () => {
    let last = 0;
    for (let step = 0; step <= 100; step++) {
      const waves = wavesOf(step / 100);
      expect(waves).toBeGreaterThanOrEqual(last);
      last = waves;
    }
    expect([0, 0.2, 0.5, 1].map(wavesOf)).toEqual([0, 1, 2, 3]);
    expect(wavesOf(Number.NaN)).toBe(0);
  });

  it('draws that many waves', () => {
    for (const level of [0, 0.2, 0.5, 1]) expect(drawn({ level }).waves).toBe(wavesOf(level));
  });

  it('is crossed out, with no waves, while muted, however high the level', () => {
    expect(drawn({ level: 1, muted: true })).toMatchObject({ waves: 0, crossed: true });
    expect(drawn({ level: 1 }).crossed).toBe(false);
  });

  it('lays an S over the speaker while soloed', () => {
    expect(drawn({ level: 0.5, soloed: true }).solo).toBe('S');
    expect(drawn({ level: 0.5 }).solo).toBeNull();
  });

  it('is decoration', () => {
    expect(drawn({ level: 0.5 }).hidden).toBe('true');
  });
});
