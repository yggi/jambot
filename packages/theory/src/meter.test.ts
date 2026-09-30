import { describe, expect, it } from 'vitest';
import { even, isEven } from './even.ts';
import { degreeBelow, gaps, heightOf, mirror, mod, positions, shift, wrap } from './helix.ts';
import { parallel, relative } from './keys.ts';
import { brightness, modes } from './modes.ts';
import { alteredHeight, chromaticStep } from './numerals.ts';
import {
  METERS,
  type Meter,
  type MeterName,
  type Weight,
  STEPS_PER_EIGHTH,
  meterOnSteps,
  meterWeights,
  stepsOf,
  onsetHeight,
  onsetToken,
} from './meter.ts';

/** Every named meter's weights, by hand: the ground truth `meterWeights` is checked against. */
const WEIGHTS: Record<MeterName, Weight[]> = {
  '3/4': ['downbeat', 'subdivision', 'pulse', 'subdivision', 'pulse', 'subdivision'],
  '4/4': [
    'downbeat',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
  ],
  '5/4': [
    'downbeat',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
  ],
  '5/8': ['downbeat', 'subdivision', 'subdivision', 'pulse', 'subdivision'],
  '6/8': ['downbeat', 'subdivision', 'subdivision', 'pulse', 'subdivision', 'subdivision'],
  '7/8': ['downbeat', 'subdivision', 'subdivision', 'pulse', 'subdivision', 'pulse', 'subdivision'],
  '9/8': [
    'downbeat',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
  ],
  '10/8': [
    'downbeat',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'pulse',
    'subdivision',
  ],
  '12/8': [
    'downbeat',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
    'pulse',
    'subdivision',
    'subdivision',
  ],
};

/** Every way to group n eighths into pulses of 2 and 3, from the downbeat. */
const groupings = (n: number): number[][] =>
  n === 0
    ? [[]]
    : n < 2
      ? []
      : [...groupings(n - 2).map((g) => [2, ...g]), ...groupings(n - 3).map((g) => [3, ...g])];

/** The meter whose pulses have these lengths, from the downbeat. */
const grouped = (lengths: readonly number[]): Meter => ({
  cycle: lengths.reduce((a, b) => a + b, 0),
  heights: lengths.map((_, i) => lengths.slice(0, i).reduce((a, b) => a + b, 0)),
});

/** Every grouping into 2s and 3s of up to 16 eighths, as a meter: 149 of them. */
const everyGrouping: Meter[] = Array.from({ length: 15 }, (_, i) => groupings(i + 2))
  .flat()
  .map(grouped);

/** A helix read from its own degree 0: the downbeat at 0. */
const fromDownbeat = (helix: Meter): Meter => shift(helix, -heightOf(helix, 0));

