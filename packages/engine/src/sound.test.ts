import { describe, expect, it } from 'vitest';
import { soundOf } from './sound.ts';
import { INITIAL_STYLE } from './style.ts';

describe('the sound', () => {
  it('turns the lead from a soft triangle to a bright square as articulation rises, opening with energy', () => {
    const legato = soundOf({ ...INITIAL_STYLE, artic: 0 }, 0);
    expect(legato.lead).toEqual({ triangle: 1.8, square: 0, cutoff: 1400, attack: 0.04 });
    const staccato = soundOf({ ...INITIAL_STYLE, artic: 1 }, 1);
    expect(staccato.lead).toEqual({ triangle: 0, square: 1, cutoff: 3600, attack: 0.006 });
  });

  it('turns the bass from a resonant saw to a round triangle as swing rises into triplets', () => {
    const straight = soundOf({ ...INITIAL_STYLE, swing: 0, artic: 0 }, 0.5);
    expect(straight.bass).toEqual({ saw: 1, triangle: 0, cutoff: 0.6, resonance: 6 });
    const swung = soundOf({ ...INITIAL_STYLE, swing: 1, artic: 1 }, 0.5);
    expect(swung.bass).toEqual({ saw: 0, triangle: 1.6, cutoff: 1.2, resonance: 2 });
    // A 16th shuffle, below swing 0.5, leaves the bass as it is.
    expect(soundOf({ ...INITIAL_STYLE, swing: 0.5, artic: 0 }, 0.5).bass).toEqual(straight.bass);
  });

  it('swells the chords in legato and cuts them short in staccato', () => {
    expect(soundOf({ ...INITIAL_STYLE, artic: 0 }, 0.5).chords).toEqual({
      attack: 0.3,
      release: 0.7,
    });
    expect(soundOf({ ...INITIAL_STYLE, artic: 1 }, 0.5).chords).toEqual({
      attack: 0.01,
      release: 0.12,
    });
  });
});
