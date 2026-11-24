import { describe, expect, it } from 'vitest';
import { MIXES_KEPT } from '../src/rotation.ts';
import { type StationRun, stationRuns } from './station.ts';

// The numbers are literals, to be moved by the step that moves them; where step 3 (a worn song rests) moved one, its
// value before stands in the comment beside it.
/** E47: every preset, seeds 1 and 2, held and walked, 3 hours each at entropy 0.3. */
const RUNS = stationRuns();
const held = RUNS.filter((r) => !r.walked);
const walked = RUNS.filter((r) => r.walked);
const sum = (runs: readonly StationRun[], of: keyof StationRun) =>
  runs.reduce((n, r) => n + (r[of] as number), 0);
const all = (runs: readonly StationRun[], of: 'playsAtRest' | 'restLengths') =>
  runs.flatMap((r) => r[of]).toSorted((a, b) => a - b);

describe('the station, 3 hours a run (E47, #547)', () => {
  it('runs every preset at both seeds, held and walked: 30,270 sections each way, 4,454 and 4,360 songs started', () => {
    expect([held.length, walked.length]).toEqual([46, 46]);
    expect([sum(held, 'sections'), sum(walked, 'sections')]).toEqual([30270, 30270]);
    // (4,399 walked before step 3)
    expect([sum(held, 'starts'), sum(walked, 'starts')]).toEqual([4454, 4360]);
  });

  it('never plays a song twice in a row', () => {
    expect([sum(held, 'backToBack'), sum(walked, 'backToBack')]).toEqual([0, 0]);
  });

  it('makes 9 to 14 songs at a preset held, its cap at entropy 0.3 and a new one for each that rests; walked, more where the style leaves them behind; the songs on air never past the cap', () => {
    // (exactly 8 held, and 564 walked, before step 3, when no song rested)
    expect([Math.min(...held.map((r) => r.made)), Math.max(...held.map((r) => r.made))]).toEqual([
      9, 14,
    ]);
    expect([sum(held, 'made'), sum(walked, 'made')]).toEqual([521, 1000]);
    expect([sum(held, 'overCap'), sum(walked, 'overCap')]).toEqual([0, 0]);
  });

  it('plays every song’s themes again as it first played them, and starts every later play from its lead line wherever it still reads, or a variation the ladder made of it at once', () => {
    // (27,694 and 26,312 compared, 4,039 and 3,813 lead lines, before step 3)
    expect([sum(held, 'themesCompared'), sum(walked, 'themesCompared')]).toEqual([26607, 23135]);
    expect([sum(held, 'themesDiffering'), sum(walked, 'themesDiffering')]).toEqual([0, 0]);
    expect([sum(held, 'leadsCompared'), sum(walked, 'leadsCompared')]).toEqual([3896, 3312]);
    expect([sum(held, 'leadsDiffering'), sum(walked, 'leadsDiffering')]).toEqual([0, 0]);
    // (walked, 6 plays of a 7/8 song back from its rest whose filed line no longer reads, so another plays)
    expect([sum(held, 'leadsUnread'), sum(walked, 'leadsUnread')]).toEqual([0, 6]);
  });

  it('draws the song that weighs most, by fit and by how little the station has tired of it, about twice as often as a draw at random would (bound 1.2)', () => {
    const ratio = (runs: readonly StationRun[]) => sum(runs, 'nearest') / sum(runs, 'uniform');
    // (1.26 walked, 565 of 2,116, and 1.07 held, 623 of 4,086, before step 3: a station's boredom faded in full between
    // a song's plays, so held its songs all weighed about the same; now it remembers, and the song it tired of least
    // weighs clearly most)
    expect([sum(walked, 'draws'), sum(walked, 'nearest')]).toEqual([2999, 1206]);
    expect(Number(ratio(walked).toFixed(2))).toBe(2.06);
    expect([sum(held, 'draws'), sum(held, 'nearest')]).toEqual([3933, 1096]);
    expect(Number(ratio(held).toFixed(2))).toBe(2.14);
    for (const runs of [held, walked]) expect(ratio(runs)).toBeGreaterThanOrEqual(1.2);
  });

  it('mixes a song played again as often as the entropy says: 1,068 of 3,933 plays held (0.27), 983 of 3,360 walked (0.29), at 0.3', () => {
    // (1,127 of 4,086 and 1,117 of 3,835 before step 3)
    expect([sum(held, 'replays'), sum(held, 'mixed')]).toEqual([3933, 1068]);
    expect([sum(walked, 'replays'), sum(walked, 'mixed')]).toEqual([3360, 983]);
    for (const runs of [held, walked])
      expect(Math.abs(sum(runs, 'mixed') / sum(runs, 'replays') - 0.3)).toBeLessThan(0.04);
  });

  it('starts every play of a version kept from its tonic, and from its drum bar and bass line wherever the ladder hasn’t rejected them, or a variation the ladder made of them at once', () => {
    // (3,220 and 3,033 compared, 1,791 and 1,550 rejected, before step 3)
    expect([sum(held, 'versionsCompared'), sum(walked, 'versionsCompared')]).toEqual([3029, 2427]);
    expect([sum(held, 'versionsDiffering'), sum(walked, 'versionsDiffering')]).toEqual([0, 0]);
    // (where the band learns, the ladder tires of a drum bar or bass line across songs: a held station's songs mostly
    // share the preset's, so at about half the plays it is rejected, and the next nearest plays)
    expect([sum(held, 'versionsRejected'), sum(walked, 'versionsRejected')]).toEqual([1529, 1211]);
  });

  it('makes every new mix differ from its original in what it changes, and keeps at most MIXES_KEPT mixes a song', () => {
    // (866 and 802 before step 3)
    expect([sum(held, 'mixesMade'), sum(walked, 'mixesMade')]).toEqual([904, 933]);
    expect([sum(held, 'mixesSame'), sum(walked, 'mixesSame')]).toEqual([0, 0]);
    expect(Math.max(...RUNS.map((r) => r.mostMixes))).toBe(MIXES_KEPT);
  });

  it('makes mixes of all four kinds, each a quarter or so; keeps every speed mix within ±3 % to ±8 % of its original; and marks every section of a play with its version’s tempo and style shift (step 2b)', () => {
    const changed = (runs: readonly StationRun[]) => {
      const kinds: Record<string, number> = {};
      for (const r of runs)
        for (const [kind, n] of Object.entries(r.changed))
          kinds[kind] = (kinds[kind] ?? 0) + (n ?? 0);
      return kinds;
    };
    // (290, 252, 211 and 247 held, 239, 236, 234 and 213 walked, 30,266 walked sections marked, before step 3)
    expect(changed(held)).toEqual({ key: 299, groove: 237, speed: 228, style: 268 });
    expect(changed(walked)).toEqual({ key: 283, groove: 266, speed: 276, style: 244 });
    expect([sum(held, 'speedsOutside'), sum(walked, 'speedsOutside')]).toEqual([0, 0]);
    expect([sum(held, 'sectionsMarked'), sum(walked, 'sectionsMarked')]).toEqual([30270, 30216]);
    expect([sum(held, 'marksDiffering'), sum(walked, 'marksDiffering')]).toEqual([0, 0]);
  });

  it('rests a worn song in every run, after 4 to 22 plays held (8 the median) and 3 to 14 walked (4), for 160 to 222 sections, never starting one resting (step 3)', () => {
    expect([held.every((r) => r.rests > 0), walked.every((r) => r.rests > 0)]).toEqual([
      true,
      true,
    ]);
    expect([sum(held, 'rests'), sum(walked, 'rests')]).toEqual([162, 482]);
    const span = (xs: readonly number[]) => [xs[0], xs[Math.floor((xs.length - 1) / 2)], xs.at(-1)];
    expect(span(all(held, 'playsAtRest'))).toEqual([4, 8, 22]);
    expect(span(all(walked, 'playsAtRest'))).toEqual([3, 4, 14]);
    // (back on air once its boredom has faded to none; those still resting at a run's end have no length)
    expect([sum(held, 'returns'), sum(walked, 'returns')]).toEqual([104, 263]);
    expect(span(all(held, 'restLengths'))).toEqual([161, 183, 213]);
    expect(span(all(walked, 'restLengths'))).toEqual([160, 175, 222]);
    expect([sum(held, 'restingStarts'), sum(walked, 'restingStarts')]).toEqual([0, 0]);
  });

  it('brings a rested song back where it fits: walked, 62 come back where the radio has left them and leave at once as the songs on air are trimmed; held, none', () => {
    expect([sum(held, 'leftOnReturn'), sum(walked, 'leftOnReturn')]).toEqual([0, 62]);
  });
});
