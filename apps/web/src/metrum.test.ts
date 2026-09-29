import { BAR_STEPS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { METER_NAME, barMarks } from './metrum.ts';

describe('the metrum', () => {
  it('names the song’s meter', () => expect(METER_NAME).toBe('4/4'));

  it('lays a mark on each step of the bar, the eighths counted 1 & 2 & 3 & 4 &, the downbeat accented', () => {
    const marks = barMarks(0, null);
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
    const straight = barMarks(0, null);
    const moved = (swing: number) =>
      barMarks(swing, null).map((m, i) => m.at - straight[i]!.at > 1e-9);
    const step = (i: number) => i % 4;
    for (const swing of [0.25, 0.5, 0.75, 1]) {
      const marks = barMarks(swing, null);
      moved(swing).forEach((late, i) => {
        if (step(i) === 0) expect(late).toBe(false);
        if (step(i) === 1 || step(i) === 3) expect(late).toBe(true);
        if (step(i) === 2) expect(late).toBe(swing > 0.5);
        expect(marks[i]!.at).toBeLessThan(BAR_STEPS);
      });
    }
    const offbeat = (swing: number) => barMarks(swing, null)[2]!.at;
    expect(offbeat(1)).toBeGreaterThan(offbeat(0.75));
  });

  it('lights the eighth heard, and none before anything is', () => {
    expect(barMarks(0, null).some((m) => m.lit)).toBe(false);
    const lit = barMarks(0, 5).flatMap((m, i) => (m.lit ? [i] : []));
    expect(lit).toEqual([10]);
  });
});
