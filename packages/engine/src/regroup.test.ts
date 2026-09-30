import { METERS, type Meter } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type Regroup, readOnMeter } from './regroup.ts';

const KICK = [1, 0, 0, 0.7, 0, 0, 0.6, 0, 0, 0, 0.8, 0.35, 0, 0, 0.45, 0];
const GHOST = [0, 0.3, 0, 0.4, 0, 0.2, 0, 0.6, 0, 0.5, 0, 0.3, 0, 0.2, 0, 0.5];
const MODES: Regroup[] = ['fold', 'cycle'];
const meters = Object.entries(METERS) as [string, Meter][];
const hits = (table: readonly number[]) => table.flatMap((v, s) => (v > 0 ? [s] : []));

describe('a rhythm read on another meter', () => {
  it('reads 4/4 as itself, in either mode, bar after bar', () => {
    for (const mode of MODES)
      for (const table of [KICK, GHOST])
        for (let bar = 0; bar < 8; bar++)
          expect(readOnMeter(table, METERS['4/4'], mode, bar)).toEqual(table);
  });

  it('gives every meter a table of its own steps, every hit on a step it has and none of the strength lost or made (finite: every meter, both modes, eight bars)', () => {
    for (const [name, meter] of meters)
      for (const mode of MODES)
        for (let bar = 0; bar < 8; bar++)
          for (const table of [KICK, GHOST]) {
            const read = readOnMeter(table, meter, mode, bar);
            expect([name, mode, read.length]).toEqual([name, mode, meter.cycle * 2]);
            for (const value of read) expect(table.concat(0)).toContain(value);
          }
  });

  it('folds the later pulses onto the earlier in a bar of fewer, and leaves the last empty in a bar of more', () => {
    // 3/4: the fourth pulse's hit, at step 14, is read on the first pulse's second eighth.
    expect(hits(readOnMeter(KICK, METERS['3/4'], 'fold'))).toEqual([0, 2, 3, 6, 10, 11]);
    const five = readOnMeter(KICK, METERS['5/4'], 'fold');
    expect(hits(five).every((step) => step < 16)).toBe(true);
    expect(five.slice(16)).toEqual([0, 0, 0, 0]);
  });

  it('loses a hit only where two land on one step, and then keeps the stronger (6/8, the kick)', () => {
    const six = readOnMeter(KICK, METERS['6/8'], 'fold');
    expect(hits(six)).toEqual([0, 2, 3, 8]);
    expect(six[0]).toBe(1);
    // Step 10 (0.8) folds onto step 2; steps 3 (0.7) and 11 (0.35) meet on 3, and the 0.7 stays.
    expect([six[2], six[3], six[8]]).toEqual([0.8, 0.7, 0.6]);
  });

  it('keeps the downbeat in every bar when it cycles, and the pattern phases against the bar', () => {
    for (const [name, meter] of meters)
      for (let bar = 0; bar < 8; bar++)
        expect([name, bar, readOnMeter(KICK, meter, 'cycle', bar)[0]]).toEqual([name, bar, 1]);
    const bars = [0, 1, 2, 3].map((bar) => readOnMeter(KICK, METERS['7/8'], 'cycle', bar).join());
    expect(new Set(bars).size).toBeGreaterThan(1);
  });

  it('cycles by default, which the owner preferred to the fold', () => {
    for (const bar of [0, 1, 2, 3])
      expect(readOnMeter(KICK, METERS['5/4'], undefined, bar)).toEqual(
        readOnMeter(KICK, METERS['5/4'], 'cycle', bar),
      );
    expect(readOnMeter(KICK, METERS['5/4'], undefined, 1)).not.toEqual(
      readOnMeter(KICK, METERS['5/4'], 'fold', 1),
    );
  });

  it('fires: a hit moved one step in the source moves in the read', () => {
    const moved = [...KICK];
    moved[6] = 0;
    moved[7] = 0.6;
    expect(readOnMeter(moved, METERS['7/8'], 'fold')).not.toEqual(
      readOnMeter(KICK, METERS['7/8'], 'fold'),
    );
  });
});
