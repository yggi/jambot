import { describe, expect, it } from 'vitest';
import { timbreOf } from './sound.ts';
import { INITIAL_STYLE } from './style.ts';
import { STRAIGHT } from './swing.ts';

describe('the dough', () => {
  it('turns the lead from a soft triangle to a bright square as articulation rises, opening with energy', () => {
    const legato = timbreOf('lead', { ...INITIAL_STYLE, artic: 0 }, STRAIGHT, 0);
    expect(legato).toEqual({ triangle: 1.8, square: 0, cutoff: 1400, attack: 0.04 });
    const staccato = timbreOf('lead', { ...INITIAL_STYLE, artic: 1 }, STRAIGHT, 1);
    expect(staccato).toEqual({ triangle: 0, square: 1, cutoff: 3600, attack: 0.006 });
  });

  it('turns the bass from a resonant saw to a round triangle as the meter’s 8ths swing into triplets (#360)', () => {
    const straight = timbreOf('bass', { ...INITIAL_STYLE, artic: 0 }, STRAIGHT, 0.5);
    expect(straight).toEqual({ saw: 1, triangle: 0, cutoff: 0.6, resonance: 6 });
    // The share is 2/3, which reads back as a lean of a hair under 1.
    const swung = timbreOf(
      'bass',
      { ...INITIAL_STYLE, artic: 1 },
      { level: '8n', share: 2 / 3 },
      0.5,
    );
    expect(swung.saw).toBeCloseTo(0, 12);
    expect(swung.triangle).toBeCloseTo(1.6, 12);
    expect(swung.cutoff).toBe(1.2);
    expect(swung.resonance).toBeCloseTo(2, 12);
    // A 16th shuffle leaves the bass as it is.
    const shuffle = { level: '16n', share: 2 / 3 } as const;
    expect(timbreOf('bass', { ...INITIAL_STYLE, artic: 0 }, shuffle, 0.5)).toEqual(straight);
  });

  it('swells the chords in legato and cuts them short in staccato, the pad and the stab alike', () => {
    for (const part of ['pad', 'stab'] as const) {
      expect(timbreOf(part, { ...INITIAL_STYLE, artic: 0 }, STRAIGHT, 0.5)).toEqual({
        attack: 0.3,
        release: 0.7,
      });
      expect(timbreOf(part, { ...INITIAL_STYLE, artic: 1 }, STRAIGHT, 0.5)).toEqual({
        attack: 0.01,
        release: 0.12,
      });
    }
  });

  it('gives the drums no timbre: the built-in drum kit reads none', () => {
    expect(timbreOf('drums', INITIAL_STYLE, STRAIGHT, 0.5)).toEqual({});
  });
});
