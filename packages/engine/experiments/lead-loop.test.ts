import { beforeAll, describe, expect, it } from 'vitest';
import { BASS_REPOSITORY } from '../src/bass-lines.ts';
import { COMPOSER } from '../src/facet.ts';
import { EMPTY_LAYER, LAYER_CAP, type LearnedLayer, layerBytes } from '../src/layer.ts';
import { readLead } from '../src/lead-lines.ts';
import { SOLOIST } from '../src/muse-lead.ts';
import { PLAYS, asLeads, cost, leadsFiled, mostUsedLead } from './lead-loop.ts';
import { recording } from './recorded.ts';
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
          unlearned: mostUsedLead(UNLEARNED),
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

// What the runs measured is recorded beside this file (`lead-loop.recorded.json`, `pnpm record`); what E42 must hold
// whatever the numbers, a bound or a count, is asserted here.
const record = recording(import.meta.url);

describe('the lead on the radio’s walk, learning, a player answering (E42, #424)', () => {
  it('plays its run’s most used lead line in under 60 % of the sections that play one, over 40 runs of an hour at entropy 0.3', () => {
    expect(LEARNED).toHaveLength(40);
    const { playing, mostUsed, share } = mostUsedLead(LEARNED);
    record('sections that play a lead line, and those that play their run’s most used', [
      playing,
      mostUsed,
    ]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share of sections among a run’s 3 most used lead lines within 5 points, with twice its error (cells decision 048)', () => {
    const { added, error } = lockIn(asLeads(UNLEARNED), asLeads(LEARNED));
    // (with nothing learned the lead plays cells' motif nearest the walk in nearly every section, 99 % among a run's
    // 3 most used: the share can only fall)
    record('points added to the share among a run’s 3 most used lead lines, and their error', [
      added.toFixed(2),
      error.toFixed(2),
    ]);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  it('files the player’s lines, the lead’s own the player answered and the composer’s variations, each reading back as filed', () => {
    // (the lead’s own, once: it plays a motif of cells’ in nearly every section, #520; a line the player plays that
    // is a seed's, note for note, is a use of that seed and not a filing, #553)
    record('lines filed by the player, by the lead, by the composer, and held', [
      by(PLAYER),
      by(SOLOIST),
      by(COMPOSER),
      FILED.filter((f) => f.held).length,
    ]);
    // (each still in its run's last layer, unless an hour reached the layer's cap and dropped it)
    let dropped = 0;
    for (const { filing, id } of FILED.filter((f) => !f.held)) {
      const layer = LEARNED.find((r) => r.leadFilings.some((f) => f.id === id))!.learning!.layer;
      const file = layer.filed.find((f) => f.fragment.id === id);
      if (!file) {
        dropped++;
        continue;
      }
      expect(readLead(file.fragment.text, filing.bench.meter)!.notes, id).toEqual(
        [...filing.notes].sort((a, b) => a.step - b.step),
      );
    }
    record('lines filed that an hour’s cap dropped', dropped);
  });

  it(`keeps a layer within its cap of ${LAYER_CAP.toLocaleString('en')} bytes over 3 hours with the drums, the bass and the lead filing, the cap dropping the oldest`, () => {
    const bytes = Math.max(...LONG.map((r) => layerBytes(r.learning!.layer)));
    expect(bytes).toBeLessThanOrEqual(LAYER_CAP);
    record(
      'the heaviest layer’s bytes over 3 hours, and the sections whose filing dropped the oldest',
      [bytes, LONG.reduce((n, r) => n + r.learning!.dropped, 0)],
    );
    record(
      'sections over the 3 hours',
      LONG.reduce((n, r) => n + r.sections, 0),
    );
    expect(leadsFiled(HEAVIEST).length).toBeGreaterThan(0);
  });
});
