import { METERS, type Meter, type MeterName, heightOf, stepsOf, wrap } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { PITCHED_OPERATORS, variations } from '@yggi/cells/engine/vary/index';
import { INSTRUMENT_FRAGMENTS, BASS_FRAGMENTS } from './library.ts';
import { bodyOf } from '@yggi/cells/engine/use';
import { describe, expect, it } from 'vitest';
import {
  BASS_REPOSITORY,
  BASS_VOICE,
  LINE_BENCHES,
  lineRepository,
  lineText,
  readLine,
  readingBench,
} from './bass-lines.ts';
import { type LineNote, type LineRead, lineTone } from './bass-query.ts';
import type { BarChord } from './chords.ts';
import { EMPTY_LAYER, type LearnedLayer } from './layer.ts';
import { type Key, keyHelix } from './key.ts';
import { signedLayer, takenOn } from './taken.ts';
import { stepSeconds } from './tempo.ts';

const KEY: Key = { tonic: 9, mode: 'aeolian' };
/** Four chords as cells' harmony writes them, a bar each: i, VI, iv, v7 of A minor. */
const STACKS = [
  [0, 2, 4],
  [5, 7, 9],
  [3, 5, 7],
  [4, 6, 8, 10],
] as const;
const HARM = `&harm over=&key step=1m ${STACKS.map((s) => `[${s.join(',')}]`).join(' ')}`;
/** The same chords as the band writes them: each stack's degrees as heights in the key's register. */
const CHORDS: BarChord[] = STACKS.map((stack) => ({
  slot: { step: 0, degree: stack[0]! } as BarChord['slot'],
  raised: false,
  chord: {
    helix: {
      cycle: 12,
      heights: stack.filter((_, i) => i < 4).map((d) => heightOf(keyHelix(KEY), d)),
    },
    tensions: [],
  },
}));
const NAMES = Object.keys(METERS) as MeterName[];
const READ_AT = 120;

/** What cells plays of a line over `HARM`, bar by bar: each note's bar, step and pitch class. */
/** Cells' `bass` instrument, the voice the lines play through (yggi/cells#260), as cells states it. */
const BASS = INSTRUMENT_FRAGMENTS.find((f) => f.id === 'bass')!.text;

function cellsPlays(text: string, name: MeterName, bars: number): string[] {
  const meter = METERS[name];
  const taken = takenOn(
    text,
    [
      `&bar meter("${name}") step=${READ_AT}bpm`,
      '&key scale(aeolian, A)',
      HARM,
      BASS,
      ...BASS_VOICE,
    ].join('\n'),
    { head: '&bassline', main: '&harm' },
  );
  const plan = planOf(taken.text, undefined, { resolve: taken.resolve });
  const route = router(plan.result, channelTable(plan.result));
  const step = stepSeconds(READ_AT, meter);
  const steps = stepsOf(meter);
  const out: string[] = [];
  for (const e of windowAt(plan, 0, bars * steps * step).events)
    for (const r of routesOf(route(e))) {
      const note = midiNote(e, r);
      if (!note) continue;
      const at = Math.round(note.at / step);
      out.push(`${Math.floor(at / steps)}:${at % steps}:${wrap(note.note, 12)}`);
    }
  return out.sort();
}

/** What the band plays of a line read so, over the same chords: each note's bar, step and pitch class. */
function bandPlays(read: LineRead, meter: Meter, bars: number): string[] {
  const steps = stepsOf(meter);
  const out: string[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const lap = bar % read.bars;
    for (const n of read.notes.filter((x) => Math.floor(x.step / steps) === lap)) {
      const note = { ...n, step: n.step - lap * steps };
      const pitch = lineTone(note, [CHORDS[bar % 4]!], [CHORDS[(bar + 1) % 4]!], KEY);
      out.push(`${bar}:${note.step}:${wrap(pitch, 12)}`);
    }
  }
  return out.sort();
}

