import { METERS, type Meter, meterOnSteps, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type BandEnv, band } from './band.ts';
import type { Part, WrittenNote } from './events.ts';
import { PRESETS, INITIAL_STYLE } from './style.ts';
import { readStyle, readTiming } from './style-reading.ts';
import { swingMap } from './swing.ts';

const note = (part: Part, step: number, length = 1, midi = 60): WrittenNote => ({
  part,
  step,
  note: midi,
  length,
});
const range = (n: number) => [...Array(n).keys()];

describe('reading a style from notes: sync', () => {
  it('reads no syncopation where every onset is on a beat or an eighth', () => {
    const bar = [0, 2, 4, 6, 8, 10, 12, 14].map((s) => note('lead', s));
    expect(readStyle(bar).sync).toBe(0);
  });

  it('reads all of it where every onset is off the beat and the eighth', () => {
    const bar = [1, 3, 5, 7, 9, 11, 13, 15].map((s) => note('lead', s));
    expect(readStyle(bar).sync).toBe(1);
  });

  it('reads the share of onsets that fall off them, from every part', () => {
    const bar = [note('drums', 0), note('bass', 3), note('lead', 4), note('stab', 7)];
    expect(readStyle(bar).sync).toBe(0.5);
  });
});

describe('reading a style from notes: artic', () => {
  it('reads legato where each note fills the gap to the next', () => {
    const bar = [note('lead', 0, 4), note('lead', 4, 4), note('lead', 8, 8)];
    expect(readStyle(bar).artic).toBe(0);
  });

  it('reads staccato where each note is a fraction of its gap', () => {
    const bar = [note('lead', 0, 1), note('lead', 4, 1), note('lead', 8, 1), note('lead', 12, 1)];
    expect(readStyle(bar).artic).toBeCloseTo(0.75, 12);
  });

  it('measures the bass and the lead alone, by their median', () => {
    const long = [note('bass', 0, 8), note('bass', 8, 8)];
    const short = [note('lead', 0, 1), note('lead', 8, 1)];
    const drums = [0, 4, 8, 12].map((s) => note('drums', s, 1));
    expect(readStyle([...long, ...drums]).artic).toBe(0);
    expect(readStyle([...short, ...drums]).artic).toBeCloseTo(7 / 8, 12);
    // Two staccato notes and one legato: the median is the middle one.
    const mixed = [note('bass', 0, 8), note('lead', 0, 1), note('lead', 8, 1)];
    expect(readStyle(mixed).artic).toBeCloseTo(7 / 8, 12);
  });

  it('runs a part’s last note to the bar’s end, and clips a note that runs past it', () => {
    expect(readStyle([note('lead', 12, 4)]).artic).toBe(0);
    expect(readStyle([note('lead', 12, 9)]).artic).toBe(0);
    expect(readStyle([note('lead', 12, 1)]).artic).toBe(0.75);
  });

  it('is unread where neither the bass nor the lead plays', () => {
    expect(readStyle([note('drums', 0)]).artic).toBeUndefined();
  });
});

describe('reading a style from notes: density', () => {
  it('counts onsets per step of the bar, and a chord’s notes at one step as one onset', () => {
    const bar = [note('pad', 0), note('pad', 0, 1, 64), note('pad', 0, 1, 67), note('lead', 8)];
    expect(readStyle(bar).density).toBe(2 / 16);
  });

  it('reads an empty bar as silent', () => {
    expect(readStyle([])).toEqual({ density: 0 });
  });
});

