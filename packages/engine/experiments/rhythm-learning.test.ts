import { stepsOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { EMPTY_LAYER, LAYER_CAP, layerBytes } from '../src/layer.ts';
import { grooveText } from '../src/muse-groove.ts';
import { readRhythm, rhythmRepository } from '../src/rhythms.ts';
import { LEARNING_HOURS, learningRuns, lockIn, rhythmRuns } from './rhythm-radio.ts';

// E38 (#401): E37's walks, 3 hours a run, the band learning and the Muse filing the drummer's grooves.
const LEARNED = learningRuns();
const UNLEARNED = rhythmRuns(undefined, LEARNING_HOURS);
const FILINGS = LEARNED.flatMap((r) => r.learning!.filings);
const count = (runs: typeof LEARNED, f: (r: (typeof LEARNED)[number]) => number) =>
  runs.reduce((n, r) => n + f(r), 0);
const misses = (r: (typeof LEARNED)[number]) => r.kept.filter((id) => id === '-').length;
if (process.env.E37_REPORT)
  console.log({
    sections: [count(LEARNED, (r) => r.sections), count(UNLEARNED, (r) => r.sections)],
    misses: [count(LEARNED, misses), count(UNLEARNED, misses)],
    filed: FILINGS.length,
    held: FILINGS.filter((f) => f.held).length,
    playedFiled: count(LEARNED, (r) => r.learning!.playedFiled),
    bytes: Math.max(...LEARNED.map((r) => layerBytes(r.learning!.layer))),
    lockIn: lockIn(UNLEARNED, LEARNED),
  });

describe('the Muse files the drummer’s grooves while the radio walks (E38, #401)', () => {
  it('files 20 grooves in 120 hours, each on a miss, and the misses fall from 3,945 sections to 24: what was filed is found again', () => {
    expect(LEARNED).toHaveLength(40);
    expect(count(LEARNED, (r) => r.sections)).toBe(26631);
    expect([count(LEARNED, misses), count(UNLEARNED, misses)]).toEqual([24, 3945]);
    expect(FILINGS.length).toBe(20);
    expect(new Set(FILINGS.map((f) => f.filing.source))).toEqual(new Set(['drummer']));
    expect(count(LEARNED, (r) => r.learning!.playedFiled)).toBe(3349);
  });

  it('reads every groove filed back from cells as the drummer played it, and finds each at its point, at distance 0, from a repository that never saw it', () => {
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
    // the runs file none twice on their own (a groove filed is found again before the drummer invents in its meter again)
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

  it('adds 2.1 points to the share of sections among a run’s 3 most used rhythms, within 5 with twice its error (cells decision 048)', () => {
    expect(LEARNED.map((r) => [r.preset, r.seed])).toEqual(
      UNLEARNED.map((r) => [r.preset, r.seed]),
    );
    const { before, after, added, error } = lockIn(UNLEARNED, LEARNED);
    expect([before.toFixed(4), after.toFixed(4)]).toEqual(['0.9420', '0.9626']);
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['2.06', '0.90']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  it(`keeps a layer of at most 2,943 bytes after 3 hours, under its cap of ${LAYER_CAP.toLocaleString('en')}`, () => {
    const bytes = LEARNED.map((r) => layerBytes(r.learning!.layer));
    expect(Math.max(...bytes)).toBe(2943);
    expect(Math.max(...LEARNED.map((r) => r.learning!.layer.filed.length))).toBe(2);
  });
});
