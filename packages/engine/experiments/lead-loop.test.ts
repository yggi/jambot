import { beforeAll, describe, expect, it } from 'vitest';
import { BASS_REPOSITORY } from '../src/bass-lines.ts';
import { COMPOSER } from '../src/facet.ts';
import { EMPTY_LAYER, LAYER_CAP, type LearnedLayer, layerBytes } from '../src/layer.ts';
import { readLead } from '../src/lead-lines.ts';
import { SOLOIST } from '../src/muse-lead.ts';
import { PLAYS, asLeads, cost, leadsFiled, mostUsedLead } from './lead-loop.ts';
import { LEARNING_HOURS, PLAYER, type RhythmRun, lockIn, rhythmRuns } from './rhythm-radio.ts';

// E42 (#424): the lead in the loop on E37's walks at entropy 0.3, a player answering one section in four.
// Played before the tests rather than as the file is imported, so the time is the file's, and run first (the
// engine's `hookTimeout`).
let LEARNED: RhythmRun[] = [];
let UNLEARNED: RhythmRun[] = [];
let LONG: RhythmRun[] = [];
let FILED: RhythmRun['leadFilings'][number][] = [];
let HEAVIEST: LearnedLayer = EMPTY_LAYER;
const by = (source: string) => FILED.filter((f) => f.filing.source === source && !f.held).length;

beforeAll(() => {
  LEARNED = rhythmRuns(undefined, 1, undefined, EMPTY_LAYER, BASS_REPOSITORY, PLAYS);
  UNLEARNED = rhythmRuns(undefined, 1, undefined, undefined, BASS_REPOSITORY, PLAYS);
  // (the three hours over one seed a preset, 8 runs: forty take five minutes)
  LONG = rhythmRuns(1, LEARNING_HOURS, undefined, EMPTY_LAYER, BASS_REPOSITORY, PLAYS);
  FILED = LEARNED.flatMap((r) => r.leadFilings);
  HEAVIEST = LONG.map((r) => r.learning!.layer).reduce((a, b) =>
    layerBytes(b) > layerBytes(a) ? b : a,
  );
  if (process.env.E42_REPORT)
    console.log(
      JSON.stringify(
        {
          mostUsed: mostUsedLead(LEARNED),
          lockIn: lockIn(asLeads(UNLEARNED), asLeads(LEARNED)),
          filed: [
            FILED.length,
            by(PLAYER),
            by(SOLOIST),
            by(COMPOSER),
            FILED.filter((f) => f.held).length,
          ],
          bytes: Math.max(...LONG.map((r) => layerBytes(r.learning!.layer))),
          dropped: LONG.reduce((n, r) => n + r.learning!.dropped, 0),
          longLeads: mostUsedLead(LONG),
          cost: cost(HEAVIEST),
        },
        null,
        1,
      ),
    );
});

describe('the lead on the radio’s walk, learning, a player answering (E42, #424)', () => {
  it('plays its run’s most used lead line in under 60 % of the sections that play one, over 40 runs of an hour at entropy 0.3', () => {
    expect(LEARNED).toHaveLength(40);
    const { playing, mostUsed, share } = mostUsedLead(LEARNED);
    expect([playing, mostUsed]).toEqual([8413, 3021]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share of sections among a run’s 3 most used lead lines within 5 points, with twice its error (cells decision 048)', () => {
    const { added, error } = lockIn(asLeads(UNLEARNED), asLeads(LEARNED));
    // (with nothing learned the lead plays its own every section, which counts as one: the share can only fall)
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['-20.39', '1.81']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  it('files the player’s lines, the lead’s own the player answered and the composer’s variations, each reading back as filed', () => {
    expect([by(PLAYER), by(SOLOIST), by(COMPOSER), FILED.filter((f) => f.held).length]).toEqual([
      332, 38, 160, 1792,
    ]);
    for (const { filing, id } of FILED.filter((f) => !f.held)) {
      const layer = LEARNED.find((r) => r.leadFilings.some((f) => f.id === id))!.learning!.layer;
      const text = layer.filed.find((f) => f.fragment.id === id)!.fragment.text;
      expect(readLead(text, filing.bench.meter)!.notes, id).toEqual(
        [...filing.notes].sort((a, b) => a.step - b.step),
      );
    }
  });

  it(`keeps a layer under its cap of ${LAYER_CAP.toLocaleString('en')} bytes over 3 hours with the drums, the bass and the lead filing, the cap dropping the oldest in 20 sections of 5,252`, () => {
    const bytes = Math.max(...LONG.map((r) => layerBytes(r.learning!.layer)));
    expect(bytes).toBeLessThan(LAYER_CAP);
    expect([bytes, LONG.reduce((n, r) => n + r.learning!.dropped, 0)]).toEqual([15996, 20]);
    expect(LONG.reduce((n, r) => n + r.sections, 0)).toBe(5252);
    expect(leadsFiled(HEAVIEST).length).toBeGreaterThan(0);
  });
});