describe('reading the band', () => {
  const bars = (style = INITIAL_STYLE, count = 16) => {
    let carried = band.initial;
    return range(count).map((bar) => {
      const env: BandEnv = {
        seed: 3,
        bar,
        style,
        wish: { tonic: null, mode: 'aeolian', melodic: null },
        offer: null,
      };
      const next = band.advance(env, carried, null);
      carried = next.carried;
      return next.output;
    });
  };

  it('reads the gate and not the written length as the articulation', () => {
    const at = (artic: number) =>
      bars({ ...INITIAL_STYLE, artic }, 8).map((b) => [b.written, b.dough] as const);
    for (const [written, dough] of at(1))
      if (readStyle(dough).artic !== undefined) {
        expect(readStyle(written).artic).toBe(0);
        expect(readStyle(dough).artic).toBeGreaterThan(0);
      }
  });

  it.each(PRESETS.map((p) => [p.name, p] as const))(
    'reads every axis it reads, in range, from %s',
    (_, preset) => {
      for (const bar of bars({ ...preset.style, entropy: 0.3 })) {
        const read = readStyle(bar.dough);
        for (const value of Object.values(read)) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
        }
        expect(read.sync ?? 0).toBeLessThanOrEqual(1);
        expect(read.artic ?? 0).toBeLessThanOrEqual(1);
      }
    },
  );
});

describe('reading a style from timing: bpm and swing', () => {
  /** A bar of steps laid straight at `bpm`, and onsets on `steps` played through `swing`. */
  const bar = (bpm: number, swing: number, steps: readonly number[]) => {
    const length = 15 / bpm;
    const laid = range(16).map((step) => ({ step, seconds: 2 + step * length, length }));
    const onsets = steps.map((s) => 2 + swingMap(swing).played(s) * length);
    return { laid, onsets };
  };
  const EIGHTHS_AND_SIXTEENTHS = range(16);

  it.each([60, 90, 120, 148, 180])(
    'reads the tempo from how long the steps last: %s bpm',
    (bpm) => {
      const { laid, onsets } = bar(bpm, 0, EIGHTHS_AND_SIXTEENTHS);
      expect(readTiming(laid, onsets).bpm).toBeCloseTo(bpm, 9);
    },
  );

  it.each([0, 0.15, 0.3, 0.5, 0.7, 0.85, 1])(
    'reads the swing from where the offbeat 16ths fall: %s',
    (swing) => {
      const { laid, onsets } = bar(120, swing, EIGHTHS_AND_SIXTEENTHS);
      expect(readTiming(laid, onsets).swing).toBeCloseTo(swing, 2);
    },
  );

  it('reads no tempo from no steps and no swing from no onsets', () => {
    expect(readTiming([], [])).toEqual({});
    expect(readTiming(bar(120, 0, []).laid, [])).toEqual({ bpm: 120 });
  });
});

describe('a style read on other meters (#260)', () => {
  const named = Object.entries(METERS) as [string, Meter][];

  it('reads a bar’s density over its own steps, and 4/4 as it was (finite: every meter)', () => {
    for (const [name, meter] of named) {
      const steps = stepsOf(meter);
      const onEveryStep = range(steps).map((step) => note('bass', step));
      expect([name, readStyle(onEveryStep, meter).density]).toEqual([name, 1]);
      expect([name, readStyle([note('bass', 0)], meter).density]).toEqual([name, 1 / steps]);
    }
    expect(readStyle([note('bass', 0)]).density).toBe(1 / 16);
  });

  it('counts a note off its meter’s pulses and off its eighths as syncopated, and no other (finite: every meter, every step)', () => {
    for (const [name, meter] of named) {
      const pulses = meterOnSteps(meter).heights;
      for (const step of range(stepsOf(meter))) {
        const onGrid = pulses.includes(step) || step % 2 === 0;
        expect([name, step, readStyle([note('lead', step)], meter).sync]).toEqual([
          name,
          step,
          onGrid ? 0 : 1,
        ]);
      }
    }
  });

  it('reads a note’s share of the gap to the bar’s end in the meter’s bar, not 4/4’s', () => {
    for (const [name, meter] of named) {
      const steps = stepsOf(meter);
      // One note held the whole bar sounds all of it; one held half sounds half.
      expect([name, readStyle([note('bass', 0, steps)], meter).artic]).toEqual([name, 0]);
      expect([name, readStyle([note('bass', 0, steps / 2)], meter).artic]).toEqual([name, 0.5]);
    }
  });
});
