import { beforeAll, describe, expect, it } from 'vitest';
import { BASS_REPOSITORY, LINE_BENCHES, lineRepository, readLine } from '../src/bass-lines.ts';
import { COMPOSER } from '../src/facet.ts';
import { EMPTY_LAYER, LAYER_CAP, layerBytes } from '../src/layer.ts';
import { BASSIST } from '../src/muse-line.ts';
import { PRESETS } from '../src/style.ts';
import { asLines, heldRuns, kept, linesFiled, mostUsedLine, movement } from './bass-loop.ts';
import {
  LEARNING_HOURS,
  type RhythmRun,
  lockIn,
  mostUsedGroove,
  rhythmRuns,
} from './rhythm-radio.ts';

// E41 (#423): the bass in the loop, held at each preset at entropy 0, and on E38's walks at entropy 0.3.
// Played before the tests rather than as the file is imported, so the time is the file's, and run first (the
// engine's `hookTimeout`).
let HELD: ReturnType<typeof heldRuns> = [];
let LEARNED: RhythmRun[] = [];
let UNLEARNED: RhythmRun[] = [];
let LONG: RhythmRun[] = [];
let FILED: RhythmRun['lineFilings'][number][] = [];

/** The ask's and the warm-up's cost on this machine: each section's bass query, warmed, and each warm step, in ms. */
function cost() {
  const now = () => performance.now();
  const repository = lineRepository();
  const steps: number[] = [];
  const it = repository.warm!(LINE_BENCHES)[Symbol.iterator]();
  for (let at = now(); !it.next().done; at = now()) steps.push(now() - at);
  const asks: number[] = [];
  for (const preset of PRESETS)
    for (const bench of LINE_BENCHES)
      for (let k = 0; k < 4; k++) {
        const at = now();
        repository.query({ ...preset.style, sync: preset.style.sync + k / 100 }, bench);
        asks.push(now() - at);
      }
  const sorted = (xs: number[]) => xs.toSorted((a, b) => a - b);
  return {
    steps: steps.length,
    longestStep: Math.max(...steps),
    askP95: sorted(asks)[Math.floor(asks.length * 0.95)]!,
    longestAsk: Math.max(...asks),
  };
}

beforeAll(() => {
  HELD = heldRuns(0);
  LEARNED = rhythmRuns(undefined, 1, undefined, EMPTY_LAYER, BASS_REPOSITORY);
  UNLEARNED = rhythmRuns(undefined, 1, undefined, undefined, BASS_REPOSITORY);
  LONG = rhythmRuns(undefined, LEARNING_HOURS, undefined, EMPTY_LAYER, BASS_REPOSITORY);
  FILED = LEARNED.flatMap((r) => r.lineFilings);
  if (process.env.E41_REPORT)
    console.log(
      JSON.stringify(
        {
          movement: movement(HELD),
          kept: kept(HELD),
          lines: PRESETS.map((p) => [
            p.name,
            HELD.find((r) => r.main.preset === p.name)!.loop.lines[0],
          ]),
          mostUsed: mostUsedLine(LEARNED),
          lockIn: lockIn(asLines(UNLEARNED), asLines(LEARNED)),
          filed: [
            FILED.length,
            FILED.filter((f) => f.filing.source === BASSIST).length,
            FILED.filter((f) => f.filing.source === COMPOSER).length,
          ],
          misses: [
            LEARNED.reduce((n, r) => n + r.lines.filter((id) => id === '-').length, 0),
            UNLEARNED.reduce((n, r) => n + r.lines.filter((id) => id === '-').length, 0),
          ],
          bytes: Math.max(...LONG.map((r) => layerBytes(r.learning!.layer))),
          dropped: LONG.reduce((n, r) => n + r.learning!.dropped, 0),
          groove: mostUsedGroove(LONG),
          cost: cost(),
        },
        null,
        1,
      ),
    );
});

