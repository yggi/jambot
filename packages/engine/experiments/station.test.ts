import { describe, expect, it } from 'vitest';
import { MIXES_KEPT } from '../src/rotation.ts';
import { type StationRun, stationRuns } from './station.ts';

// The numbers are literals, to be moved by the step that moves them; where step 3 (a worn song rests) moved one, its
// value before stands in the comment beside it, and so where cells v0.30.0 moved one (its jazz song form's solos hotter
// and without the pad, Salsa's song form `son_montuno`, Ambient's 4/4 straight: "v0.30.0" below), and where cells
// v0.31.0 did (Pop, the 24th preset, two runs more each way, and its progressions on Waltz's offer: "v0.31.0" below),
// and where the found parts did (the rhythm, bass, lead and harmony drawn among the fragments on offer, the one playing
// held while it is on offer, the lead's melodic scale, the fills and the endings cells finds at the style, #540, #643,
// #644, #646: "the found parts" below).
/** E47: every preset, seeds 1 and 2, held and walked, 3 hours each at entropy 0.3. */
const RUNS = stationRuns();
const held = RUNS.filter((r) => !r.walked);
const walked = RUNS.filter((r) => r.walked);
const sum = (runs: readonly StationRun[], of: keyof StationRun) =>
  runs.reduce((n, r) => n + (r[of] as number), 0);
const all = (runs: readonly StationRun[], of: 'playsAtRest' | 'restLengths') =>
  runs.flatMap((r) => r[of]).toSorted((a, b) => a - b);

