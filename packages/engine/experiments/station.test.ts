import { describe, expect, it } from 'vitest';
import { MIXES_KEPT } from '../src/rotation.ts';
import { type StationRun, stationRuns } from './station.ts';

// The numbers are literals, to be moved by the step that moves them.
/** E47: every preset, seeds 1 and 2, held and walked, 3 hours each at entropy 0.3. */
const RUNS = stationRuns();
const held = RUNS.filter((r) => !r.walked);
const walked = RUNS.filter((r) => r.walked);
const sum = (runs: readonly StationRun[], of: keyof StationRun) =>
  runs.reduce((n, r) => n + (r[of] as number), 0);

describe('the station, 3 hours a run (E47, #547)', () => {
  it('runs every preset at both seeds, held and walked: 30,270 sections each way, 4,454 and 4,399 songs started', () => {
    expect([held.length, walked.length]).toEqual([46, 46]);
    expect([sum(held, 'sections'), sum(walked, 'sections')]).toEqual([30270, 30270]);
    expect([sum(held, 'starts'), sum(walked, 'starts')]).toEqual([4454, 4399]);
  });

  it('never plays a song twice in a row', () => {
    expect([sum(held, 'backToBack'), sum(walked, 'backToBack')]).toEqual([0, 0]);
  });

  it('makes 8 songs at a preset held, its cap at entropy 0.3, then plays them in rotation; walked, it makes more where the style leaves them behind', () => {
    expect(held.every((r) => r.made === 8)).toBe(true);
    expect(sum(walked, 'made')).toBe(564);
    expect([sum(held, 'overCap'), sum(walked, 'overCap')]).toEqual([0, 0]);
  });

  it('plays every song’s themes again as it first played them, and starts every later play from its lead line, or a variation the ladder made of it at once', () => {
    expect([sum(held, 'themesCompared'), sum(walked, 'themesCompared')]).toEqual([27694, 26312]);
    expect([sum(held, 'themesDiffering'), sum(walked, 'themesDiffering')]).toEqual([0, 0]);
    expect([sum(held, 'leadsCompared'), sum(walked, 'leadsCompared')]).toEqual([4039, 3813]);
    expect([sum(held, 'leadsDiffering'), sum(walked, 'leadsDiffering')]).toEqual([0, 0]);
  });

  it('draws the song that fits best more often than a draw at random would where the radio walks, 1.26 times as often (bound 1.2); held, every song fits as well', () => {
    const ratio = (runs: readonly StationRun[]) => sum(runs, 'nearest') / sum(runs, 'uniform');
    expect([sum(walked, 'draws'), sum(walked, 'nearest')]).toEqual([2116, 565]);
    expect(Number(ratio(walked).toFixed(2))).toBe(1.26);
    expect(ratio(walked)).toBeGreaterThanOrEqual(1.2);
    // (held, all its songs made at the preset's point: only the station's boredom tells them apart)
    expect([sum(held, 'draws'), sum(held, 'nearest')]).toEqual([4086, 623]);
    expect(Number(ratio(held).toFixed(2))).toBe(1.07);
  });

  it('mixes a song played again as often as the entropy says: 1,127 of 4,086 plays held (0.28), 1,117 of 3,835 walked (0.29), at 0.3', () => {
    expect([sum(held, 'replays'), sum(held, 'mixed')]).toEqual([4086, 1127]);
    expect([sum(walked, 'replays'), sum(walked, 'mixed')]).toEqual([3835, 1117]);
    for (const runs of [held, walked])
      expect(Math.abs(sum(runs, 'mixed') / sum(runs, 'replays') - 0.3)).toBeLessThan(0.03);
  });

  it('starts every play of a version kept from its tonic, and from its drum bar and bass line wherever the ladder hasn’t rejected them, or a variation the ladder made of them at once', () => {
    expect([sum(held, 'versionsCompared'), sum(walked, 'versionsCompared')]).toEqual([3220, 3033]);
    expect([sum(held, 'versionsDiffering'), sum(walked, 'versionsDiffering')]).toEqual([0, 0]);
    // (where the band learns, the ladder tires of a drum bar or bass line across songs: a held station's songs mostly
    // share the preset's, so at about half the plays it is rejected, and the next nearest plays)
    expect([sum(held, 'versionsRejected'), sum(walked, 'versionsRejected')]).toEqual([1791, 1550]);
  });

  it('makes every new mix differ from its original in the tonic or the groove, and keeps at most MIXES_KEPT mixes a song', () => {
    expect([sum(held, 'mixesMade'), sum(walked, 'mixesMade')]).toEqual([866, 802]);
    expect([sum(held, 'mixesSame'), sum(walked, 'mixesSame')]).toEqual([0, 0]);
    expect(Math.max(...RUNS.map((r) => r.mostMixes))).toBe(MIXES_KEPT);
  });

  it('makes mixes of all four kinds, each a quarter or so; keeps every speed mix within ±3 % to ±8 % of its original; and marks every section of a play with its version’s tempo and style shift (step 2b)', () => {
    const changed = (runs: readonly StationRun[]) => {
      const all: Record<string, number> = {};
      for (const r of runs)
        for (const [kind, n] of Object.entries(r.changed)) all[kind] = (all[kind] ?? 0) + (n ?? 0);
      return all;
    };
    expect(changed(held)).toEqual({ key: 290, groove: 252, speed: 211, style: 247 });
    expect(changed(walked)).toEqual({ key: 239, groove: 236, speed: 234, style: 213 });
    expect([sum(held, 'speedsOutside'), sum(walked, 'speedsOutside')]).toEqual([0, 0]);
    expect([sum(held, 'sectionsMarked'), sum(walked, 'sectionsMarked')]).toEqual([30270, 30266]);
    expect([sum(held, 'marksDiffering'), sum(walked, 'marksDiffering')]).toEqual([0, 0]);
  });
});
