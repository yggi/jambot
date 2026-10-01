import { BAR_STEPS, SONG_METER, clicksOf, soundsAt } from '@jambot/engine';
import { METERS, type Meter, STEPS_PER_EIGHTH, meterOnSteps, stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { barMarks, eighthHeard, marksPlayed } from './bar.ts';

const SWINGS = [0, 0.25, 0.5, 0.75, 1];
const meters = Object.entries(METERS) as [string, Meter][];

describe('the bar, on any meter', () => {
  it('is the bar the engine clicks on the song’s meter: the same places at every swing', () => {
    const bar = Array.from({ length: BAR_STEPS }, (_, step) => ({
      step,
      seconds: step,
      length: 1,
      pulse: { start: step - (step % 4), length: 4 },
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

  it('puts a mark where a map it is given plays it, in place of the swing axis', () => {
    const marks = marksPlayed(METERS['6/8'], (step) => step + 0.5, null);
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

describe('the bar of the song’s 4/4, as the metrum draws it', () => {
  const barMarks4 = (swing: number, heard: number | null) => barMarks(SONG_METER, swing, heard);

  it('lays a mark on each step of the bar, the eighths counted 1 & 2 & 3 & 4 &, the downbeat accented', () => {
    const marks = barMarks4(0, null);
    expect(marks.map((m) => m.at)).toEqual([...Array(BAR_STEPS).keys()]);
    const eighths = marks.filter((m) => m.text !== undefined);
    expect(eighths.map((m) => m.text)).toEqual(['1', '&', '2', '&', '3', '&', '4', '&']);
    expect(eighths.map((m) => m.at)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(marks.filter((m) => m.accent)).toHaveLength(1);
    expect(marks[0]!.accent).toBe(true);
    expect(eighths.filter((m) => m.minor).map((m) => m.text)).toEqual(['&', '&', '&', '&']);
    expect(marks.filter((m) => m.faint)).toHaveLength(8);
  });

  it('swings the sixteenths first and the offbeat eighths from half way, and never a beat', () => {
    const straight = barMarks4(0, null);
    const moved = (swing: number) =>
      barMarks4(swing, null).map((m, i) => m.at - straight[i]!.at > 1e-9);
    const step = (i: number) => i % 4;
    for (const swing of [0.25, 0.5, 0.75, 1]) {
      const marks = barMarks4(swing, null);
      moved(swing).forEach((late, i) => {
        if (step(i) === 0) expect(late).toBe(false);
        if (step(i) === 1 || step(i) === 3) expect(late).toBe(true);
        if (step(i) === 2) expect(late).toBe(swing > 0.5);
        expect(marks[i]!.at).toBeLessThan(BAR_STEPS);
      });
    }
    const offbeat = (swing: number) => barMarks4(swing, null)[2]!.at;
    expect(offbeat(1)).toBeGreaterThan(offbeat(0.75));
  });

  it('lights the eighth heard, and none before anything is', () => {
    expect(barMarks4(0, null).some((m) => m.lit)).toBe(false);
    const lit = barMarks4(0, 5).flatMap((m, i) => (m.lit ? [i] : []));
    expect(lit).toEqual([10]);
  });
});

describe('the eighth heard, in the song’s 4/4', () => {
  it('is null before anything is heard, else the eighth of the bar the step is in', () => {
    expect(eighthHeard(SONG_METER, null)).toBeNull();
    const perBar = Array.from({ length: BAR_STEPS }, (_, step) => eighthHeard(SONG_METER, step));
    expect(perBar).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]);
    expect(eighthHeard(SONG_METER, BAR_STEPS + 5)).toBe(2);
  });
});
