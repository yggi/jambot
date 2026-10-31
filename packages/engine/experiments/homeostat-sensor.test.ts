import { beforeAll, describe, expect, it } from 'vitest';
import { PROTOTYPE_PRESETS } from '../src/index.ts';
import { LOOP_FACETS, warmedRecogniser } from '../src/recognised.ts';
import {
  BAND,
  OVERS,
  type Over,
  type SensedRun,
  against,
  byPreset,
  costOf,
  sensedRun,
  sensedRuns,
} from './homeostat-sensor.ts';

// E44 (#237, step 6's first part): the homeostat's sensor over the 8 presets, held and walked, at entropies 0.1, 0.3
// and 0.6, every member through the loop, learning from an empty layer, nobody playing.
// Played before the tests rather than as the file is imported, so the time is the file's (the engine's `hookTimeout`).
const ENTROPIES = [0.1, 0.3, 0.6] as const;
/** Held: 2 seeds of 64 bars (8 sections) a preset, as E43 holds them. */
const HELD = { seeds: 2, bars: 64 } as const;
/** Walked: 2 seeds of 256 bars (32 sections, about 10 minutes of music) a preset. */
const WALKED = { seeds: 2, bars: 256 } as const;
/** The tolerances tried beside cells' default, 0, on the presets held at 0.3. */
const TOLERANCES = [1, 2, 4] as const;

const held: Record<number, SensedRun[]> = {};
const walked: Record<number, SensedRun[]> = {};
const tolerant: Record<number, SensedRun[]> = {};
let unchanged: { sensed: string[]; unsensed: string[] }[] = [];

const rounded = (_: string, v: unknown) =>
  typeof v === 'number' ? Math.round(v * 1000) / 1000 : v;
const table = (runs: SensedRun[]) =>
  Object.fromEntries(OVERS.map((o) => [o, against(runs, o)])) as Record<
    Over,
    ReturnType<typeof against>
  >;

beforeAll(() => {
  const recogniser = warmedRecogniser();
  for (const entropy of ENTROPIES) {
    held[entropy] = sensedRuns(entropy, false, HELD.seeds, HELD.bars, recogniser);
    walked[entropy] = sensedRuns(entropy, true, WALKED.seeds, WALKED.bars, recogniser);
  }
  for (const tolerance of TOLERANCES)
    tolerant[tolerance] = sensedRuns(0.3, false, HELD.seeds, HELD.bars, recogniser, tolerance);
  unchanged = PROTOTYPE_PRESETS.map((preset) => ({
    sensed: [...sensedRun(preset, 1, 0.3, HELD.bars, true, recogniser, true).events],
    unsensed: [...sensedRun(preset, 1, 0.3, HELD.bars, true, null, true).events],
  }));
  if (process.env.E44_REPORT)
    console.log(
      JSON.stringify(
        {
          held: Object.fromEntries(ENTROPIES.map((e) => [e, table(held[e]!)])),
          walked: Object.fromEntries(ENTROPIES.map((e) => [e, table(walked[e]!)])),
          tolerant: Object.fromEntries(TOLERANCES.map((t) => [t, table(tolerant[t]!)])),
          heldByPreset: byPreset(held[0.3]!, 'all'),
          walkedByPreset: byPreset(walked[0.3]!, 'all'),
          costHeld: costOf(held[0.3]!),
          costWalked: costOf(walked[0.3]!),
          costTolerant: Object.fromEntries(TOLERANCES.map((t) => [t, costOf(tolerant[t]!)])),
        },
        rounded,
        1,
      ),
    );
});

describe('the sensor beside the band (E44, #237)', () => {
  it('changes no event the band plays: every preset walked, sensed and not, event for event', () => {
    for (const { sensed, unsensed } of unchanged) {
      expect(sensed.length).toBeGreaterThan(0);
      expect(sensed).toEqual(unsensed);
    }
  });
});

const fixed = (a: ReturnType<typeof against>) =>
  [a.sections, a.mean, a.spread, a.inside, a.pinned].map((x) => Number(x.toFixed(3)));

describe('the share of bars recognised over 8 bars, over the 8 presets at entropy 0.3 (E44, #237)', () => {
  it('sits below the ruled band over all members, held and walked: 75 % of sections or more under 0.4 (97 of 128 held)', () => {
    // (sections, mean, spread, share inside the band, share pinned at 0 or 1)
    expect(fixed(against(held[0.3]!, 'all'))).toEqual([128, 0.238, 0.186, 0.242, 0.172]);
    expect(fixed(against(walked[0.3]!, 'all'))).toEqual([512, 0.237, 0.192, 0.211, 0.199]);
    for (const runs of [held[0.3]!, walked[0.3]!]) {
      const all = against(runs, 'all');
      expect(all.mean).toBeLessThan(BAND.low);
      expect(all.below).toBeGreaterThanOrEqual(0.75);
    }
  });

  it('recognises over half the lead’s bars, cells’ motifs and their variations (#520), and nearly none of the drums', () => {
    for (const runs of [held[0.3]!, walked[0.3]!]) {
      expect(against(runs, 'lead').mean).toBeGreaterThan(0.5);
      expect(against(runs, 'rhythm').mean).toBeLessThan(0.02);
    }
  });

  it('pins the share of each member but the lead at 0 or 1 in 70 % of its sections or more, and the share over all members in fewer', () => {
    // (the reason the controlled share is the one over all members: it is the one that moves; the lead's phrase is its
    // motif and a variation of it in turn, the composer's or its own, so its share is seldom pinned)
    for (const runs of [held[0.3]!, walked[0.3]!]) {
      const all = against(runs, 'all').pinned;
      expect(against(runs, 'lead').pinned).toBeLessThan(0.2);
      for (const facet of LOOP_FACETS.filter((f) => f !== 'lead')) {
        expect(against(runs, facet).pinned, facet).toBeGreaterThanOrEqual(0.7);
        expect(against(runs, facet).pinned, facet).toBeGreaterThan(all);
      }
    }
  });
});

describe('the share over entropy and tolerance (E44, #237)', () => {
  it('barely moves with entropy from 0.1 to 0.6, held or walked: within 0.03 of its mean at 0.3', () => {
    for (const runs of [held, walked])
      for (const entropy of ENTROPIES)
        expect(
          Math.abs(against(runs[entropy]!, 'all').mean - against(runs[0.3]!, 'all').mean),
        ).toBeLessThan(0.03);
  });

  it('rises with the tolerance, to 66 % of sections inside the band at 4 notes, over all members (held at 0.3)', () => {
    const means = [held[0.3]!, ...TOLERANCES.map((t) => tolerant[t]!)].map((r) =>
      Number(against(r, 'all').mean.toFixed(3)),
    );
    expect(means).toEqual([0.238, 0.28, 0.382, 0.579]);
    expect(fixed(against(tolerant[4]!, 'all'))).toEqual([128, 0.579, 0.158, 0.656, 0]);
  });
});

describe('the cost of recognition (E44, #237)', () => {
  it('is measured for every bar and every member that played', () => {
    for (const runs of [held[0.3]!, walked[0.3]!]) {
      const cost = costOf(runs);
      for (const key of ['bar', 'warm', ...LOOP_FACETS] as const)
        expect(Number.isFinite(cost[key].p95), key).toBe(true);
    }
  });
});
