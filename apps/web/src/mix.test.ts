// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  EVEN_MIX,
  type Mix,
  level,
  raised,
  shown,
  sounds,
  toggled,
  velocityFor,
  withLevel,
} from './mix.ts';
import { PERFORMERS, type Performer } from './sounding.ts';

/** Every subset of the performers. */
const subsets: Performer[][] = Array.from({ length: 1 << PERFORMERS.length }, (_, bits) =>
  PERFORMERS.filter((_, i) => bits & (1 << i)),
);
const everyMix: Mix[] = subsets.flatMap((muted) =>
  subsets.map((soloed) => ({ muted, soloed, levels: {} })),
);

describe('the local mix', () => {
  it('sounds every performer while nothing is muted or soloed', () => {
    for (const performer of PERFORMERS) expect(sounds(EVEN_MIX, performer)).toBe(true);
  });

  it('sounds only the soloed where any is soloed, and otherwise all but the muted, in every mix', () => {
    for (const mix of everyMix)
      for (const performer of PERFORMERS)
        expect(sounds(mix, performer), JSON.stringify({ mix, performer })).toBe(
          mix.soloed.length > 0 ? mix.soloed.includes(performer) : !mix.muted.includes(performer),
        );
  });

  it('toggles one performer’s mute or solo and leaves the rest, in every mix', () => {
    for (const mix of everyMix)
      for (const performer of PERFORMERS)
        for (const which of ['muted', 'soloed'] as const) {
          const after = toggled(mix, which, performer);
          const other = which === 'muted' ? 'soloed' : 'muted';
          expect(after[which].includes(performer)).toBe(!mix[which].includes(performer));
          expect(after[which].filter((p) => p !== performer)).toEqual(
            mix[which].filter((p) => p !== performer),
          );
          expect(after[other]).toEqual(mix[other]);
          expect(toggled(after, which, performer)[which].toSorted()).toEqual(mix[which].toSorted());
        }
  });

  it('keeps each list in the performers’ own order', () => {
    const mix = toggled(toggled(EVEN_MIX, 'muted', 'lead'), 'muted', 'drums');
    expect(mix.muted).toEqual(['drums', 'lead']);
  });

  describe('the level of each performer', () => {
    it('is whole until it is set', () => {
      for (const performer of PERFORMERS) expect(level(EVEN_MIX, performer)).toBe(1);
    });

    it('is set for one performer, and leaves the rest, the mutes and the solos as they are', () => {
      const mix = withLevel(toggled(EVEN_MIX, 'soloed', 'bass'), 'lead', 0.4);
      expect(level(mix, 'lead')).toBe(0.4);
      for (const performer of ['drums', 'bass', 'comp'] as const)
        expect(level(mix, performer)).toBe(1);
      expect(mix.soloed).toEqual(['bass']);
      expect(level(withLevel(mix, 'lead', 0.8), 'lead')).toBe(0.8);
    });

    it('stays between none and whole, whatever it is asked', () => {
      expect(level(withLevel(EVEN_MIX, 'lead', 3), 'lead')).toBe(1);
      expect(level(withLevel(EVEN_MIX, 'lead', -1), 'lead')).toBe(0);
      expect(level(withLevel(EVEN_MIX, 'lead', Number.NaN), 'lead')).toBe(1);
    });

    it('scales the velocity of a note, keeping it a note on until the level is none (finite: every velocity of the level steps)', () => {
      for (const at of [0.1, 0.25, 0.5, 0.75, 1]) {
        const mix = withLevel(EVEN_MIX, 'drums', at);
        for (let velocity = 1; velocity <= 127; velocity++) {
          const scaled = velocityFor(mix, 'drums', velocity);
          expect(scaled, `${at} of ${velocity}`).toBeGreaterThanOrEqual(1);
          expect(scaled).toBeLessThanOrEqual(velocity);
          expect(scaled).toBe(Math.max(1, Math.round(velocity * at)));
        }
      }
      expect(velocityFor(withLevel(EVEN_MIX, 'drums', 0), 'drums', 100)).toBe(0);
      expect(velocityFor(EVEN_MIX, 'lead', 100)).toBe(100);
    });

    it('scales one performer only', () => {
      const mix = withLevel(EVEN_MIX, 'lead', 0.5);
      expect(velocityFor(mix, 'lead', 100)).toBe(50);
      expect(velocityFor(mix, 'bass', 100)).toBe(100);
    });
  });

  describe('what a fader shows', () => {
    it('is the setpoint while a performer sounds, and none while it is muted, for every performer', () => {
      for (const performer of PERFORMERS) {
        const set = withLevel(EVEN_MIX, performer, 0.6);
        expect(shown(set, performer)).toBe(0.6);
        const muted = toggled(set, 'muted', performer);
        expect(shown(muted, performer)).toBe(0);
        expect(shown(toggled(muted, 'muted', performer), performer)).toBe(0.6);
      }
    });

    it('moves the others’ faders to none while one is soloed, and back to their setpoints when it is not', () => {
      const set = withLevel(withLevel(EVEN_MIX, 'bass', 0.4), 'lead', 0.8);
      const solo = toggled(set, 'soloed', 'lead');
      expect(shown(solo, 'lead')).toBe(0.8);
      for (const other of PERFORMERS.filter((p) => p !== 'lead'))
        expect(shown(solo, other)).toBe(0);
      const back = toggled(solo, 'soloed', 'lead');
      expect(shown(back, 'bass')).toBe(0.4);
      expect(shown(back, 'drums')).toBe(1);
    });
  });

  describe('dragging a fader', () => {
    it('sets the setpoint and unmutes the performer', () => {
      const muted = toggled(EVEN_MIX, 'muted', 'bass');
      const raised_ = raised(muted, 'bass', 0.5);
      expect(raised_.muted).toEqual([]);
      expect(shown(raised_, 'bass')).toBe(0.5);
    });

    it('brings a performer left out of a solo into it, and leaves the others', () => {
      const solo = toggled(EVEN_MIX, 'soloed', 'lead');
      const mix = raised(solo, 'bass', 0.7);
      expect(mix.soloed).toEqual(['bass', 'lead']);
      expect(shown(mix, 'bass')).toBe(0.7);
      expect(shown(mix, 'drums')).toBe(0);
    });

    it('starts no solo where there is none', () => {
      expect(raised(EVEN_MIX, 'bass', 0.3).soloed).toEqual([]);
    });
  });
});
