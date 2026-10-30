import { beforeAll, describe, expect, it } from 'vitest';
import { against, warmedRecogniser } from './homeostat-sensor.ts';
import {
  type RegulatedRun,
  type RunOptions,
  cameInside,
  costOf,
  insideOf,
  regulatedRuns,
  reversalsOf,
} from './homeostat.ts';

// E45 (#237, step 6): the homeostat's controller over the 8 presets, nobody playing, learning from an empty layer.
// Played before the tests rather than as the file is imported, so the time is the file's (the engine's `hookTimeout`).
const ENTROPY = 0.3;
/** Held: 1 seed of 96 bars (12 sections) a preset. */
const HELD = { seeds: 1, bars: 96 } as const;
/** Walked: 1 seed of 128 bars (16 sections) a preset. */
const WALKED = { seeds: 1, bars: 128 } as const;
/**
 * `E45_FULL=1` (with `E45_REPORT=1`) reports a larger set beside the tests' own, which it doesn't test: held at 0.1,
 * 0.3 and 0.6, 2 seeds of 128 bars, and walked at 0.3, 2 seeds of 256 bars, each open, leaned all the way up, and
 * closed (about 15 minutes).
 */
const FULL = {
  entropies: [0.1, 0.3, 0.6],
  held: { seeds: 2, bars: 128 },
  walked: { seeds: 2, bars: 256 },
} as const;

type Modes = 'open' | 'down' | 'up' | 'closed' | 'fromDown';
const held: Record<Modes, RegulatedRun[]> = {
  open: [],
  down: [],
  up: [],
  closed: [],
  fromDown: [],
};
const walked: Record<'open' | 'closed', RegulatedRun[]> = { open: [], closed: [] };

const runsOf = (
  entropy: number,
  { seeds, bars }: { readonly seeds: number; readonly bars: number },
  options: RunOptions,
) => regulatedRuns(entropy, seeds, bars, warmedRecogniser, options);

/** A run's options by mode: open at no lean, open leaned all the way down or up, closed, and closed from all the way down. */
const modeOf = (mode: Modes, entropy: number, walking: boolean): RunOptions =>
  mode === 'open'
    ? { walking, controlled: false }
    : mode === 'down'
      ? { walking, controlled: false, lean: -entropy }
      : mode === 'up'
        ? { walking, controlled: false, lean: 1 - entropy }
        : mode === 'closed'
          ? { walking, controlled: true }
          : { walking, controlled: true, lean: -entropy };

const summary = (runs: RegulatedRun[]) => {
  const all = against(runs, 'all');
  return {
    mean: all.mean,
    spread: all.spread,
    inside: insideOf(runs),
    insideFromThird: insideOf(runs, 2),
    above: all.above,
    below: all.below,
    reversals: reversalsOf(runs),
    cameInside: cameInside(runs),
    leans: runs.map((r) => r.homeostat.lean),
    cost: costOf(runs),
  };
};

const rounded = (_: string, v: unknown) =>
  typeof v === 'number' ? Math.round(v * 1000) / 1000 : v;

beforeAll(() => {
  for (const mode of Object.keys(held) as Modes[])
    held[mode] = runsOf(ENTROPY, HELD, modeOf(mode, ENTROPY, false));
  walked.open = runsOf(ENTROPY, WALKED, modeOf('open', ENTROPY, true));
  walked.closed = runsOf(ENTROPY, WALKED, modeOf('closed', ENTROPY, true));
  if (!process.env.E45_REPORT) return;
  const report = (runs: Record<string, RegulatedRun[]>) =>
    Object.fromEntries(Object.entries(runs).map(([k, r]) => [k, summary(r)]));
  const modes = ['open', 'up', 'closed'] as const;
  const full = process.env.E45_FULL
    ? {
        held: Object.fromEntries(
          FULL.entropies.map((e) => [
            e,
            report(
              Object.fromEntries(modes.map((m) => [m, runsOf(e, FULL.held, modeOf(m, e, false))])),
            ),
          ]),
        ),
        walked: report(
          Object.fromEntries(
            modes.map((m) => [m, runsOf(ENTROPY, FULL.walked, modeOf(m, ENTROPY, true))]),
          ),
        ),
      }
    : {};
  console.log(JSON.stringify({ held: report(held), walked: report(walked), full }, rounded, 1));
});

const fixed = (x: number) => Number(x.toFixed(3));

describe('what the lean can reach: the band’s entropy from 0 to 1, open (E45, #237)', () => {
  it('moves the share over all members down as the lean rises, in every preset, held at entropy 0.3', () => {
    expect([held.down, held.open, held.up].map((r) => fixed(against(r, 'all').mean))).toEqual([
      0.78, 0.729, 0.632,
    ]);
    for (const preset of new Set(held.open.map((r) => r.preset))) {
      const of = (runs: RegulatedRun[]) =>
        against(
          runs.filter((r) => r.preset === preset),
          'all',
        ).mean;
      expect(of(held.up), preset).toBeLessThan(of(held.down));
    }
  });

  it('sits above the band (bored) more than under it (confused) wherever it is leaned', () => {
    for (const runs of [held.down, held.open, held.up]) {
      const all = against(runs, 'all');
      expect(all.above).toBeGreaterThan(all.below);
    }
  });
});

describe('the controller closed (E45, #237)', () => {
  it('brings more sections inside the band than left alone, held and walked, and no more than the lean all the way up', () => {
    expect([held.open, held.closed, held.up].map((r) => fixed(insideOf(r)))).toEqual([
      0.344, 0.563, 0.635,
    ]);
    expect([walked.open, walked.closed].map((r) => fixed(insideOf(r)))).toEqual([0.336, 0.539]);
  });

  it('falls short of the ruled 80 % of sections inside, held and walked: the lean’s reach bounds it', () => {
    for (const runs of [held.closed, walked.closed, held.up])
      expect(insideOf(runs)).toBeLessThan(0.8);
  });

  it('never reverses in these runs, under the ruled one per four sections', () => {
    for (const runs of [held.closed, held.fromDown, walked.closed])
      expect(reversalsOf(runs).most).toBe(0);
  });

  it('climbs where bored: every preset held ends leaned up, none down', () => {
    const leans = held.closed.map((r) => r.homeostat.lean);
    expect(leans.filter((l) => l > 0)).toHaveLength(8);
    expect(leans.filter((l) => l < 0)).toHaveLength(0);
  });

  it('measures how many sections a run leaned all the way down takes to come inside, and what a bar costs', () => {
    expect(cameInside(held.fromDown)).toEqual([3, 1, 2, 5, 1, 4, 3, 3]);
    for (const runs of [held.closed, walked.closed])
      expect(Number.isFinite(costOf(runs).p95)).toBe(true);
  });
});
