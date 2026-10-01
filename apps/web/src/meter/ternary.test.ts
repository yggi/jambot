import { METERS, type Meter, gaps, meterOnSteps } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { TERNARY_REACH, meterMap, ternaryMap } from './ternary.ts';

const meters = Object.entries(METERS) as [string, Meter][];
const AMOUNTS = [-1, -0.5, 0, 0.25, 0.5, 0.75, 1];
/** The swing's two levels as shares: straight, early, triplet, dotted, and each level against the other. */
const SHARES = [
  { eighth: 0.5, sixteenth: 0.5 },
  { eighth: 0.25, sixteenth: 0.75 },
  { eighth: 2 / 3, sixteenth: 0.5 },
  { eighth: 0.75, sixteenth: 0.25 },
];
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

  it('pulls the eighths of a pulse of three early at a negative amount: short, long, long', () => {
    const map = ternaryMap(METERS['6/8'], -1);
    expect(map.played(2)).toBe(2 - TERNARY_REACH);
    expect(map.played(4)).toBe(4 - TERNARY_REACH / 2);
    const late = ternaryMap(METERS['6/8'], 1);
    const lasts = (m: typeof map) => [
      m.played(2) - m.played(0),
      m.played(4) - m.played(2),
      m.played(6) - m.played(4),
    ];
    expect(lasts(late)).toEqual([3, 1.5, 1.5]);
    expect(lasts(map)).toEqual([1, 2.5, 2.5]);
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
      for (const shares of SHARES)
        for (const amount of AMOUNTS) {
          const map = meterMap(meter, shares, amount);
          const xs = across(meter);
          const played = xs.map((x) => map.played(x));
          for (let i = 1; i < played.length; i++)
            expect([name, shares, amount, i, played[i]! > played[i - 1]!]).toEqual([
              name,
              shares,
              amount,
              i,
              true,
            ]);
          for (const start of meterOnSteps(meter).heights) expect(map.played(start)).toBe(start);
        }
  });
});
