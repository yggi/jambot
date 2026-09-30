import { METERS, type Meter, gaps, meterOnSteps } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { TERNARY_REACH, meterMap, ternaryMap } from './ternary.ts';

const meters = Object.entries(METERS) as [string, Meter][];
const AMOUNTS = [0, 0.25, 0.5, 0.75, 1];
const SWINGS = [0, 0.5, 1];
/** Positions across two bars, a quarter of a step apart. */
const across = (meter: Meter) => Array.from({ length: 2 * meter.cycle * 2 * 4 }, (_, i) => i / 4);

describe('the ternary swing', () => {
  it('is no map at none, in every meter', () => {
    for (const [, meter] of meters)
      for (const x of across(meter)) expect(ternaryMap(meter, 0).played(x)).toBe(x);
  });

  it('never moves a pulse start, at any amount (finite: every meter, every amount)', () => {
    for (const [name, meter] of meters)
      for (const amount of AMOUNTS)
        for (const start of meterOnSteps(meter).heights)
          expect([name, amount, ternaryMap(meter, amount).played(start)]).toEqual([
            name,
            amount,
            start,
          ]);
  });

  it('moves the second eighth of a pulse of three late by the reach, and the third by half, and no other pulse’s', () => {
    const six = METERS['6/8'];
    const map = ternaryMap(six, 1);
    expect(map.played(2)).toBe(2 + TERNARY_REACH);
    expect(map.played(4)).toBe(4 + TERNARY_REACH / 2);
    expect(map.played(8)).toBe(8 + TERNARY_REACH);
    expect(ternaryMap(METERS['4/4'], 1).played(2)).toBe(2);
    const seven = ternaryMap(METERS['7/8'], 1);
    expect(gaps(METERS['7/8'])).toEqual([3, 2, 2]);
    expect(seven.played(2)).toBe(2 + TERNARY_REACH);
    expect(seven.played(8)).toBe(8);
  });

  it('keeps time in order and reads back what it played (finite: every meter, every amount)', () => {
    for (const [name, meter] of meters)
      for (const amount of AMOUNTS) {
        const map = ternaryMap(meter, amount);
        const xs = across(meter);
        const played = xs.map((x) => map.played(x));
        for (let i = 1; i < played.length; i++)
          expect([name, amount, i, played[i]! > played[i - 1]!]).toEqual([name, amount, i, true]);
        xs.forEach((x, i) => expect(map.written(played[i]!)).toBeCloseTo(x, 9));
      }
  });

  it('follows the swing’s, so the swing and the ternary swing together stay ordered and keep the pulse starts', () => {
    for (const [name, meter] of meters)
      for (const swing of SWINGS)
        for (const amount of AMOUNTS) {
          const map = meterMap(meter, swing, amount);
          const xs = across(meter);
          const played = xs.map((x) => map.played(x));
          for (let i = 1; i < played.length; i++)
            expect([name, swing, amount, i, played[i]! > played[i - 1]!]).toEqual([
              name,
              swing,
              amount,
              i,
              true,
            ]);
          for (const start of meterOnSteps(meter).heights) expect(map.played(start)).toBe(start);
        }
  });
});
