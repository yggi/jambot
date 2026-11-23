import { describe, expect, it } from 'vitest';
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
    expect([sum(walked, 'draws'), sum(walked, 'nearest')]).toEqual([2115, 564]);
    expect(Number(ratio(walked).toFixed(2))).toBe(1.26);
    expect(ratio(walked)).toBeGreaterThanOrEqual(1.2);
    // (held, all its songs made at the preset's point: only the station's boredom tells them apart)
    expect([sum(held, 'draws'), sum(held, 'nearest')]).toEqual([4086, 623]);
    expect(Number(ratio(held).toFixed(2))).toBe(1.07);
  });
});
