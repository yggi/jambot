import { describe, expect, it } from 'vitest';
import { METERS, heightOf, meterOnSteps } from '@jambot/theory';
import { composeTimeMaps, swingMap, swingParts } from './swing.ts';

const range = (n: number) => [...Array(n).keys()];
const swings = range(101).map((i) => i / 100);
/** Positions through two bars in 48ths of a step, plus a few before 0. */
const positions = range(32 * 48 + 1).map((i) => i / 48 - 4);

/** The prototype's `swingDelay`, as a literal: a grid step's delay in steps. */
const prototypeDelay = (step: number, swing: number) => {
  const { eighth, sixteenth } = swingParts(swing);
  const p = step % 4;
  if (p === 2) return (eighth * 2) / 3;
  if (p % 2 === 1) return eighth / 3 + sixteenth / 3;
  return 0;
};

describe('swingParts', () => {
  it('shuffles the 16ths up to 0.5, then crossfades into triplet 8ths', () => {
    expect(swingParts(0)).toEqual({ sixteenth: 0, eighth: 0 });
    expect(swingParts(0.25)).toEqual({ sixteenth: 0.5, eighth: 0 });
    expect(swingParts(0.5)).toEqual({ sixteenth: 1, eighth: 0 });
    expect(swingParts(0.75)).toEqual({ sixteenth: 0.5, eighth: 0.5 });
    expect(swingParts(1)).toEqual({ sixteenth: 0, eighth: 1 });
  });

  it('moves continuously with the swing axis', () => {
    for (const s of swings.slice(1)) {
      const [a, b] = [swingParts(s - 0.01), swingParts(s)];
      expect(Math.abs(a.eighth - b.eighth)).toBeLessThanOrEqual(0.0200001);
      expect(Math.abs(a.sixteenth - b.sixteenth)).toBeLessThanOrEqual(0.0200001);
    }
  });
});

describe('swingMap', () => {
  it('plays the grid where the prototype does, wherever only one level swings', () => {
    for (const swing of swings) {
      const { eighth, sixteenth } = swingParts(swing);
      if (eighth > 0 && sixteenth > 0) continue;
      for (const step of range(16))
        expect(swingMap(swing).played(step) - step).toBeCloseTo(prototypeDelay(step, swing), 12);
    }
  });

  it('puts the offbeat 8th on the triplet at full swing', () => {
    const map = swingMap(1);
    expect(map.played(2)).toBeCloseTo(2 + 2 / 3, 12);
    expect(map.played(6)).toBeCloseTo(6 + 2 / 3, 12);
    expect(map.played(1)).toBeCloseTo(1 + 1 / 3, 12);
    expect(swingMap(0.5).played(1)).toBeCloseTo(1 + 1 / 3, 12); // the 16th shuffle, a triplet 16th
  });

  it('composes the two levels, which adds a cross term where both swing', () => {
    // Deliberately unlike the prototype: its swingDelay adds the two levels'
    // delays, while its unswing inverts their composition. The port keeps the
    // composition, so the odd steps move by eighth × sixteenth / 9 more (on
    // the first 16th) or less (on the last). At swing 0.75 that is 1/36 of a
    // step, under 4 ms at 120 bpm.
    const map = swingMap(0.75);
    expect(map.played(1) - 1).toBeCloseTo(1 / 3 + 1 / 36, 12);
    expect(map.played(2) - 2).toBeCloseTo(1 / 3, 12);
    expect(map.played(3) - 3).toBeCloseTo(1 / 3 - 1 / 36, 12);
  });

  it('is undone by its inverse, both ways, on and off the grid (T4, Q1b)', () => {
    for (const swing of swings) {
      const map = swingMap(swing);
      for (const x of positions) {
        expect(map.written(map.played(x))).toBeCloseTo(x, 12);
        expect(map.played(map.written(x))).toBeCloseTo(x, 12);
      }
    }
  });

  it("shows that the prototype's delays are not what its unswing undoes (T4, Q1b)", () => {
    // swing 0.75, step 3 (and 11): the prototype plays 3 + 1/3, and unswing
    // reads that back 0.04 steps late.
    expect(swingMap(0.75).written(3 + prototypeDelay(3, 0.75))).toBeCloseTo(3.04, 12);
  });

  it('keeps the beats, keeps the order, and repeats every beat', () => {
    for (const swing of swings) {
      const map = swingMap(swing);
      for (const beat of range(8)) expect(map.played(4 * beat)).toBe(4 * beat);
      const played = positions.map((x) => map.played(x));
      played.slice(1).forEach((y, i) => expect(y).toBeGreaterThan(played[i]!));
      for (const x of positions) expect(map.played(x + 4)).toBeCloseTo(map.played(x) + 4, 12);
    }
  });

  it('delays and never anticipates', () => {
    for (const swing of swings)
      for (const x of positions)
        expect(swingMap(swing).played(x)).toBeGreaterThanOrEqual(x - 1e-12);
  });
});

describe('composeTimeMaps', () => {
  it('plays the first map, then the second, and undoes them in reverse', () => {
    const double = { played: (x: number) => 2 * x, written: (y: number) => y / 2 };
    const later = { played: (x: number) => x + 1, written: (y: number) => y - 1 };
    const both = composeTimeMaps(double, later);
    expect(both.played(3)).toBe(7);
    expect(both.written(7)).toBe(3);
    expect(composeTimeMaps(later, double).played(3)).toBe(8);
  });
});

describe('swing over a meter', () => {
  it('keeps every pulse of 3/4 and 4/4 where it is, and moves a pulse late in every other named meter, since it swings by beats of 4 steps (finite: every named meter, every pulse of 8 bars) (T11)', () => {
    const full = swingMap(1);
    const kept: string[] = [];
    for (const [name, meter] of Object.entries(METERS)) {
      const clock = meterOnSteps(meter);
      const pulses = Array.from({ length: 8 * clock.heights.length }, (_, d) => heightOf(clock, d));
      if (pulses.every((step) => full.played(step) === step)) kept.push(name);
    }
    expect(kept).toEqual(['3/4', '4/4']);
    expect(full.played(6)).toBeCloseTo(6 + 2 / 3, 12); // 6/8's second pulse, a third of a step late
  });

  it('plays 4/4’s eighths at full swing on 12/8’s: each offbeat eighth on its pulse’s third eighth, where a bar of 12/8 lies on the same 16 steps (T11)', () => {
    const full = swingMap(1);
    /** Where 12/8's eighth j lies when its bar spans the 16 steps: 12 eighths to 16 steps. */
    const twelveEighth = (j: number) => (j * 16) / 12;
    for (let eighth = 0; eighth < 8; eighth++) {
      const pulse = Math.floor(eighth / 2);
      const third = eighth % 2 === 0 ? 0 : 2;
      expect(full.played(2 * eighth)).toBeCloseTo(twelveEighth(3 * pulse + third), 12);
    }
  });
});
