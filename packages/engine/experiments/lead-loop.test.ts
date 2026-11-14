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

describe('the lead on the radio’s walk, learning, a player answering (E42, #424)', () => {
  it('plays its run’s most used lead line in under 60 % of the sections that play one, over 40 runs of an hour at entropy 0.3', () => {
    expect(LEARNED).toHaveLength(40);
    const { playing, mostUsed, share } = mostUsedLead(LEARNED);
    // (8,459 and 2,631 before cells v0.24.0, whose meters and motifs are placed at its new styles' points too; 8,408 and
    // 2,622 before 2/4 and 2/2 were among the band's meters, #652, where 250 sections now play 2/4, which lasts half a
    // 4/4, and none plays 2/2; 2,601 before a line heard that is a seed's was that seed, #553; 2,646 before the Muse
    // knew a player's line she had filed when it came again, and the next section played it back, #547 rung 6)
    expect([playing, mostUsed]).toEqual([8533, 1854]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share of sections among a run’s 3 most used lead lines within 5 points, with twice its error (cells decision 048)', () => {
    const { added, error } = lockIn(asLeads(UNLEARNED), asLeads(LEARNED));
    // (with nothing learned the lead plays cells' motif nearest the walk in nearly every section, 99 % among a run's
    // 3 most used: the share can only fall)
    // (−21.41 and 1.82 before cells v0.24.0; −20.61 and 1.86 before v0.25.0; −20.55 and 1.85 before 2/4 and 2/2 were
    // among the band's meters on top of v0.25.0, #652; −21.82 and 1.98 before cells v0.25.1, whose `wail`, `haenschen`
    // and `question` stand apart and off the centre, yggi/cells#674 and #540; −21.44 and 1.97 before a line heard that is
    // a seed's was that seed, #553; −20.73 and 1.95 before a player's line played again came back in the next section,
    // #547 rung 6)
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['-41.92', '1.43']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  it('files the player’s lines, the lead’s own the player answered and the composer’s variations, each reading back as filed', () => {
    expect([by(PLAYER), by(SOLOIST), by(COMPOSER), FILED.filter((f) => f.held).length]).toEqual([
      // (the lead’s own, once: it plays a motif of cells’ in nearly every section, #520; 389, 185 and 1,723 before
      // cells v0.24.0, over its 8,459 sections; 379 and 1,721 before v0.25.0; 380, 181 and 1,720 before 2/4 and 2/2
      // were among the band's meters on top of v0.25.0, #652, over its 8,408; 183 variations before cells v0.25.1's
      // motifs placed apart, yggi/cells#674 and #540; 390, 185 and 1,715 before a line heard that is a seed's was a use of
      // that seed, #553: 48 of the player's lines are a motif's, note for note; 342, 177 and 1,763 before the Muse knew a
      // player's line she had filed when it came again, #547 rung 6: a line played again is no longer filed, held)
      332,
      0, 214, 258,
    ]);
    // (each still in its run's last layer: from cells v0.23.0, whose walk files more grooves, one run's hour reached the
    // layer's cap and dropped one of the lines it filed, until the layer kept its groove variations by reference, #553)
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
    expect(dropped).toBe(0);
  });

  it(`keeps a layer within its cap of ${LAYER_CAP.toLocaleString('en')} bytes over 3 hours with the drums, the bass and the lead filing, the cap dropping the oldest in 65 sections of 5,366`, () => {
    const bytes = Math.max(...LONG.map((r) => layerBytes(r.learning!.layer)));
    expect(bytes).toBeLessThanOrEqual(LAYER_CAP);
    // (15,994, 85 and 5,265 before cells v0.24.0; 15,978, 28 and 5,387 before cells v0.23.0, whose walk files more
    // grooves; 15,991 and 31 before cells v0.21.0, whose bass lines and progressions are filed with their signature,
    // #562; 15,991 before v0.25.0; 15,995 and 94 before 2/4 and 2/2 were among the band's meters on top of v0.25.0,
    // #652, where 120 sections now play 2/4, which lasts half a 4/4; 99 dropped before cells v0.25.1's motifs placed
    // apart, yggi/cells#674 and #540; 15,991 and 102 over 5,346 sections before the layer kept its groove variations by
    // reference and a line heard that is a seed's was that seed, #553; 15,984 and 72 before a player's line played
    // again came back in the next section, #547 rung 6)
    expect([bytes, LONG.reduce((n, r) => n + r.learning!.dropped, 0)]).toEqual([15980, 65]);
    // (5,281 before cells v0.25.0; 5,283 before 2/4 and 2/2 were among the band's meters on top of v0.25.0, #652; 5,345
    // before cells v0.25.1, whose swung sixteenths near Acid's point move the walk's meters, yggi/cells#540; 5,374 before a
    // player's line played again came back in the next section, #547 rung 6)
    expect(LONG.reduce((n, r) => n + r.sections, 0)).toBe(5366);
    expect(leadsFiled(HEAVIEST).length).toBeGreaterThan(0);
  });
});
