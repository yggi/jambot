import { BAR_STEPS, SONG_METER, clicksOf, soundsAt } from '@jambot/engine';
import { METERS, type Meter, STEPS_PER_EIGHTH, meterOnSteps, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { barMarks, eighthHeard } from './bar.ts';

const SWINGS = [0, 0.25, 0.5, 0.75, 1];
const meters = Object.entries(METERS) as [string, Meter][];

describe('the bar, on any meter', () => {
  it('is the bar the engine clicks on the song’s meter: the same places at every swing', () => {
    const bar = Array.from({ length: BAR_STEPS }, (_, step) => ({
      step,
      seconds: step,
      length: 1,
    }));
    for (const swing of SWINGS) {
      const laid = bar.map((b) => ({ ...b, swing }));
      const clicks = new Map(clicksOf(laid).map((c) => [c.step, c.seconds]));
      barMarks(SONG_METER, swing, null).forEach((mark, step) =>
        expect(mark.at).toBeCloseTo(clicks.get(step) ?? soundsAt(laid[step]!), 12),
      );
    }
  });

  it('lays a mark on each step of every meter’s bar, two to an eighth (finite: every meter)', () => {
    for (const [name, meter] of meters) {
      const marks = barMarks(meter, 0, null);
      expect([name, marks.length]).toEqual([name, meter.cycle * STEPS_PER_EIGHTH]);
      expect([name, marks.length]).toEqual([name, stepsOf(meter)]);
      expect(marks.filter((m) => m.text !== undefined)).toHaveLength(meter.cycle);
    }
  });

  it('counts the pulses, and marks the eighths between them (finite: every meter)', () => {
    const counted = (meter: Meter) =>
      barMarks(meter, 0, null)
        .filter((m) => m.text !== undefined)
        .map((m) => m.text)
        .join(' ');
    expect(counted(METERS['4/4'])).toBe('1 & 2 & 3 & 4 &');
    expect(counted(METERS['6/8'])).toBe('1 & & 2 & &');
    expect(counted(METERS['7/8'])).toBe('1 & & 2 & 3 &');
    expect(counted(METERS['5/4'])).toBe('1 & 2 & 3 & 4 & 5 &');
    for (const [, meter] of meters) {
      const marks = barMarks(meter, 0, null);
      expect(marks.filter((m) => m.accent)).toHaveLength(1);
      expect(marks[0]!.accent).toBe(true);
      const pulses = marks.filter((m) => m.text !== undefined && m.text !== '&');
      expect(pulses).toHaveLength(meter.heights.length);
    }
  });

  it('never moves a pulse start, at any swing, and keeps every mark in the bar (finite: every meter, every swing)', () => {
    for (const [name, meter] of meters) {
      const starts = meterOnSteps(meter).heights;
      for (const swing of SWINGS) {
        const marks = barMarks(meter, swing, null);
        for (const step of starts)
          expect([name, swing, marks[step]!.at]).toEqual([name, swing, step]);
        for (const mark of marks) {
          expect(mark.at).toBeGreaterThanOrEqual(0);
          expect(mark.at).toBeLessThan(stepsOf(meter));
        }
      }
    }
  });

  it('lights the one eighth heard, and none before anything is', () => {
    for (const [, meter] of meters) {
      expect(barMarks(meter, 0, null).some((m) => m.lit)).toBe(false);
      for (let eighth = 0; eighth < meter.cycle; eighth++)
        expect(barMarks(meter, 0, eighth).flatMap((m, step) => (m.lit ? [step] : []))).toEqual([
          eighth * STEPS_PER_EIGHTH,
        ]);
    }
  });

  it('uses a map it is given in place of the meter’s swing', () => {
    const marks = barMarks(METERS['6/8'], 1, null, (step) => step + 0.5);
    expect(marks.map((m) => m.at)).toEqual(marks.map((_, step) => step + 0.5));
  });
});

describe('the eighth heard, on any meter', () => {
  it('is null before anything is heard, else the eighth of the bar the step is in, bar after bar (finite: every meter, two bars)', () => {
    for (const [, meter] of meters) {
      expect(eighthHeard(meter, null)).toBeNull();
      const steps = stepsOf(meter);
      for (let step = 0; step < 2 * steps; step++)
        expect(eighthHeard(meter, step)).toBe(Math.floor((step % steps) / STEPS_PER_EIGHTH));
    }
  });
});