describe('meter', () => {
  it('gives every named meter as a helix of its pulses over its bar’s eighths', () => {
    expect(METERS).toEqual({
      '3/4': { cycle: 6, heights: [0, 2, 4] },
      '4/4': { cycle: 8, heights: [0, 2, 4, 6] },
      '5/4': { cycle: 10, heights: [0, 2, 4, 6, 8] },
      '5/8': { cycle: 5, heights: [0, 3] },
      '6/8': { cycle: 6, heights: [0, 3] },
      '7/8': { cycle: 7, heights: [0, 3, 5] },
      '9/8': { cycle: 9, heights: [0, 3, 6] },
      '10/8': { cycle: 10, heights: [0, 3, 6, 8] },
      '12/8': { cycle: 12, heights: [0, 3, 6, 9] },
    });
  });

  it('places every named meter’s pulses as `even` does over its eighths, but 10/8’s 3+3+2+2, which is given by its heights (finite: every named meter) (T6)', () => {
    for (const [name, meter] of Object.entries(METERS)) {
      expect(meter.heights[0]).toBe(0);
      const k = meter.heights.length;
      expect([name, isEven(meter)]).toEqual([name, name !== '10/8']);
      if (name !== '10/8') expect(meter).toEqual(even(k, meter.cycle));
    }
    expect(gaps(METERS['10/8'])).toEqual([3, 3, 2, 2]);
  });

  it('weighs every eighth of every named meter, against its weights written out by hand (finite: every meter, every position)', () => {
    for (const [name, meter] of Object.entries(METERS) as [MeterName, Meter][])
      expect(meterWeights(meter)).toEqual(WEIGHTS[name]);
  });

  it('counts a bar’s steps as the meter’s eighths, two to each, which is one turn of the meter on the steps (finite: every meter)', () => {
    for (const [name, meter] of Object.entries(METERS)) {
      expect([name, stepsOf(meter)]).toEqual([name, meter.cycle * STEPS_PER_EIGHTH]);
      expect([name, stepsOf(meter)]).toEqual([name, meterOnSteps(meter).cycle]);
    }
    expect(stepsOf(METERS['4/4'])).toBe(16);
    expect(stepsOf(METERS['7/8'])).toBe(14);
    expect(stepsOf(METERS['4/4'], 1)).toBe(8);
  });

  it('marks position 0 the downbeat and no other position, in every meter', () => {
    for (const meter of Object.values(METERS)) {
      const weights = meterWeights(meter);
      expect(weights[0]).toBe('downbeat');
      expect(weights.slice(1)).not.toContain('downbeat');
    }
  });

  it('gives a simple or compound meter pulses of equal length, as its `gaps` (finite: 3/4, 4/4, 5/4, 6/8, 9/8, 12/8)', () => {
    expect(gaps(METERS['3/4'])).toEqual([2, 2, 2]);
    expect(gaps(METERS['4/4'])).toEqual([2, 2, 2, 2]);
    expect(gaps(METERS['5/4'])).toEqual([2, 2, 2, 2, 2]);
    expect(gaps(METERS['6/8'])).toEqual([3, 3]);
    expect(gaps(METERS['9/8'])).toEqual([3, 3, 3]);
    expect(gaps(METERS['12/8'])).toEqual([3, 3, 3, 3]);
  });

  it('gives an additive meter pulses of unequal length, the same `even` that groups the bossa clave: 5/8 as 3+2, 7/8 as 3+2+2', () => {
    expect(gaps(METERS['5/8'])).toEqual([3, 2]);
    expect(gaps(METERS['7/8'])).toEqual([3, 2, 2]);
    for (const meter of Object.values(METERS))
      expect(gaps(meter).reduce((a, b) => a + b, 0)).toBe(meter.cycle);
  });

  it('makes 3/4 and 6/8 sound different though both hold six eighths a bar: grouped in 2s or in 3s', () => {
    expect(METERS['3/4'].cycle).toBe(6);
    expect(METERS['6/8'].cycle).toBe(6);
    expect(meterWeights(METERS['3/4'])).toEqual([
      'downbeat',
      'subdivision',
      'pulse',
      'subdivision',
      'pulse',
      'subdivision',
    ]);
    expect(meterWeights(METERS['6/8'])).toEqual([
      'downbeat',
      'subdivision',
      'subdivision',
      'pulse',
      'subdivision',
      'subdivision',
    ]);
  });

  it('makes 6/8 and 12/8 sound different: both grouped in 3s, but the downbeat recurs every 2 or every 4 pulses', () => {
    expect(METERS['6/8'].heights).toEqual([0, 3]);
    expect(METERS['12/8'].heights).toEqual([0, 3, 6, 9]);
  });

  it('groups an additive meter without being told which pulse is which: 5/8 long-short, 7/8 long-short-short', () => {
    expect(METERS['5/8'].heights).toEqual([0, 3]);
    expect(METERS['7/8'].heights).toEqual([0, 3, 5]);
  });

  describe('as a helix', () => {
    /** A helix's groupings: each of its modes, read from the downbeat. */
    const modeGroupings = (meter: Meter): string[] =>
      modes(meter).map((m) => gaps(fromDownbeat(m)).join('+'));

    it('groups pulses in 2s and 3s exactly when 2 · pulses ≤ eighths ≤ 3 · pulses, and every named meter does (finite: every 2 ≤ k < n ≤ 16) (T6)', () => {
      for (let n = 3; n <= 16; n++)
        for (let k = 2; k < n; k++)
          expect(gaps(even(k, n)).every((g) => g === 2 || g === 3)).toBe(2 * k <= n && n <= 3 * k);
      for (const meter of Object.values(METERS))
        expect(gaps(meter).every((l) => l === 2 || l === 3)).toBe(true);
    });

    it('reads an additive meter’s groupings as the modes of its helix, and `even` as the brightest, long first (T6)', () => {
      expect(modeGroupings(even(2, 5))).toEqual(['3+2', '2+3']);
      expect(modeGroupings(even(3, 7))).toEqual(['3+2+2', '2+2+3', '2+3+2']);
      expect(modeGroupings(even(4, 9))).toEqual(['3+2+2+2', '2+2+2+3', '2+2+3+2', '2+3+2+2']);
      expect(modeGroupings(METERS['10/8'])).toEqual(['3+3+2+2', '3+2+2+3', '2+2+3+3', '2+3+3+2']);
      for (const meter of Object.values(METERS)) {
        const brightest = Math.max(...modes(meter).map((m) => brightness(fromDownbeat(m))));
        expect(brightness(meter)).toBe(brightest);
      }
    });

    it('mirrors a grouping into its retrograde: 7/8’s 3+2+2 into 2+2+3 (finite: every grouping into 2s and 3s of up to 16 eighths) (T6)', () => {
      expect(everyGrouping).toHaveLength(149);
      for (const meter of everyGrouping)
        expect(gaps(mirror(meter))).toEqual([...gaps(meter)].reverse());
    });

    it('does not reach every grouping: 79 of the 149 groupings into 2s and 3s of up to 16 eighths are modes of `even`, and 10/8’s 3+3+2+2 is the first that is not (T6)', () => {
      const missed = everyGrouping.filter(
        (meter) =>
          !modeGroupings(even(meter.heights.length, meter.cycle)).includes(gaps(meter).join('+')),
      );
      expect(everyGrouping.length - missed.length).toBe(79);
      expect(missed.slice(0, 4).map((m) => `${m.cycle}:${gaps(m).join('+')}`)).toEqual([
        '10:2+2+3+3',
        '10:2+3+3+2',
        '10:3+2+2+3',
        '10:3+3+2+2',
      ]);
    });

    it('changes grouping as a key changes: `parallel` keeps the downbeat and regroups, `relative` keeps the pulses and moves the downbeat (finite: every grouping into 2s and 3s of up to 16 eighths, every mode) (T6)', () => {
      for (const meter of everyGrouping)
        for (const other of modes(meter).map(fromDownbeat)) {
          const regrouped = parallel(meter, other);
          expect(regrouped.heights[0]).toBe(0);
          expect(gaps(regrouped)).toEqual(gaps(other));
          const rebarred = relative(meter, other);
          expect(positions(rebarred)).toEqual(positions(meter));
          expect(gaps(rebarred)).toEqual(gaps(other));
        }
    });

    it('is the song’s beat in 4/4: its pulses composed onto a bar of 16 steps, two to an eighth, are `even(4, 16)` (T6)', () => {
      expect(meterOnSteps(METERS['4/4'])).toEqual(even(4, 16));
    });
  });

  describe('as the song’s clock', () => {
    const beats = meterOnSteps(METERS['4/4']);
    /** Every step of 64 bars either side of the song’s start. */
    const steps = Array.from({ length: 2048 }, (_, i) => i - 1024);

    it('reads the transport’s bar, step in the bar and beat in the bar as the 4/4 helix on 16 steps does, at every step of 128 bars (T10)', () => {
      for (const step of steps) {
        const pulse = degreeBelow(beats, step);
        expect(Math.floor(pulse / beats.heights.length)).toBe(Math.floor(step / 16));
        expect(wrap(step, beats.cycle)).toBe(mod(step, 16));
        expect(mod(pulse, beats.heights.length)).toBe(Math.floor(mod(step, 16) / 4));
      }
    });

    it('reads any meter’s bar and pulse from its helix on the steps, where the readers’ literals give 4/4’s alone (finite: every named meter, every step of 128 bars) (T10)', () => {
      const agree: string[] = [];
      for (const [name, meter] of Object.entries(METERS)) {
        const clock = meterOnSteps(meter);
        const k = clock.heights.length;
        let literal = true;
        for (const step of steps) {
          const pulse = degreeBelow(clock, step);
          expect(Math.floor(pulse / k)).toBe(Math.floor(step / clock.cycle));
          expect(heightOf(clock, pulse)).toBeLessThanOrEqual(step);
          expect(heightOf(clock, pulse + 1)).toBeGreaterThan(step);
          if (
            Math.floor(pulse / k) !== Math.floor(step / 16) ||
            mod(pulse, k) !== Math.floor(mod(step, 16) / 4)
          )
            literal = false;
        }
        if (literal) agree.push(name);
      }
      expect(agree).toEqual(['4/4']);
    });
  });

  it('has a pulse tempo only where every pulse is as long as the next: a simple or compound meter, never an additive one (finite: every well-formed 2 ≤ k < n ≤ 16) (T7)', () => {
    for (let n = 3; n <= 16; n++)
      for (let k = 2; k < n; k++) {
        if (2 * k > n || n > 3 * k) continue;
        expect(new Set(gaps(even(k, n))).size === 1).toBe(n % k === 0);
      }
  });

  it('alters an onset by no eighth where every pulse is as long: the numerals’ `b` and `#`, the larger step less the smaller, move by one eighth in an additive meter and by none in a simple or compound one (finite: every grouping into 2s and 3s of up to 16 eighths) (T12)', () => {
    for (const meter of everyGrouping)
      expect(chromaticStep(meter)).toBe(new Set(gaps(meter)).size === 1 ? 0 : 1);
    expect(chromaticStep(METERS['4/4'])).toBe(0);
    expect(chromaticStep(meterOnSteps(METERS['4/4']))).toBe(0);
    expect(chromaticStep(METERS['7/8'])).toBe(1);
    expect(chromaticStep(even(7, 12))).toBe(1);
  });

  it('never moves an onset by one step through the chromatic step, in any grouping, but one step of the grid always can (finite: every grouping into 2s and 3s of up to 16 eighths) (#125)', () => {
    const byStep = new Map<number, number>();
    for (const meter of everyGrouping) {
      const clock = meterOnSteps(meter);
      const step = chromaticStep(clock);
      byStep.set(step, (byStep.get(step) ?? 0) + 1);
      // Whatever the chromatic step does, one step of the grid reaches the
      // very next step off every pulse, in steps, not eighths.
      for (let degree = 0; degree < clock.heights.length; degree++)
        expect(alteredHeight(clock, degree, 1, 1)).toBe(heightOf(clock, degree) + 1);
    }
    // On the steps, the chromatic step is never 1: 0 where every pulse is as
    // long (13 groupings), and 2, a whole eighth, in every additive one (136).
    expect(Object.fromEntries(byStep)).toEqual({ 0: 13, 2: 136 });
  });
});

