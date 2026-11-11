import { beforeAll, describe, expect, it } from 'vitest';
import { LAYER_CAP, METER_HOLD, MISS_DISTANCE, SECTION_BARS } from '../src/index.ts';
import {
  gridDistances,
  learnedBytes,
  learningRuns,
  lockIn,
  meterRuns,
  missShare,
  queryCost,
  wentBack,
} from './meter-radio.ts';

// Played before the tests rather than as the file is imported, so the time is the file's, and run first (the
// engine's `hookTimeout`).
let RUNS: ReturnType<typeof meterRuns> = [];
let changes: (typeof RUNS)[number]['changes'][number][] = [];
let sections = 0;
// (E34 again with no margin for the meter playing, and with half of it: the times each goes back)
let backs: number[] = [];
beforeAll(() => {
  RUNS = meterRuns();
  backs = [0, METER_HOLD / 2].map(
    (hold) =>
      meterRuns(undefined, undefined, { miss: MISS_DISTANCE, hold }).flatMap(wentBack).length,
  );
  changes = RUNS.flatMap((r) => r.changes);
  sections = RUNS.reduce((n, r) => n + r.sections, 0);
  if (process.env.E34_REPORT) {
    const minutes: Record<string, number> = {};
    for (const r of RUNS)
      for (const [k, v] of Object.entries(r.minutes)) minutes[k] = (minutes[k] ?? 0) + v;
    console.log({ changes: changes.length, sections, minutes });
    for (const r of RUNS) console.log(r.preset, r.seed, r.changes.length, r.missed);
  }
});

describe('the composer asks the repository for its meter while the radio walks (E34)', () => {
  // (since cells v0.23.0 a meter's point is on sync, harm and bite alone, energy having left the style point and a meter
  // speaking to no mood, so the walk crosses its borders about twice as often, and goes back once: decision 076)
  // (414 times since cells v0.24.0, whose plain and swung 4/4 sit at its eight new styles' points too: 416 before)
  it('changes the meter only where a section starts, 414 times in 120 hours, and back at the next section once (E34)', () => {
    expect(RUNS).toHaveLength(40);
    expect(changes).toHaveLength(414);
    for (const c of changes) expect(c.bar % SECTION_BARS, `${c.from} to ${c.to}`).toBe(0);
    expect(RUNS.flatMap(wentBack)).toEqual([
      { bar: 656, section: 82, from: 'meter', to: 'meter(grouping=meter("10/8"))' },
    ]);
    expect(sections).toBe(26689);
  });

  // (381 and 18 before cells v0.24.0)
  it('goes back 361 times with no margin for the meter playing, and 25 times with half of it (E34)', () => {
    expect(backs).toEqual([361, 25]);
  });

  // (since cells v0.24.0, whose plain 4/4 sits at Trip-hop's and Salsa's points too, far toward the axes' corners: 70
  // sections missed before, 2.94 % of the space, the farthest point 0.449 away)
  it('misses in none of the radio’s sections, 0.1 % of the axes’ space, in its corners (E34)', () => {
    expect(RUNS.reduce((n, r) => n + r.missed, 0)).toBe(0);
    const grid = gridDistances();
    expect(missShare(grid).toFixed(4)).toBe('0.0010');
    expect(grid.reduce((a, d) => Math.max(a, d), 0).toFixed(3)).toBe('0.342');
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

describe('the band learns the meters it keeps while the radio walks (E34, #398)', () => {
  let LEARNED: ReturnType<typeof learningRuns> = [];
  beforeAll(() => {
    LEARNED = learningRuns();
  });

  // (1.92 points (0.79), 92.72 % to 94.64 % over 26,776 sections, before cells v0.24.0)
  it('adds 1.5 points to the share of sections among a run’s 3 most used meters, within 5 with twice its error (cells decision 048)', () => {
    // The same walks, each run paired with its own unlearned: a meter learned may last other than the one it replaced, so the hours hold other counts of sections.
    expect(LEARNED.map((r) => [r.preset, r.seed])).toEqual(RUNS.map((r) => [r.preset, r.seed]));
    expect(LEARNED.reduce((n, r) => n + r.sections, 0)).toBe(26658);
    const { before, after, added, error } = lockIn(RUNS, LEARNED);
    if (process.env.E34_REPORT) console.log({ before, after, added, error });
    expect([before.toFixed(4), after.toFixed(4)]).toEqual(['0.9365', '0.9518']);
    expect(added.toFixed(2)).toBe('1.53');
    expect(error.toFixed(2)).toBe('0.54');
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  // (248 before cells v0.24.0, where the walk unlearned missed 70 sections)
  it('changes the meter 261 times in 120 hours, never back at the next section, and misses never: learning reaches farther', () => {
    expect(LEARNED.reduce((n, r) => n + r.changes.length, 0)).toBe(261);
    expect(LEARNED.flatMap(wentBack)).toEqual([]);
    expect(LEARNED.reduce((n, r) => n + r.missed, 0)).toBe(0);
  });

  // (945 bytes and 9 points before cells v0.24.0)
  it(`keeps a layer of at most 1,074 bytes after 3 hours, far under its cap of ${LAYER_CAP.toLocaleString('en')}`, () => {
    const bytes = learnedBytes(LEARNED);
    expect(Math.max(...bytes)).toBe(1074);
    expect(Math.max(...LEARNED.map((r) => r.layer!.points.length))).toBe(10);
  });
});
