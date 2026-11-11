import { stepsOf } from '@jambot/theory';
import { beforeAll, describe, expect, it } from 'vitest';
import { DRUMMER } from '../src/band.ts';
import { EMPTY_LAYER, LAYER_CAP, layerBytes } from '../src/layer.ts';
import { GROOVE_FEWEST, grooveText } from '../src/muse-groove.ts';
import { instrumentsFor } from '../src/instruments.ts';
import { GROOVE_KEEP, familyOf } from '../src/novelty.ts';
import { RHYTHM_FRAGMENTS } from '../src/library.ts';
import { variations } from '@yggi/cells/engine/vary/index';
import { COMPOSER } from '../src/facet.ts';
import { benchText, grooveLines, readRhythm, rhythmRepository } from '../src/rhythms.ts';
import {
  type Filing,
  LEARNING_HOURS,
  type RhythmRun,
  aloneByPreset,
  learningRuns,
  lockIn,
  mostUsedGroove,
  rhythmRuns,
} from './rhythm-radio.ts';

// E38 (#401) and E39 (#411, #414): E37's walks, 3 hours a run, the band learning, the Muse filing the drummer's
// grooves, and the composer varying and rejecting them and the seed rhythms it plays.
// Played before the tests rather than as the file is imported, so the time is the file's, and run first (the
// engine's `hookTimeout`).
let LEARNED: RhythmRun[] = [];
let UNLEARNED: RhythmRun[] = [];
let FILINGS: Filing[] = [];
const count = (runs: typeof LEARNED, f: (r: (typeof LEARNED)[number]) => number) =>
  runs.reduce((n, r) => n + f(r), 0);
const misses = (r: (typeof LEARNED)[number]) => r.kept.filter((id) => id === '-').length;
const bySource = (source: string) => FILINGS.filter((f) => f.filing.source === source).length;
beforeAll(() => {
  LEARNED = learningRuns();
  UNLEARNED = rhythmRuns(undefined, LEARNING_HOURS);
  FILINGS = LEARNED.flatMap((r) => r.learning!.filings);
  if (process.env.E37_REPORT)
    console.log({
      sections: [count(LEARNED, (r) => r.sections), count(UNLEARNED, (r) => r.sections)],
      misses: [count(LEARNED, misses), count(UNLEARNED, misses)],
      filed: FILINGS.length,
      bySource: [bySource(DRUMMER), bySource(COMPOSER)],
      held: FILINGS.filter((f) => f.held).length,
      playedFiled: count(LEARNED, (r) => r.learning!.playedFiled),
      bytes: Math.max(...LEARNED.map((r) => layerBytes(r.learning!.layer))),
      lockIn: lockIn(UNLEARNED, LEARNED),
      mostUsed: mostUsedGroove(LEARNED),
      alone: [aloneByPreset(LEARNED), aloneByPreset(UNLEARNED)],
    });
});