describe('onsetToken and onsetHeight: the time tower’s token (#126)', () => {
  it('is the inverse of onsetHeight, over four bars of steps, with an accidental of 0 or 1 only', () => {
    for (let step = 0; step < 64; step++) {
      const token = onsetToken(step);
      expect(onsetHeight(token)).toBe(step);
      expect([0, 1]).toContain(token.accidental);
    }
  });

  it('is alteredHeight/a generic alteredDegree on the eighths, with one grid step and no parallel-major search, since the eighths are always evenly spaced and never need one (#125, #126)', () => {
    // The independent oracle: every eighth of the song's 4/4 bar on its 16
    // steps (as `onsets.ts`'s E15 builds it), read through the same
    // alteredHeight a pitch token uses, one grid step exactly as #125
    // measured, over four bars (two turns of the helix).
    const eighths = even(METERS['4/4'].cycle, METERS['4/4'].cycle * 2);
    for (let step = 0; step < 64; step++) {
      const token = onsetToken(step);
      expect(alteredHeight(eighths, token.degree, token.accidental, 1)).toBe(onsetHeight(token));
    }
  });

  it('always reads a step off an eighth as the eighth below, sharped, never the eighth above: the canonical form a bar’s round trip needs (#126)', () => {
    for (let step = 1; step < 16; step += 2) {
      const token = onsetToken(step);
      expect(token.accidental).toBe(1);
      expect(token.degree).toBe((step - 1) / 2); // the eighth below, not the one above
    }
  });
});