describe('the bass held at each preset, at entropy 0 (E41, #423)', () => {
  it('plays each preset’s seed line every section, and every drum note main plays', () => {
    expect(HELD).toHaveLength(16);
    for (const { main, loop } of HELD) {
      expect(new Set(loop.lines).size, loop.preset).toBe(1);
      expect(loop.drums, loop.preset).toEqual(main.drums);
    }
  });

  it('moves the bass where it falls and what it plays, as many notes a bar: the share of its notes on a step main’s plays, and of the same note there', () => {
    const moved = movement(HELD);
    for (const preset of PRESETS)
      for (const [type, m] of Object.entries(moved[preset.name]!))
        expect(m.after, `${preset.name} ${type}`).toBe(m.before);
    expect(kept(HELD)).toEqual({
      'Synth-pop': { onsets: 0.794, notes: 0.775 },
      Techno: { onsets: 0.812, notes: 0.625 },
      'Deep house': { onsets: 0.809, notes: 0.787 },
      Ambient: { onsets: 0.876, notes: 0.876 },
      'Lo-fi hip hop': { onsets: 0.575, notes: 0.565 },
      Funk: { onsets: 0.68, notes: 0.567 },
      'Bossa nova': { onsets: 0.595, notes: 0.507 },
      'Swing jazz': { onsets: 1, notes: 0.293 },
    });
  });
});

describe('the bass on the radio’s walk, learning (E41, #423)', () => {
  it('plays its run’s most used line in under 60 % of a run’s sections, over 40 runs of an hour at entropy 0.3', () => {
    expect(LEARNED).toHaveLength(40);
    const { sections, mostUsed, share } = mostUsedLine(LEARNED);
    expect([sections, mostUsed]).toEqual([8508, 4028]);
    expect(share).toBeLessThan(0.6);
  });

  it('moves the share of sections among a run’s 3 most used lines within 5 points, with twice its error (cells decision 048)', () => {
    const { added, error } = lockIn(asLines(UNLEARNED), asLines(LEARNED));
    expect([added.toFixed(2), error.toFixed(2)]).toEqual(['-4.35', '1.00']);
    expect(added + 2 * error).toBeLessThanOrEqual(5);
  });

  it('files the bass’s own lines on a miss and the composer’s variations, each reading back as filed', () => {
    const by = (source: string) => FILED.filter((f) => f.filing.source === source).length;
    expect([FILED.length, by(BASSIST), by(COMPOSER)]).toEqual([108, 17, 91]);
    for (const run of LEARNED)
      for (const { id } of run.lineFilings.filter((f) => !f.held))
        expect(linesFiled(run.learning!.layer).map((f) => f.fragment.id)).toContain(id);
    for (const { filing, id } of FILED.filter((f) => !f.held)) {
      const layer = LEARNED.find((r) => r.lineFilings.some((f) => f.id === id))!.learning!.layer;
      const text = layer.filed.find((f) => f.fragment.id === id)!.fragment.text;
      expect(readLine(text, filing.bench.meter)!.notes, id).toEqual(
        [...filing.notes].sort((a, b) => a.step - b.step),
      );
    }
  });

  it(`keeps a layer under its cap of ${LAYER_CAP.toLocaleString('en')} bytes over 3 hours with the drums and the bass filing, nothing dropped`, () => {
    const bytes = Math.max(...LONG.map((r) => layerBytes(r.learning!.layer)));
    expect(bytes).toBe(15188);
    expect(bytes).toBeLessThan(LAYER_CAP);
    expect(LONG.reduce((n, r) => n + r.learning!.dropped, 0)).toBe(0);
  });

  it('leaves E39’s most used groove where it was: 1,661 of 3,222 sections, within 1 point', () => {
    const { sections, mostUsed, share } = mostUsedGroove(LONG);
    expect([sections, mostUsed]).toEqual([3222, 1661]);
    expect(Math.abs(share - 1661 / 3222)).toBeLessThanOrEqual(0.01);
  });
});