describe('the station, 3 hours a run (E47, #547)', () => {
  it('runs every preset at both seeds, held and walked: 31,576 sections each way, 4,654 and 4,570 songs started', () => {
    // (46 runs and 30,270 sections each way before v0.31.0)
    expect([held.length, walked.length]).toEqual([48, 48]);
    expect([sum(held, 'sections'), sum(walked, 'sections')]).toEqual([31576, 31576]);
    // (4,399 walked before step 3; 4,454 and 4,360 before v0.30.0; 4,490 and 4,412 before v0.31.0)
    expect([sum(held, 'starts'), sum(walked, 'starts')]).toEqual([4654, 4570]);
  });

  it('never plays a song twice in a row', () => {
    expect([sum(held, 'backToBack'), sum(walked, 'backToBack')]).toEqual([0, 0]);
  });

  it('makes 9 to 15 songs at a preset held, its cap at entropy 0.3 and a new one for each that rests; walked, more where the style leaves them behind; the songs on air never past the cap', () => {
    // (exactly 8 held, and 564 walked, before step 3, when no song rested; 9 to 14, 521 and 1,000 before v0.30.0; 524
    // and 983 before v0.31.0; 1,018 walked before the found parts)
    expect([Math.min(...held.map((r) => r.made)), Math.max(...held.map((r) => r.made))]).toEqual([
      9, 15,
    ]);
    expect([sum(held, 'made'), sum(walked, 'made')]).toEqual([545, 1013]);
    expect([sum(held, 'overCap'), sum(walked, 'overCap')]).toEqual([0, 0]);
  });

  it('plays every song’s themes again as it first played them, and starts every later play from its lead line wherever it still reads, or a variation the ladder made of it at once', () => {
    // (27,694 and 26,312 compared, 4,039 and 3,813 lead lines, before step 3; 26,607 and 23,135, 3,896 and 3,312 before
    // v0.30.0; 26,613 and 23,336, 3,929 and 3,377 before v0.31.0; 24,327 and 3,501 walked before the found parts)
    expect([sum(held, 'themesCompared'), sum(walked, 'themesCompared')]).toEqual([27751, 24365]);
    expect([sum(held, 'themesDiffering'), sum(walked, 'themesDiffering')]).toEqual([0, 0]);
    expect([sum(held, 'leadsCompared'), sum(walked, 'leadsCompared')]).toEqual([4072, 3516]);
    expect([sum(held, 'leadsDiffering'), sum(walked, 'leadsDiffering')]).toEqual([0, 0]);
    // (walked, a play of a 7/8 song back from its rest whose filed line no longer reads, so another plays; 6 before
    // v0.30.0, 4 before the found parts)
    expect([sum(held, 'leadsUnread'), sum(walked, 'leadsUnread')]).toEqual([0, 1]);
  });

  it('draws the song that weighs most, by fit and by how little the station has tired of it, about twice as often as a draw at random would (bound 1.2)', () => {
    const ratio = (runs: readonly StationRun[]) => sum(runs, 'nearest') / sum(runs, 'uniform');
    // (1.26 walked, 565 of 2,116, and 1.07 held, 623 of 4,086, before step 3: a station's boredom faded in full between
    // a song's plays, so held its songs all weighed about the same; now it remembers, and the song it tired of least
    // weighs clearly most; 2,999 and 1,206 walked, 2.06, and 3,933 and 1,096 held, 2.14, before v0.30.0; 3,059 and
    // 1,235 walked, 2.08, and 3,966 and 1,116 held, 2.16, before v0.31.0; 3,179 and 1,290 walked, 2.1, before
    // the found parts)
    expect([sum(walked, 'draws'), sum(walked, 'nearest')]).toEqual([3186, 1289]);
    expect(Number(ratio(walked).toFixed(2))).toBe(2.09);
    expect([sum(held, 'draws'), sum(held, 'nearest')]).toEqual([4109, 1157]);
    expect(Number(ratio(held).toFixed(2))).toBe(2.16);
    for (const runs of [held, walked]) expect(ratio(runs)).toBeGreaterThanOrEqual(1.2);
  });

  it('mixes a song played again as often as the entropy says: 1,125 of 4,109 plays held (0.27), 1,038 of 3,557 walked (0.29), at 0.3', () => {
    // (1,127 of 4,086 and 1,117 of 3,835 before step 3; 1,068 of 3,933 and 983 of 3,360 before v0.30.0; 1,095 of 3,966
    // and 1,021 of 3,429 before v0.31.0; 3,552 plays walked before the found parts)
    expect([sum(held, 'replays'), sum(held, 'mixed')]).toEqual([4109, 1125]);
    expect([sum(walked, 'replays'), sum(walked, 'mixed')]).toEqual([3557, 1038]);
    for (const runs of [held, walked])
      expect(Math.abs(sum(runs, 'mixed') / sum(runs, 'replays') - 0.3)).toBeLessThan(0.04);
  });

  it('starts every play of a version kept from its tonic, and from its drum bar and bass line wherever the ladder hasn’t rejected them, or a variation the ladder made of them at once', () => {
    // (3,220 and 3,033 compared, 1,791 and 1,550 rejected, before step 3; 3,029 and 2,427, 1,529 and 1,211, before
    // v0.30.0; 3,054 and 2,460, 1,583 and 1,244, before v0.31.0; 2,567 walked compared, 1,622 and 1,293 rejected,
    // before the found parts)
    expect([sum(held, 'versionsCompared'), sum(walked, 'versionsCompared')]).toEqual([3168, 2572]);
    expect([sum(held, 'versionsDiffering'), sum(walked, 'versionsDiffering')]).toEqual([0, 0]);
    // (where the band learns, the ladder tires of a drum bar or bass line across songs: a held station's songs mostly
    // share the preset's, so at about half the plays it is rejected, and the next nearest plays)
    expect([sum(held, 'versionsRejected'), sum(walked, 'versionsRejected')]).toEqual([1598, 1133]);
  });

  it('makes every new mix differ from its original in what it changes, and keeps at most MIXES_KEPT mixes a song', () => {
    // (866 and 802 before step 3; 904 and 933 before v0.30.0; 912 and 969 before v0.31.0)
    expect([sum(held, 'mixesMade'), sum(walked, 'mixesMade')]).toEqual([941, 985]);
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
    // (290, 252, 211 and 247 held, 239, 236, 234 and 213 walked, 30,266 walked sections marked, before step 3; 299,
    // 237, 228 and 268 held, 283, 266, 276 and 244 walked, 30,216 marked, before v0.30.0; 302, 239, 229 and 268 held,
    // 280, 273, 280 and 273 walked, 30,270 and 30,195 marked, before v0.31.0; 281, 283, 288 and 270 walked before
    // the found parts)
    expect(changed(held)).toEqual({ key: 312, groove: 246, speed: 236, style: 279 });
    expect(changed(walked)).toEqual({ key: 282, groove: 285, speed: 286, style: 270 });
    expect([sum(held, 'speedsOutside'), sum(walked, 'speedsOutside')]).toEqual([0, 0]);
    expect([sum(held, 'sectionsMarked'), sum(walked, 'sectionsMarked')]).toEqual([31576, 31494]);
    expect([sum(held, 'marksDiffering'), sum(walked, 'marksDiffering')]).toEqual([0, 0]);
  });

  it('rests a worn song in every run, after 5 to 22 plays held (8 the median) and 3 to 14 walked (4), for 152 to 221 sections, never starting one resting (step 3)', () => {
    expect([held.every((r) => r.rests > 0), walked.every((r) => r.rests > 0)]).toEqual([
      true,
      true,
    ]);
    // (162 and 482, after 4 to 22 plays held, before v0.30.0; 164 and 475 before v0.31.0; 489 walked before the found parts)
    expect([sum(held, 'rests'), sum(walked, 'rests')]).toEqual([170, 487]);
    const span = (xs: readonly number[]) => [xs[0], xs[Math.floor((xs.length - 1) / 2)], xs.at(-1)];
    expect(span(all(held, 'playsAtRest'))).toEqual([5, 8, 22]);
    expect(span(all(walked, 'playsAtRest'))).toEqual([3, 4, 14]);
    // (back on air once its boredom has faded to none; those still resting at a run's end have no length; 104 and 263,
    // 161, 183 and 213 held, 160, 175 and 222 walked, before v0.30.0; 104 and 265, and 160, 177 and 221 walked, before
    // v0.31.0; 273 walked before the found parts)
    expect([sum(held, 'returns'), sum(walked, 'returns')]).toEqual([108, 274]);
    expect(span(all(held, 'restLengths'))).toEqual([161, 176, 213]);
    expect(span(all(walked, 'restLengths'))).toEqual([152, 177, 221]);
    expect([sum(held, 'restingStarts'), sum(walked, 'restingStarts')]).toEqual([0, 0]);
  });

  it('brings a rested song back where it fits: walked, 52 come back where the radio has left them and leave at once as the songs on air are trimmed; held, none', () => {
    // (62 before v0.30.0; 49 before v0.31.0; 53 before the found parts)
    expect([sum(held, 'leftOnReturn'), sum(walked, 'leftOnReturn')]).toEqual([0, 52]);
  });
});
