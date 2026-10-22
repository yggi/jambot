import { describe, expect, it } from 'vitest';
import { METERS, heightOf, meterOnSteps } from '@jambot/theory';
import { presetSwing } from './repository.ts';
import { PRESETS, SLIDER_GLIDE, rateAt } from './style.ts';
import {
  LEAN_RANGE,
  type MeterSwing,
  SHARE,
  STRAIGHT,
  composeTimeMaps,
  eighthSwing,
  holdingSwing,
  leanMap,
  leanOfShare,
  leansOf,
  shareOfLean,
  swingAt,
  swingMap,
  swingMapAt,
  swingParts,
  swingTarget,
  swingTo,
  swingWeight,
} from './swing.ts';

const range = (n: number) => [...Array(n).keys()];
const swings = range(101).map((i) => i / 100);
/** Positions through two bars in 48ths of a step, plus a few before 0. */
const positions = range(32 * 48 + 1).map((i) => i / 48 - 4);
/**
 * `toBeCloseTo(b, 12)` as a plain comparison. The loops over every swing and
 * position tally what fails and assert once: expect() costs more than the
 * check, a million times over.
 */
const near = (a: number, b: number) => Math.abs(a - b) < 5e-13;

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
    const wrong: string[] = [];
    for (const swing of swings) {
      const map = swingMap(swing);
      for (const x of positions)
        if (!near(map.written(map.played(x)), x) || !near(map.played(map.written(x)), x))
          wrong.push(`swing ${swing}, step ${x}`);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  it("shows that the prototype's delays are not what its unswing undoes (T4, Q1b)", () => {
    // swing 0.75, step 3 (and 11): the prototype plays 3 + 1/3, and unswing
    // reads that back 0.04 steps late.
    expect(swingMap(0.75).written(3 + prototypeDelay(3, 0.75))).toBeCloseTo(3.04, 12);
  });

  it('keeps the beats, keeps the order, and repeats every beat', () => {
    const wrong: string[] = [];
    for (const swing of swings) {
      const map = swingMap(swing);
      for (const beat of range(8)) expect(map.played(4 * beat)).toBe(4 * beat);
      const played = positions.map((x) => map.played(x));
      played.slice(1).forEach((y, i) => {
        if (!(y > played[i]!))
          wrong.push(`swing ${swing}, step ${positions[i + 1]} is not after the last`);
      });
      for (const x of positions)
        if (!near(map.played(x + 4), map.played(x) + 4))
          wrong.push(`swing ${swing}, step ${x} + 4`);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  it('delays and never anticipates', () => {
    const wrong: string[] = [];
    for (const swing of swings) {
      const map = swingMap(swing);
      for (const x of positions)
        if (!(map.played(x) >= x - 1e-12)) wrong.push(`swing ${swing}, step ${x}`);
    }
    expect(wrong.slice(0, 5)).toEqual([]);
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
  it('keeps every pulse of every named meter where it is, at every swing (finite: every meter, every pulse of 8 bars, every swing sampled) (T11)', () => {
    for (const meter of Object.values(METERS)) {
      const clock = meterOnSteps(meter);
      const pulses = Array.from({ length: 8 * clock.heights.length }, (_, d) => heightOf(clock, d));
      for (const swing of swings) {
        const map = swingMap(swing, meter);
        for (const step of pulses) expect(map.played(step)).toBeCloseTo(step, 12);
      }
    }
  });

  it('swings a 2-eighth pulse’s offbeat 8th onto the triplet at full swing, in every meter that has one (T11)', () => {
    for (const meter of Object.values(METERS)) {
      const clock = meterOnSteps(meter);
      const full = swingMap(1, meter);
      for (let d = 0; d < clock.heights.length; d++) {
        const start = heightOf(clock, d);
        if (heightOf(clock, d + 1) - start === 4)
          expect(full.played(start + 2)).toBeCloseTo(start + 2 + 2 / 3, 12);
      }
    }
  });

  it('plays a 3-eighth pulse straight at the 8th level, on every meter that has one, the easiest option until T16 measures a ternary feel (T11, T16)', () => {
    for (const meter of Object.values(METERS)) {
      const clock = meterOnSteps(meter);
      const full = swingMap(1, meter);
      for (let d = 0; d < clock.heights.length; d++) {
        const start = heightOf(clock, d);
        if (heightOf(clock, d + 1) - start === 6)
          for (const eighth of [1, 2])
            expect(full.played(start + 2 * eighth)).toBe(start + 2 * eighth);
      }
    }
  });

  it('still shuffles the 16ths inside a 3-eighth pulse, straight or not at the 8th level (T16)', () => {
    for (const meter of Object.values(METERS)) {
      const clock = meterOnSteps(meter);
      const shuffle = swingMap(0.5, meter); // full 16th shuffle, no 8th swing yet
      for (let d = 0; d < clock.heights.length; d++) {
        const start = heightOf(clock, d);
        if (heightOf(clock, d + 1) - start === 6)
          for (const eighth of [0, 1, 2])
            expect(shuffle.played(start + 2 * eighth + 1)).toBeCloseTo(
              start + 2 * eighth + 1 + 1 / 3,
              12,
            );
      }
    }
  });

  it('is undone by its inverse, on and off the grid, over every named meter (T11, Q1b)', () => {
    const wrong: string[] = [];
    for (const meter of Object.values(METERS)) {
      for (const swing of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
        const map = swingMap(swing, meter);
        for (const x of positions)
          if (!near(map.written(map.played(x)), x) || !near(map.played(map.written(x)), x))
            wrong.push(`swing ${swing}, step ${x}`);
      }
    }
    expect(wrong.slice(0, 5)).toEqual([]);
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

/** Leans from the early limit to the late one, a twentieth apart, and zero exactly. */
const leans = range(61).map((i) => (i - 30) / 20);

describe('the lean of a level', () => {
  it('reads as the share of the span the first half holds: 50 straight, 67 triplet, 75 dotted', () => {
    expect(shareOfLean(0)).toBe(0.5);
    expect(shareOfLean(1)).toBeCloseTo(2 / 3, 12);
    expect(shareOfLean(LEAN_RANGE)).toBeCloseTo(0.75, 12);
    expect(shareOfLean(-LEAN_RANGE)).toBeCloseTo(0.25, 12);
    for (const lean of leans) expect(leanOfShare(shareOfLean(lean))).toBeCloseTo(lean, 12);
  });

  it('is straight at 0, and the offbeat 8th goes late above it and early below it', () => {
    const straight = leanMap({ eighth: 0, sixteenth: 0 });
    for (let step = -4; step < 32; step += 0.25) expect(straight.played(step)).toBe(step);
    expect(leanMap({ eighth: 1, sixteenth: 0 }).played(2)).toBeCloseTo(8 / 3, 12);
    expect(leanMap({ eighth: LEAN_RANGE, sixteenth: 0 }).played(2)).toBeCloseTo(3, 12);
    expect(leanMap({ eighth: -1, sixteenth: 0 }).played(2)).toBeCloseTo(4 / 3, 12);
    expect(leanMap({ eighth: -LEAN_RANGE, sixteenth: 0 }).played(2)).toBeCloseTo(1, 12);
  });

  it('moves the offbeat 16th of each half-beat the same way, on its own level (the secondary swing)', () => {
    const late = leanMap({ eighth: 0, sixteenth: 1 });
    const early = leanMap({ eighth: 0, sixteenth: -1 });
    for (const eighth of [0, 2])
      for (const step of [eighth, eighth + 1]) {
        expect(late.played(eighth)).toBeCloseTo(eighth, 12);
        expect(early.played(eighth)).toBeCloseTo(eighth, 12);
        if (step === eighth + 1) {
          expect(late.played(step)).toBeCloseTo(eighth + 4 / 3, 12);
          expect(early.played(step)).toBeCloseTo(eighth + 2 / 3, 12);
        }
      }
    expect(late.played(2)).toBeCloseTo(2, 12); // the 8th level is not touched
  });

  it('keeps every pulse of every named meter where it is, keeps time in order and is undone by its inverse, at every lean of each level (finite: every meter, every lean sampled) (T11)', () => {
    const wrong: string[] = [];
    for (const [name, meter] of Object.entries(METERS)) {
      const clock = meterOnSteps(meter);
      const starts = Array.from({ length: 4 * clock.heights.length }, (_, d) => heightOf(clock, d));
      for (const eighth of leans)
        for (const sixteenth of [-1, 0, 0.5, 1.5]) {
          const map = leanMap({ eighth, sixteenth }, meter);
          const tag = `${name} 8th ${eighth} 16th ${sixteenth}`;
          for (const step of starts)
            if (!near(map.played(step), step)) wrong.push(`${tag}: pulse ${step}`);
          const played = positions.map((x) => map.played(x));
          played.slice(1).forEach((y, i) => {
            if (!(y > played[i]!)) wrong.push(`${tag}: ${positions[i + 1]} is not after the last`);
          });
          for (const x of positions)
            if (!near(map.written(map.played(x)), x)) wrong.push(`${tag}: step ${x}`);
        }
    }
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  it('holds a lean to its range, so no offbeat reaches its neighbour', () => {
    expect(leanMap({ eighth: 9, sixteenth: 0 }).played(2)).toBe(
      leanMap({ eighth: LEAN_RANGE, sixteenth: 0 }).played(2),
    );
    expect(leanMap({ eighth: -9, sixteenth: -9 }).played(2)).toBe(
      leanMap({ eighth: -LEAN_RANGE, sixteenth: -LEAN_RANGE }).played(2),
    );
  });

  it('is the readers’ path: swingMap is leanMap over its parts, everywhere', () => {
    for (const swing of swings)
      for (const meter of [METERS['4/4'], METERS['7/8']]) {
        const [a, b] = [swingMap(swing, meter), leanMap(swingParts(swing), meter)];
        for (const x of positions.filter((_, i) => i % 7 === 0))
          expect(a.played(x)).toBe(b.played(x));
      }
  });

  it('never leans the readers’ path early (it runs from straight to swung)', () => {
    for (const swing of swings) {
      const { eighth, sixteenth } = swingParts(swing);
      expect(Math.min(eighth, sixteenth)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('the meter’s swing (#360)', () => {
  const shares = range(26).map((i) => 0.5 + i / 100);
  const swung = (level: MeterSwing['level'], share: number): MeterSwing => ({ level, share });

  it('leans its own level by its share and plays the other straight', () => {
    for (const share of shares) {
      const lean = leanOfShare(share);
      expect(leansOf(swung('8n', share))).toEqual({ sixteenth: 0, eighth: lean });
      expect(leansOf(swung('16n', share))).toEqual({ sixteenth: lean, eighth: 0 });
    }
    expect(leansOf(STRAIGHT)).toEqual({ sixteenth: 0, eighth: 0 });
  });

  it('plays the share of each span at its level: the offbeat 8th of a beat, the offbeat 16th of a half-beat', () => {
    for (const share of shares) {
      expect(swingMapAt(swung('8n', share), 0, 4).played(2) / 4).toBeCloseTo(share, 12);
      expect(swingMapAt(swung('8n', share), 0, 4).played(1)).toBeCloseTo(2 * share, 12);
      expect(swingMapAt(swung('16n', share), 0, 4).played(1) / 2).toBeCloseTo(share, 12);
      expect(swingMapAt(swung('16n', share), 0, 4).played(2)).toBe(2);
    }
  });

  it('glides its share from straight to the dotted figure, never early', () => {
    expect(SHARE).toEqual({ min: 0.5, max: 0.75, space: 'linear' });
    const track = swingTo(holdingSwing(STRAIGHT), { share: 0.4 }, 0, 0);
    expect(swingAt(track, 0).share).toBe(0.5);
    expect(swingAt(swingTo(track, { share: 0.9 }, 0, 0), 0).share).toBe(0.75);
  });

  it('brings in the jazz band only from the 8ths, as far as they swing (the owner’s ruling on #360)', () => {
    for (const share of shares) {
      expect(eighthSwing(swung('16n', share))).toBe(0);
      expect(eighthSwing(swung('8n', share))).toBeCloseTo(Math.min(1, leanOfShare(share)), 12);
    }
    expect(eighthSwing(swung('8n', 0.5))).toBe(0);
    expect(eighthSwing(swung('8n', 2 / 3))).toBeCloseTo(1, 12);
  });

  it('weighs a 16th lean half of an 8th’s, so every preset weighs what its swing axis value was', () => {
    const was = [0, 0, 0.3, 0.05, 0.45, 0.3, 0, 1];
    PRESETS.forEach((p, i) => expect(swingWeight(presetSwing(p)!)).toBeCloseTo(was[i]!, 12));
    for (const share of shares) {
      expect(swingWeight(swung('16n', share))).toBeCloseTo(leanOfShare(share) / 2, 12);
      expect(swingWeight(swung('8n', share))).toBeCloseTo(Math.min(1, leanOfShare(share)), 12);
    }
  });

  it('glides a share as an axis does: from where it is and as fast, over the glide asked for', () => {
    const start = swingTo(holdingSwing(STRAIGHT), { level: '8n', share: 2 / 3 }, 0, SLIDER_GLIDE);
    expect(swingTarget(start)).toEqual({ level: '8n', share: 2 / 3 });
    expect(swingAt(start, 0).share).toBe(0.5);
    expect(swingAt(start, SLIDER_GLIDE / 2).share).toBeCloseTo((0.5 + 2 / 3) / 2, 12);
    expect(swingAt(start, SLIDER_GLIDE).share).toBe(2 / 3);
    // Retargeted midway, it leaves from where it is, as fast as it was going.
    const turned = swingTo(start, { share: 0.6 }, 4, SLIDER_GLIDE);
    expect(swingAt(turned, 4).share).toBeCloseTo(swingAt(start, 4).share, 12);
    expect(turned.share.slope).toBeCloseTo(rateAt('harm', start.share, 4), 12);
    // A level asked for leaves the share as it is.
    expect(swingTo(start, { level: '16n' }, 4, SLIDER_GLIDE).share).toBe(start.share);
  });

  it('survives JSON, so it can be carried', () => {
    const track = swingTo(holdingSwing(presetSwing(PRESETS[7]!)!), { share: 0.6 }, 16, 128);
    expect(JSON.parse(JSON.stringify(track))).toEqual(track);
  });
});
