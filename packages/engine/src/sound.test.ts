import { describe, expect, it } from 'vitest';
import { timbreOf } from './sound.ts';
import { INITIAL_STYLE } from './style.ts';

describe('the dough', () => {
  it('turns the lead from a soft triangle to a bright square as articulation rises, opening with energy', () => {
    const legato = timbreOf('lead', { ...INITIAL_STYLE, artic: 0 }, 0);
    expect(legato).toEqual({ triangle: 1.8, square: 0, cutoff: 1400, attack: 0.04 });
    const staccato = timbreOf('lead', { ...INITIAL_STYLE, artic: 1 }, 1);
    expect(staccato).toEqual({ triangle: 0, square: 1, cutoff: 3600, attack: 0.006 });
  });

  it('turns the bass from a resonant saw to a round triangle as swing rises into triplets', () => {
    const straight = timbreOf('bass', { ...INITIAL_STYLE, swing: 0, artic: 0 }, 0.5);
    expect(straight).toEqual({ saw: 1, triangle: 0, cutoff: 0.6, resonance: 6 });
    const swung = timbreOf('bass', { ...INITIAL_STYLE, swing: 1, artic: 1 }, 0.5);
    expect(swung).toEqual({ saw: 0, triangle: 1.6, cutoff: 1.2, resonance: 2 });
    // A 16th shuffle, below swing 0.5, leaves the bass as it is.
    expect(timbreOf('bass', { ...INITIAL_STYLE, swing: 0.5, artic: 0 }, 0.5)).toEqual(straight);
  });

  it('swells the chords in legato and cuts them short in staccato, the pad and the stab alike', () => {
    for (const part of ['pad', 'stab'] as const) {
      expect(timbreOf(part, { ...INITIAL_STYLE, artic: 0 }, 0.5)).toEqual({
        attack: 0.3,
        release: 0.7,
      });
      expect(timbreOf(part, { ...INITIAL_STYLE, artic: 1 }, 0.5)).toEqual({
        attack: 0.01,
        release: 0.12,
      });
    }
  });

  it('gives the drums no timbre: the built-in drum kit reads none', () => {
    expect(timbreOf('drums', INITIAL_STYLE, 0.5)).toEqual({});
  });
});
