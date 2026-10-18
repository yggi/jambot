import { describe, expect, it } from 'vitest';
import { METER_HOLD, MISS_DISTANCE, SECTION_BARS } from '../src/index.ts';
import { gridDistances, meterRuns, missShare, queryCost, wentBack } from './meter-radio.ts';

const RUNS = meterRuns();
const changes = RUNS.flatMap((r) => r.changes);
const sections = RUNS.reduce((n, r) => n + r.sections, 0);
if (process.env.E34_REPORT) {
  const minutes: Record<string, number> = {};
  for (const r of RUNS)
    for (const [k, v] of Object.entries(r.minutes)) minutes[k] = (minutes[k] ?? 0) + v;
  console.log({ changes: changes.length, sections, minutes });
  for (const r of RUNS) console.log(r.preset, r.seed, r.changes.length, r.missed);
}

describe('the composer asks the repository for its meter while the radio walks (E34)', () => {
  it('changes the meter only where a section starts, 211 times in 120 hours, and never back at the next section (E34)', () => {
    expect(RUNS).toHaveLength(40);
    expect(changes).toHaveLength(211);
    for (const c of changes) expect(c.bar % SECTION_BARS, `${c.from} to ${c.to}`).toBe(0);
    expect(RUNS.flatMap(wentBack)).toEqual([]);
    expect(sections).toBe(26691);
  });

  it('goes back 271 times with no margin for the meter playing, and twice with half of it (E34)', () => {
    const back = (hold: number) =>
      meterRuns(undefined, undefined, { miss: MISS_DISTANCE, hold }).flatMap(wentBack).length;
    expect([back(0), back(METER_HOLD / 2)]).toEqual([271, 2]);
  });

  it('misses in 201 of the radio’s sections, 10 % of the axes’ space, toward its corners (E34)', () => {
    expect(RUNS.reduce((n, r) => n + r.missed, 0)).toBe(201);
    const grid = gridDistances();
    expect(missShare(grid).toFixed(4)).toBe('0.1027');
    expect(grid.reduce((a, d) => Math.max(a, d), 0).toFixed(3)).toBe('0.466');
  });

  it('moves the style’s point 0.014 a section on average, 0.021 at the 99th percentile: about the margin (E34)', () => {
    const moves = RUNS.flatMap((r) => r.moves).sort((a, b) => a - b);
    const mean = moves.reduce((a, b) => a + b, 0) / moves.length;
    expect(mean.toFixed(3)).toBe('0.014');
    expect(moves[Math.floor(moves.length * 0.99)]!.toFixed(3)).toBe('0.021');
  });

  it('asks in well under 1 ms a section (E34)', () => {
    expect(queryCost(() => performance.now())).toBeLessThan(0.1);
  });
});