describe('the Muse files the drummer’s grooves while the radio walks (E38, #401)', () => {
  // (since #651, whose Salsa drums the drummer holds near Salsa's point: 242 grooves, 35 and 207, the misses 1,679 to 35,
  // 12,804 sections a groove filed, before; since cells v0.24.0, whose seven new drum bars the drummer holds lie along
  // the walk: 249 grooves, 46 and 203, the misses 2,455 to 46, over 26,604 sections, 14,109 of them a groove filed, before)
  it('files 235 grooves in 120 hours, 33 the drummer’s on a miss and 202 the composer’s variations (#411, #414), and the misses fall from 1,679 sections to 33: what was filed is found again', () => {
    expect(LEARNED).toHaveLength(40);
    expect(count(LEARNED, (r) => r.sections)).toBe(26501);
    expect([count(LEARNED, misses), count(UNLEARNED, misses)]).toEqual([33, 1679]);
    expect(FILINGS.length).toBe(235);
    expect([bySource(DRUMMER), bySource(COMPOSER)]).toEqual([33, 202]);
    expect(LEARNED.filter((r) => r.learning!.filings.length).length).toBe(40);
    expect(count(LEARNED, (r) => r.learning!.playedFiled)).toBe(12145);
  });

  it('reads every groove filed back from cells as it was played or varied, and finds each at its point, at distance 0, from a repository that never saw it', () => {
    const fresh = rhythmRepository();
    for (const { filing, id } of FILINGS) {
      const text = grooveText(filing.hits, stepsOf(filing.bench.meter));
      expect(readRhythm(text, filing.bench.meter)!.hits, id).toEqual(
        [...filing.hits].sort((a, b) => a.step - b.step || a.note - b.note),
      );
      const { layer } = rhythmRepository().file!(EMPTY_LAYER, filing);
      expect(fresh.query(filing.point, filing.bench, layer)[0], id).toEqual({ id, distance: 0 });
    }
  });

  it('adds each groove filed again to the one fragment it is (identity): none filed twice in any run', () => {
    expect(FILINGS.filter((f) => f.held)).toEqual([]);
    for (const run of LEARNED) {
      const { layer, filings } = run.learning!;
      for (const { filing, id } of filings) {
        const again = rhythmRepository().file!(layer, {
          ...filing,
          created: `${filing.created}, again`,
        });
        expect([again.held, again.id, again.layer.filed.length], id).toEqual([
          true,
          id,
          layer.filed.length,
        ]);
      }
    }
  });

  it('moves the share of sections among a run’s 3 most used rhythms by −17.5 points, within 5 with twice its error (cells decision 048)', () => {
    expect(LEARNED.map((r) => [r.preset, r.seed])).toEqual(
      UNLEARNED.map((r) => [r.preset, r.seed]),
    );
    const { before, after, added, error } = lockIn(UNLEARNED, LEARNED);
    // (0.8383 to 0.6656, −17.28 (1.80), before #651 held Salsa drums; 0.8738 to 0.6987, −17.51 (1.95), before cells
    // v0.24.0)
    expect([before.toFixed(4), after.toFixed(4)]).toEqual(['0.8345', '0.6592']);
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['-17.53', '1.95']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  // (15,114 bytes and 12 grooves before #651 held Salsa drums; 15,938 bytes and 15 grooves before cells v0.24.0)
  it(`keeps a layer of at most 15,147 bytes after 3 hours, under its cap of ${LAYER_CAP.toLocaleString('en')}: nothing dropped (each variation naming its operator, by, #442)`, () => {
    const bytes = LEARNED.map((r) => layerBytes(r.learning!.layer));
    expect(Math.max(...bytes)).toBe(15147);
    expect(Math.max(...LEARNED.map((r) => r.learning!.layer.filed.length))).toBe(11);
    // every groove its run filed is still there
    for (const run of LEARNED)
      expect(run.learning!.layer.filed.map((f) => f.fragment.id)).toEqual(
        run.learning!.filings.map((f) => f.id),
      );
  });
});

describe('the composer tires of a groove while the radio walks (E39, #411, #414)', () => {
  // (no meter the walk reaches is one no seed rhythm fits since cells v0.15.0: Ghost drums fits 7/8, the last, yggi/cells#409;
  // at v0.14.0 the most used groove there played 147 of 274 sections, 54 %, under 60 %. What E39 measures has to be asked
  // anew, of the grooves the drummer files beside a seed: the owner's, on this pull request)
  it('finds no meter no seed rhythm fits: every section the walk plays has a seed beside the grooves it files', () => {
    const { sections, mostUsed } = mostUsedGroove(LEARNED);
    expect([sections, mostUsed]).toEqual([0, 0]);
    expect(LEARNED.every((r) => r.seedless.length === 0)).toBe(true);
    // with nothing learned no groove is filed: those sections are the drummer's own
    expect(mostUsedGroove(UNLEARNED).mostUsed).toBe(0);
  });

  it('makes each variation of a seed rhythm or of a groove its run filed before, by one of cells’ operators on its text, named in its filing (`by`), and varies no family twice', () => {
    const seeds = new Set(RHYTHM_FRAGMENTS.map((f) => f.id));
    for (const run of LEARNED) {
      const { filings, layer } = run.learning!;
      const varied = filings.filter((f) => f.filing.source === COMPOSER);
      for (const { filing, id } of varied) {
        const { varies, bench } = filing;
        const parent = filings.findIndex((f) => f.id === varies);
        if (!seeds.has(varies!)) {
          expect(parent, id).toBeGreaterThanOrEqual(0);
          expect(parent, id).toBeLessThan(filings.findIndex((f) => f.id === id));
        }
        // (a seed by its lines, as the repository varies it, #634)
        const seed = RHYTHM_FRAGMENTS.find((f) => f.id === varies);
        const text = seed
          ? grooveLines(seed.text)
          : layer.filed.find((f) => f.fragment.id === varies)!.fragment.text;
        const named = variations(text, {
          // (the bench and the instruments the rhythm strikes, as the repository varies it)
          workbench: [benchText(bench)!, ...instrumentsFor(text)].join('\n'),
          keep: GROOVE_KEEP,
          fewest: GROOVE_FEWEST,
        }).find((v) => v.by === filing.by);
        expect(named, id).toBeDefined();
        // (a hit as played: its role, without the line it was read from, #508)
        const hits = readRhythm(named!.apply(text), bench.meter)!.hits.map(
          ({ role, note, step, velocity }) => ({ role, note, step, velocity }),
        );
        expect(hits, id).toEqual(
          [...filing.hits].sort((a, b) => a.step - b.step || a.note - b.note),
        );
      }
      const roots = varied.map((f) => familyOf(layer, f.id)[0]);
      expect(new Set(roots).size, `${run.preset} ${run.seed}`).toBe(roots.length);
    }
  });

  // (19 before cells v0.24.0, whose new drum bars leave the drummer fewer misses)
  it('has the drummer invent again where the composer rejected every groove a meter holds: 12 grooves beyond the first of their meter', () => {
    const again = LEARNED.flatMap((run) => {
      const firsts = new Set<string>();
      return run.learning!.filings.filter((f) => {
        if (f.filing.source !== DRUMMER) return false;
        const meter = f.filing.bench.meterFragment ?? '-';
        const first = !firsts.has(meter);
        firsts.add(meter);
        return !first;
      });
    });
    expect(again).toHaveLength(12);
  });
});