describe("cells' bass lines read into the notes the band plays (#423)", () => {
  it('reads each of the seeds under every named meter as cells plays it over a harmony: where each note falls and its pitch class, over 8 bars', () => {
    // (whichever bass lines cells offers: its library's list is cells', yggi/music-commons#37)
    expect(BASS_FRAGMENTS.length).toBeGreaterThan(0);
    for (const name of NAMES)
      for (const f of BASS_FRAGMENTS) {
        const read = readLine(f.text, METERS[name]);
        expect(read, `${f.id} in ${name}`).not.toBeNull();
        expect(bandPlays(read!, METERS[name], 8), `${f.id} in ${name}`).toEqual(
          cellsPlays(f.text, name, 8),
        );
      }
  });

  it('reads every variation cells makes of the seeds by its pitched operators, in 4/4, as cells plays it', () => {
    const all = BASS_FRAGMENTS.flatMap((f) =>
      variations(f.text, {
        workbench: `${readingBench('4/4')}\n${BASS}`,
        operators: PITCHED_OPERATORS,
      }).map((v) => ({ id: `${f.id}: ${v.by}`, text: v.apply(f.text) })),
    );
    expect(all.length).toBeGreaterThan(BASS_FRAGMENTS.length);
    for (const { id, text } of all)
      expect(bandPlays(readLine(text, METERS['4/4'])!, METERS['4/4'], 4), id).toEqual(
        cellsPlays(text, '4/4', 4),
      );
  });

  it('reads each seed in 4/4 as its pattern: the root on one and three, the offbeats, the eighths, the funk line anticipating, the walk', () => {
    const read = (id: string) =>
      readLine(BASS_FRAGMENTS.find((f) => f.id === id)!.text, METERS['4/4'])!;
    const root = { chord: 0, index: 0, alter: 0, shift: 0 };
    expect(read('root_bass')).toEqual({
      bars: 1,
      notes: [0, 8].map((step) => ({ step, ...root })),
    });
    expect(read('pumping_bass').notes.map((n) => n.step)).toEqual([2, 6, 10, 14]);
    expect(read('eighths_bass').notes.map((n) => n.step)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(
      read('funk_bass')
        .notes.filter((n) => n.chord === 1)
        .map((n) => n.step),
    ).toEqual([13, 14]);
    expect(read('walking_bass').notes).toEqual([
      { step: 0, ...root },
      { step: 4, ...root, index: 1 },
      { step: 8, ...root, index: 2 },
      { step: 12, chord: 1, index: 0, alter: 0, shift: -1 },
    ]);
    // a lap of more than a bar where its grid doesn't divide the bar: the pump's eight eighths over 3/4's six
    const pump = BASS_FRAGMENTS.find((f) => f.id === 'pumping_bass')!;
    expect(readLine(pump.text, METERS['3/4'])!.bars).toBe(4);
  });

  it('states a bar of notes as cells text that reads back as them: the round trip a filing relies on, on the coarsest grid they fall on', () => {
    const note = (step: number, more: Partial<LineNote> = {}): LineNote => ({
      step,
      chord: 0,
      index: 0,
      alter: 0,
      shift: 0,
      ...more,
    });
    const bars: [MeterName, LineNote[]][] = [
      ['4/4', [note(0), note(8)]],
      ['4/4', [note(2), note(6), note(10), note(14)]],
      [
        '4/4',
        [note(0), note(4, { index: 1 }), note(8, { index: 2 }), note(12, { chord: 1, shift: -1 })],
      ],
      [
        '4/4',
        [
          note(0),
          note(3, { index: -1 }),
          note(13, { chord: 1, index: 2 }),
          note(14, { chord: 1, index: -2, shift: 1 }),
        ],
      ],
      [
        '4/4',
        [note(0), note(5, { shift: 3 }), note(7, { shift: -2, index: 1 }), note(9, { index: 1 })],
      ],
      ['7/8', [note(0), note(5), note(9, { chord: 1 })]],
      [
        '4/4',
        [note(0), note(4), note(8, { index: 1 }), note(12, { chord: 1, index: -1, shift: -1 })],
      ],
      ['4/4', [note(0), note(6, { index: 2, shift: 1 })]],
      ['3/4', [note(0), note(4, { index: 2 }), note(8, { index: 4 })]],
    ];
    for (const [name, notes] of bars) {
      const text = lineText(notes, stepsOf(METERS[name]));
      expect(readLine(text, METERS[name]), text).toEqual({ bars: 1, notes });
      // (and no card, as a seed line carries none since yggi/cells#299: the reading brings BASS_VOICE)
      expect(text).not.toMatch(/map=midi/);
    }
    expect(() => lineText([note(0, { alter: 1 })], 16)).toThrow(/accidental/);
    // (a template, as a seed line is: its signature first, the harmony its main parameter, #562)
    expect(
      lineText([note(0), note(8)], 16)
        .split('\n')
        .slice(0, 2),
    ).toEqual(['&bassline from &harm', '&bassline over=&harm step=2n 0 0']);
    expect(lineText([note(0), note(12, { chord: 1, shift: -1 })], 16).split('\n')[1]).toBe(
      '&bassline over=&harm step=4n 0 ~ ~ &bassNext^$-1',
    );
  });

  it('files a line once and finds it at its point at distance 0, a second filing of its text adding to it (identity)', () => {
    const notes: LineNote[] = [0, 3, 6, 10].map((step) => ({
      step,
      chord: 0,
      index: step === 6 ? 2 : 0,
      alter: 0,
      shift: 0,
    }));
    const point = { sync: 0.9, harm: 0.9, artic: 0.9, energy: 0.1 };
    const bench = { meter: METERS['4/4'], meterFragment: 'meter' };
    const filing = {
      notes,
      bench,
      point,
      source: 'Ada',
      created: 'song 1, bar 8',
      tags: ['bass line'],
    };
    const filed = lineRepository().file!(EMPTY_LAYER, filing);
    expect(filed.held).toBe(false);
    expect(lineRepository().read(filed.id, bench.meter, filed.layer)).toEqual({ bars: 1, notes });
    expect(lineRepository().query(point, bench, filed.layer)[0]).toEqual({
      id: filed.id,
      distance: 0,
      score: 0,
    });
    // a bar of the root on one and three states as the root bass's own text: filing it is a use of the seed
    const root = [0, 8].map((step) => ({ step, chord: 0, index: 0, alter: 0, shift: 0 }));
    const seed = lineRepository().file!(EMPTY_LAYER, { ...filing, notes: root });
    expect([seed.held, seed.id, seed.layer.filed.length]).toEqual([true, 'root_bass', 0]);
    const again = lineRepository().file!(filed.layer, { ...filing, created: 'song 1, bar 16' });
    expect([again.held, again.id, again.layer.filed.length]).toEqual([true, filed.id, 1]);
    // A line filed before cells v0.21.0, with no signature, is known as the one heard once a kept layer signs it (#562).
    const file = filed.layer.filed[0]!;
    const before: LearnedLayer = {
      ...filed.layer,
      filed: [{ ...file, fragment: { ...file.fragment, text: bodyOf(file.fragment.text) } }],
    };
    expect(lineRepository().file!(before, { ...filing, created: 'song 2' }).held).toBe(false);
    const signed = signedLayer(before);
    expect(signed.filed[0]!.fragment.text).toBe(file.fragment.text);
    expect(lineRepository().file!(signed, { ...filing, created: 'song 2' })).toMatchObject({
      id: filed.id,
      held: true,
    });
    // (a layer with nothing to sign is the same layer)
    expect(signedLayer(filed.layer)).toBe(filed.layer);
  });

  it('reads nothing but from its cache once warmed on every bench, its variations too', () => {
    let reads = 0;
    const repository = lineRepository(BASS_FRAGMENTS, (text, meter) => {
      reads++;
      return readLine(text, meter);
    });
    const steps = [...repository.warm!(LINE_BENCHES)].length;
    const warmed = reads;
    expect(warmed).toBe(BASS_FRAGMENTS.length * NAMES.length);
    expect(steps).toBeGreaterThanOrEqual(warmed);
    for (const bench of LINE_BENCHES) {
      repository.query({ sync: 0.5, harm: 0.5, artic: 0.5, energy: 0.5 }, bench);
      for (const f of BASS_FRAGMENTS) repository.read(f.id, bench.meter);
    }
    expect(reads).toBe(warmed);
  });

  it("varies a seed line by one of cells' pitched operators, never moving the root on the bar's downbeat, and names it", () => {
    const bench = { meter: METERS['4/4'] };
    const seen = new Set<string>();
    for (let k = 0; k < 64; k++) {
      const v = BASS_REPOSITORY.vary!('walking_bass', bench, k / 64)!;
      seen.add(v.by);
      expect(v.notes[0]).toEqual({ step: 0, chord: 0, index: 0, alter: 0, shift: 0 });
    }
    expect([...seen]).toEqual([
      'transpose &bassline -2',
      'transpose &bassline -1',
      'transpose &bassline 1',
      'transpose &bassline 2',
      'invert &bassline',
      'reverse &bassline',
      'bend &bassline -2',
      'bend &bassline -1',
      'bend &bassline 1',
      'bend &bassline 2',
      'trim &bassline 3',
    ]);
  });
});
