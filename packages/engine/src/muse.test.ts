import { chromaticStep, heightOf, motifProblems } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { barStart } from './events.ts';
import { COMPOSER_MODES, type Key, keyHelix } from './key.ts';
import { type Script, lawBreaks } from './machine.ts';
import {
  type HeardNote,
  type Judgement,
  MUSE,
  PHRASE_MEMORY,
  type MuseCarried,
  type MuseEnv,
  type MuseInput,
  admissible,
  heardIn,
  judgeBar,
  keptAfter,
  muse,
  taken,
} from './muse.ts';

const range = (n: number) => [...Array(n).keys()];
const keys: Key[] = COMPOSER_MODES.flatMap((mode) => range(12).map((tonic) => ({ tonic, mode })));
const A_MINOR: Key = { tonic: 9, mode: 'aeolian' };

/** Notes from one source in bar 0, one per `[step, note]`, each held until the next or given its release. */
const played = (notes: [number, number, number?][], source = 'the computer keys'): HeardNote[] =>
  notes.map(([position, note, end]) => ({
    note,
    velocity: 100,
    source,
    position,
    end: end ?? null,
  }));

/** The same notes, each struck at its velocity. */
const struck = (notes: HeardNote[], velocities: number[]) =>
  notes.map((n, i) => ({ ...n, velocity: velocities[i]! }));

/** Every motif the Muse writes is well formed (U4). */
const wellFormed = (judgements: readonly Judgement[]) => {
  for (const j of judgements) if (j.kind === 'motif') expect(motifProblems(j.motif)).toEqual([]);
  return judgements;
};

const judgeOne = (notes: HeardNote[], key = A_MINOR) => {
  const judgements = wellFormed(judgeBar(notes, 0, key));
  expect(judgements).toHaveLength(1);
  return judgements[0]!;
};

/** A motif of notes only, none altered. */
const plain = (onsets: number[], degrees: number[]) => ({
  cycle: 16,
  onsets,
  degrees,
  accidentals: onsets.map(() => 0),
});

describe('reading a phrase across bars', () => {
  /** A phrase of quarters and its bar lines: `first` and on, `count` of them, one source. */
  const quarters = (
    first: number,
    count: number,
    source: string,
    jitter: (i: number) => number = () => 0,
  ) =>
    range(count).map((i) => ({
      note: 60 + ((i * 3) % 12),
      velocity: 100,
      source,
      position: first + 4 * i + jitter(i),
      end: null,
    }));

  it('puts a first note struck early into the bar it meant, not the bar before', () => {
    const notes = quarters(16, 4, 'a hand', (i) => [-0.55, -0.3, 0.3, -0.3][i]!);
    // Judging bar 0 (before anything of bar 1 is known) sees one note in it, as the nearest step does: too few, not offered.
    expect(judgeBar(notes, 0, A_MINOR)).toEqual(judgeBar(notes, 0, A_MINOR, 'nearest'));
    // Judging bar 1 reads the phrase so far, the early note included.
    const near = judgeBar(notes, 1, A_MINOR, 'nearest');
    expect(near[0]).toMatchObject({ kind: 'motif', motif: { onsets: [0, 4, 8, 12] } });
    expect(near[0]!.kind === 'motif' && near[0]!.motif.degrees[0]).toBeNull();
    const bar = judgeBar(notes, 1, A_MINOR);
    expect(bar).toHaveLength(1);
    expect(bar[0]).toMatchObject({ kind: 'motif', motif: { onsets: [0, 4, 8, 12] } });
    expect(bar[0]!.kind === 'motif' && bar[0]!.motif.degrees[0]).not.toBeNull();
  });

  it('reads a bar by the phrase before it: notes of the bars back count', () => {
    // Quarters through two bars, the first note of the second struck 0.55 of a step early, mid-phrase, among notes a third of a step off either way:
    // the phrase's quarters put it on the bar.
    const notes = quarters(
      0,
      8,
      'a hand',
      (i) => [0.3, -0.3, 0.3, -0.3, -0.55, -0.3, 0.3, -0.3][i]!,
    );
    const first = (reading: 'nearest' | 'phrases') => {
      const j = judgeBar(notes, 1, A_MINOR, reading)[0];
      return j?.kind === 'motif' ? j.motif.degrees[0] : undefined;
    };
    // The nearest step puts the note in bar 0 and starts bar 1 with a rest; the phrase's quarters put it on the bar.
    expect(first('nearest')).toBeNull();
    expect(first('phrases')).toBe(0);
  });

  it('never depends on notes of the bars after the one judged', () => {
    const draw = (() => {
      let x = 5;
      return () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 2 ** 32;
    })();
    for (let trial = 0; trial < 60; trial++) {
      const notes = range(12).map(() => ({
        note: 57 + Math.floor(draw() * 14),
        velocity: 90,
        source: draw() < 0.7 ? 'a' : 'b',
        position: 16 + draw() * 48,
        end: draw() < 0.5 ? null : 16 + draw() * 48,
      }));
      const bar = 1 + Math.floor(draw() * 2);
      const before = notes.filter((n) => n.position < barStart(bar + 1));
      expect(judgeBar(before, bar, A_MINOR)).toEqual(judgeBar(notes, bar, A_MINOR));
    }
  });

  it('reads each source on its own', () => {
    const early = quarters(16, 4, 'early', (i) => (i === 0 ? -0.45 : 0.05));
    const exact = quarters(16, 4, 'exact');
    const bar = judgeBar([...early, ...exact], 1, A_MINOR);
    expect(bar.map((j) => j.source).sort()).toEqual(['early', 'exact']);
    expect(judgeBar([...early], 1, A_MINOR)).toEqual(bar.filter((j) => j.source === 'early'));
  });
});

describe('what the Muse keeps once a bar is judged (keptAfter)', () => {
  const note = (position: number, source = 'a'): HeardNote => ({
    note: 60,
    velocity: 100,
    source,
    position,
    end: null,
  });

  it('keeps the notes of the bars after, and a phrase still running', () => {
    const notes = [note(2), note(6), note(14), note(20)];
    expect(keptAfter(notes, 0)).toEqual(notes);
  });

  it('drops a phrase that has been silent a bar, and keeps what is after it', () => {
    const notes = [note(2), note(6), note(40)];
    expect(keptAfter(notes, 1)).toEqual([note(40)]);
  });

  it('keeps each source’s running phrase and drops another source’s finished one', () => {
    const notes = [note(2, 'done'), note(30, 'running'), note(34, 'running')];
    expect(keptAfter(notes, 1)).toEqual([note(30, 'running'), note(34, 'running')]);
  });

  it('forgets a phrase’s notes more than PHRASE_MEMORY bars back, however long it runs', () => {
    const notes = range(40 * 4).map((i) => note(i * 4));
    const kept = keptAfter(notes, 39);
    expect(kept.length).toBeLessThanOrEqual(PHRASE_MEMORY * 4 + 4);
    expect(kept.length).toBeGreaterThan((PHRASE_MEMORY - 1) * 4);
  });

  it('keeps nothing of nothing', () => {
    expect(keptAfter([], 3)).toEqual([]);
  });
});

describe('what a host takes from a client (admissible)', () => {
  /** A keyed stand-in for chance. */
  const draws = (seed: number) => {
    let x = seed;
    return () => (x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 2 ** 32;
  };

  it('admits every judgement judgeBar makes, in every key the composer knows', () => {
    const draw = draws(9);
    let motifs = 0;
    for (const key of keys)
      for (let bar = 0; bar < 60; bar++) {
        const count = 1 + Math.floor(draw() * 15);
        const spread = 6 + Math.floor(draw() * 24);
        const notes: HeardNote[] = range(count).map(() => ({
          note: 55 + Math.floor(draw() * spread),
          velocity: 1 + Math.floor(draw() * 126),
          source: 'a client',
          position: draw() * 16,
          end: draw() < 0.5 ? null : draw() * 16,
        }));
        for (const j of judgeBar(notes, 0, key)) {
          expect(admissible(j, key)).toBe(true);
          if (j.kind === 'motif') motifs++;
        }
      }
    expect(motifs).toBeGreaterThan(500);
  });

  it('refuses a motif no ear would write, and counts the gates would not give', () => {
    const good = judgeOne(
      played([
        [0, 69],
        [4, 72],
        [8, 76],
      ]),
    );
    expect(admissible(good, A_MINOR)).toBe(true);
    if (good.kind !== 'motif') throw new Error('a motif');
    const motif = (m: Partial<typeof good.motif>, level = good.level): Judgement => ({
      ...good,
      motif: { ...good.motif, ...m },
      level,
    });
    for (const bad of [
      motif({ cycle: 12 }),
      motif({ onsets: [0, 4, 20] }),
      motif({ onsets: [0, 4, 4] }),
      motif({ degrees: [0, 2.5, 4] }),
      motif({ accidentals: [0, 2, 0] }),
      motif({ onsets: [0, 1], degrees: [0, 2], accidentals: [0, 0] }),
      motif({
        onsets: range(13),
        degrees: range(13).map(() => 0),
        accidentals: range(13).map(() => 0),
      }),
      // Two octaves and more from any first note.
      motif({ degrees: [0, 7, 14] }),
      motif({}, 300),
      { ...good, confidence: 1.5 },
      { ...good, confidence: -0.1 },
      { ...good, confidence: Number.NaN },
      { kind: 'mashing', source: 'a client', count: 5 } as Judgement,
      { kind: 'too few', source: 'a client', count: 9 } as Judgement,
      { kind: 'too wide', source: 'a client', range: 12 } as Judgement,
    ])
      expect(admissible(bad, A_MINOR)).toBe(false);
    expect(admissible(motif({ degrees: [0, 7, 11] }), A_MINOR)).toBe(true);
    expect(admissible({ ...good, confidence: 0 }, A_MINOR)).toBe(true);
    expect(admissible({ ...good, confidence: 0.5 }, A_MINOR)).toBe(true);
    const bare: Partial<Judgement & { confidence: number }> = { ...good };
    delete bare.confidence;
    expect(admissible(bare as Judgement, A_MINOR)).toBe(true);
  });

  it('refuses what is not a judgement at all, as it may arrive off the wire, without throwing', () => {
    const good = judgeOne(
      played([
        [0, 69],
        [4, 72],
        [8, 76],
      ]),
    );
    if (good.kind !== 'motif') throw new Error('a motif');
    const { motif } = good;
    const shapes: unknown[] = [
      null,
      undefined,
      42,
      'motif',
      [],
      {},
      { kind: 'motif' },
      { kind: 'motif', source: 'a client', level: 100 },
      { kind: 'motif', source: 'a client', level: 100, motif: null },
      { kind: 'motif', source: 'a client', level: 100, motif: { cycle: 16 } },
      { ...good, motif: { ...motif, onsets: 'x' } },
      { ...good, motif: { ...motif, degrees: [0, 2] } },
      { ...good, motif: { ...motif, degrees: [0, '2', 4] } },
      { ...good, motif: { ...motif, accidentals: undefined } },
      { ...good, motif: { ...motif, accents: [0, 'x', 0] } },
      { ...good, motif: { ...motif, accents: [0, 0] } },
      { ...good, confidence: '1' },
      { ...good, confidence: null },
      { ...good, source: undefined },
      { ...good, source: 7 },
      { ...good, kind: 'a motif, trust me' },
      { kind: 'mashing', source: 'a client', count: '13' },
      { kind: 'too wide', source: 'a client' },
    ];
    for (const shape of shapes)
      expect(() => admissible(shape as Judgement, A_MINOR), JSON.stringify(shape)).not.toThrow();
    for (const shape of shapes)
      expect(admissible(shape as Judgement, A_MINOR), JSON.stringify(shape)).toBe(false);
    expect(admissible({ ...good, motif: { ...motif, accents: [0, 12, -9] } }, A_MINOR)).toBe(true);
  });
});

describe('the Muse’s judgement', () => {
  it('has the prototype’s gates: more than 12 notes is mashing, fewer than 3 too few, a range over 19 too wide; and forgets after 16 silent bars', () => {
    expect(MUSE).toEqual({ mashing: 12, fewest: 3, widest: 19, forgetAfter: 16 });
  });

  it('takes 12 notes in a bar, and calls 13 mashing, counting a chord’s every note', () => {
    const chords = (count: number) => played(range(count).map((i) => [4 * (i % 3), 60 + i]));
    expect(judgeOne(chords(12))).toMatchObject({ kind: 'motif' });
    expect(judgeOne(chords(13))).toEqual({
      kind: 'mashing',
      source: 'the computer keys',
      count: 13,
    });
  });

  it('takes a melody of 3 steps, and calls 2 too few, however many notes stand on them', () => {
    expect(
      judgeOne(
        played([
          [0, 69],
          [4, 72],
          [8, 76],
        ]),
      ),
    ).toMatchObject({ kind: 'motif' });
    const twoSteps = played([
      [0, 69],
      [0, 72],
      [0, 76],
      [8, 69],
      [8, 74],
    ]);
    expect(judgeOne(twoSteps)).toEqual({ kind: 'too few', source: 'the computer keys', count: 2 });
  });

  it('takes a range of 19 semitones, and calls 20 too wide', () => {
    expect(
      judgeOne(
        played([
          [0, 57],
          [4, 60],
          [8, 76],
        ]),
      ),
    ).toMatchObject({ kind: 'motif' });
    expect(
      judgeOne(
        played([
          [0, 57],
          [4, 60],
          [8, 77],
        ]),
      ),
    ).toEqual({
      kind: 'too wide',
      source: 'the computer keys',
      range: 20,
    });
  });

  it('hears a chord as its top note, and a note struck twice on a step once', () => {
    const judgement = judgeOne(
      played([
        [0, 57],
        [0, 69],
        [0, 64],
        [4, 72],
        [4, 72],
        [8, 71],
      ]),
    );
    expect(judgement).toEqual({
      kind: 'motif',
      source: 'the computer keys',
      motif: plain([0, 4, 8], [0, 2, 1]),
      level: 100,
      confidence: 1,
    });
  });

  it('writes a melody as degrees of the key from its first note, the same in every key and mode', () => {
    for (const key of keys) {
      const scale = keyHelix(key);
      const shape = [0, 2, 1, 4, -1];
      const notes = played(shape.map((d, i) => [3 * i, heightOf(scale, 35 + d)]));
      const judgement = judgeOne(notes, key);
      expect(judgement).toEqual({
        kind: 'motif',
        source: 'the computer keys',
        motif: plain([0, 3, 6, 9, 12], shape),
        level: 100,
        confidence: 1,
      });
    }
  });

  it('gives back every note played, in the key or off it, as a degree and an alteration (U4)', () => {
    // A blue note comes back as itself: of the 12 notes of an octave, the 5
    // off a diatonic key are written altered, as a numeral writes a root.
    let altered = 0;
    for (const key of keys) {
      const scale = keyHelix(key);
      for (const offset of range(12)) {
        const tonic = 60 + key.tonic;
        const note = tonic + offset;
        const judgement = judgeOne(
          played([
            [0, tonic],
            [4, note],
            [8, tonic],
          ]),
          key,
        );
        if (judgement.kind !== 'motif') throw new Error(judgement.kind);
        const { degrees, accidentals } = judgement.motif;
        const back = heightOf(scale, 35 + degrees[1]!) + accidentals[1]! * chromaticStep(scale);
        expect(back).toBe(note);
        const inKey = scale.heights.some((h) => (h - note) % 12 === 0);
        expect(accidentals[1] === 0).toBe(inKey);
        if (!inKey) altered++;
      }
    }
    expect(altered).toBe(5 * keys.length);
  });

  it('counts degrees from the first note, altered or not', () => {
    // E♭ C E♭ in A minor: a flat fifth, then the third, then the flat fifth.
    const judgement = judgeOne(
      played([
        [0, 75],
        [4, 72],
        [8, 75],
      ]),
    );
    expect(judgement).toMatchObject({
      motif: { onsets: [0, 4, 8], degrees: [0, -2, 0], accidentals: [-1, 0, -1] },
    });
  });

  it('leaves a rest where a note was released before the next, and none where it was held over (U4)', () => {
    const judgement = judgeOne(
      played([
        [0, 69, 1.8],
        [4, 72, 9],
        [8, 76, 12.4],
        [14, 74],
      ]),
    );
    expect(judgement).toMatchObject({
      motif: { onsets: [0, 2, 4, 8, 12, 14], degrees: [0, null, 2, 4, null, 3] },
    });
  });

  it('leaves no rest where a note was released just as the next starts, or on the bar line', () => {
    const judgement = judgeOne(
      played([
        [0, 69, 4],
        [4, 72],
        [8, 76, 16],
      ]),
    );
    expect(judgement).toMatchObject({ motif: { onsets: [0, 4, 8], degrees: [0, 2, 4] } });
  });

  it('holds a note released on its own step for one step at least', () => {
    const judgement = judgeOne(
      played([
        [0, 69, 0.2],
        [4, 72],
        [8, 76],
      ]),
    );
    expect(judgement).toMatchObject({ motif: { onsets: [0, 1, 4, 8], degrees: [0, null, 2, 4] } });
  });

  it('starts a bar that starts silent with a rest, unless a rest at its end runs round to its first note', () => {
    const held = judgeOne(
      played([
        [4, 69],
        [8, 72],
        [12, 76],
      ]),
    );
    expect(held).toMatchObject({ motif: { onsets: [0, 4, 8, 12], degrees: [null, 0, 2, 4] } });
    const released = judgeOne(
      played([
        [4, 69],
        [8, 72],
        [12, 76, 14],
      ]),
    );
    expect(released).toMatchObject({ motif: { onsets: [4, 8, 12, 14], degrees: [0, 2, 4, null] } });
    const past = judgeOne(
      played([
        [4, 69],
        [8, 72],
        [12, 76, 17],
      ]),
    );
    expect(past).toMatchObject({ motif: { onsets: [0, 4, 8, 12], degrees: [null, 0, 2, 4] } });
  });

  it('counts each note’s accent from the player’s level in the bar, the rounded mean of the melody (U4)', () => {
    const judgement = judgeOne(
      struck(
        played([
          [0, 69],
          [4, 72],
          [8, 76],
        ]),
        [100, 81, 90],
      ),
    );
    expect(judgement).toMatchObject({ level: 90, motif: { accents: [10, -9, 0] } });
  });

  it('writes no accents where every note is at the level, and none on a rest', () => {
    const even = judgeOne(
      struck(
        played([
          [0, 69],
          [4, 72],
          [8, 76],
        ]),
        [70, 70, 70],
      ),
    );
    expect(even).toMatchObject({ level: 70 });
    expect(even.kind === 'motif' && 'accents' in even.motif).toBe(false);
    const rested = judgeOne(
      struck(
        played([
          [0, 69, 1.8],
          [4, 72],
          [8, 76],
        ]),
        [100, 80, 90],
      ),
    );
    expect(rested).toMatchObject({
      level: 90,
      motif: { onsets: [0, 2, 4, 8], accents: [10, 0, -10, 0] },
    });
  });

  it('hears a chord’s loudness in its top note only', () => {
    const notes = struck(
      played([
        [0, 57],
        [0, 69],
        [4, 72],
        [8, 76],
      ]),
      [20, 100, 80, 90],
    );
    expect(judgeOne(notes)).toMatchObject({ level: 90, motif: { accents: [10, -10, 0] } });
  });

  it('writes the same motif for the same accents played louder or softer; only the level moves', () => {
    const notes = played([
      [0, 69],
      [4, 72],
      [8, 76],
    ]);
    const loud = judgeOne(struck(notes, [120, 100, 110]));
    const soft = judgeOne(struck(notes, [50, 30, 40]));
    if (loud.kind !== 'motif' || soft.kind !== 'motif') throw new Error('not motifs');
    expect(loud.motif).toEqual(soft.motif);
    expect([loud.level, soft.level]).toEqual([110, 40]);
  });

  it('puts each note on the step nearest where it was heard, in the baseline reading', () => {
    const judgement = judgeBar(
      played([
        [0.4, 69],
        [3.6, 72],
        [8.49, 76],
        [11.49, 74],
      ]),
      0,
      A_MINOR,
      'nearest',
    )[0];
    expect(judgement).toMatchObject({ motif: { onsets: [0, 4, 8, 11] } });
  });

  it('reads a phrase as a hand played it: a note off by a step of a loose hand goes where the phrase says', () => {
    // Quarters, the last struck 0.6 of a step early, the others a third of a step off either way: the nearest step says 11, the phrase's quarters 12.
    const notes = played([
      [0.3, 69],
      [3.7, 72],
      [8.3, 76],
      [11.4, 74],
    ]);
    expect(judgeBar(notes, 0, A_MINOR, 'nearest')[0]).toMatchObject({
      motif: { onsets: [0, 4, 8, 11] },
    });
    expect(judgeBar(notes, 0, A_MINOR)[0]).toMatchObject({ motif: { onsets: [0, 4, 8, 12] } });
  });

  it('hears a note in the bar its nearest step is in, so one just before a bar belongs to it', () => {
    const notes = played([
      [-0.3, 69],
      [15.4, 72],
      [15.6, 76],
      [16.2, 74],
    ]);
    expect(heardIn(notes, 0).map((n) => n.note)).toEqual([69, 72]);
    expect(heardIn(notes, 1).map((n) => n.note)).toEqual([76, 74]);
    expect(heardIn(notes, -1)).toEqual([]);
  });

  it('judges a bar’s notes and no other bar’s', () => {
    const notes = played([
      [0, 69],
      [4, 72],
      [8, 76],
      [16, 60],
      [20, 62],
      [24, 64],
      [28, 65],
    ]);
    const [first] = judgeBar(notes, 0, A_MINOR);
    expect(first).toMatchObject({ motif: { onsets: [0, 4, 8] } });
    const [second] = judgeBar(notes, 1, A_MINOR);
    expect(second).toMatchObject({ motif: { onsets: [0, 4, 8, 12] } });
    expect(judgeBar(notes, 2, A_MINOR)).toEqual([]);
  });

  it('judges each source on its own, in the order their first notes arrived (A3)', () => {
    const notes = [
      ...played([[2, 60]], 'a MIDI port'),
      ...played(
        [
          [0, 69],
          [4, 72],
          [8, 76],
        ],
        'the on-screen keys',
      ),
      ...played(
        [
          [6, 62],
          [10, 64],
        ],
        'a MIDI port',
      ),
    ];
    expect(judgeBar(notes, 0, A_MINOR)).toEqual([
      {
        kind: 'motif',
        source: 'a MIDI port',
        motif: {
          cycle: 16,
          onsets: [0, 2, 6, 10],
          degrees: [null, 0, 1, 2],
          accidentals: [0, 0, 0, 0],
        },
        level: 100,
        confidence: 1,
      },
      {
        kind: 'motif',
        source: 'the on-screen keys',
        motif: plain([0, 4, 8], [0, 2, 4]),
        level: 100,
        confidence: 1,
      },
    ]);
  });

  it('takes the motif of the most notes when the readings are as sure, the first to arrive on a tie, and none when none is a motif (A3)', () => {
    const three = played(
      [
        [0, 69],
        [4, 72],
        [8, 76],
      ],
      'three',
    );
    const four = played(
      [
        [1, 69],
        [5, 72],
        [9, 76],
        [13, 74],
      ],
      'four',
    );
    const otherThree = played(
      [
        [2, 69],
        [6, 72],
        [10, 76],
      ],
      'other three',
    );
    const mashing = played(
      range(13).map((i) => [i, 60 + i]),
      'mashing',
    );
    const judge = (...sources: HeardNote[][]) => taken(judgeBar(sources.flat(), 0, A_MINOR));
    expect(judge(three, four)?.source).toBe('four');
    expect(judge(four, three)?.source).toBe('four');
    expect(judge(three, otherThree)?.source).toBe('three');
    expect(judge(otherThree, three)?.source).toBe('other three');
    expect(judge(mashing, three)?.source).toBe('three');
    expect(judge(mashing)).toBeNull();
    expect(judge()).toBeNull();
  });

  it('takes the motif the reading is surest of, though it has fewer notes', () => {
    const exact = judgeBar(
      played(
        [
          [0, 69],
          [4, 72],
          [8, 76],
        ],
        'exact',
      ),
      0,
      A_MINOR,
    );
    const loose = judgeBar(
      played(
        [
          [1.4, 69],
          [5.3, 72],
          [9.4, 76],
          [13.3, 74],
        ],
        'loose',
      ),
      0,
      A_MINOR,
    );
    const confidence = (js: Judgement[]) => (js[0]!.kind === 'motif' ? js[0]!.confidence! : NaN);
    expect(confidence(exact)).toBe(1);
    expect(confidence(loose)).toBeLessThan(1);
    expect(taken([...loose, ...exact])?.source).toBe('exact');
    expect(taken([...exact, ...loose])?.source).toBe('exact');
    // As sure as each other, the notes decide again.
    const sameSure = loose.map((j) => (j.kind === 'motif' ? { ...j, confidence: 1 } : j));
    expect(taken([...exact, ...sameSure])?.source).toBe('loose');
  });

  it('counts a judgement without a confidence, from the nearest step, as sure', () => {
    const notes = played(
      [
        [0, 69],
        [4, 72],
        [8, 76],
      ],
      'nearest',
    );
    const [near] = judgeBar(notes, 0, A_MINOR, 'nearest');
    expect(near).not.toHaveProperty('confidence');
    const [read] = judgeBar(
      played(
        [
          [1.4, 69],
          [5.3, 72],
          [9.4, 76],
        ],
        'read',
      ),
      0,
      A_MINOR,
    );
    expect(taken([read!, near!])?.source).toBe('nearest');
  });
});

describe('the confidence of a judgement', () => {
  const at = (jitter: number, source = 'a hand') =>
    played(
      range(6).map(
        (i) => [4 * i + (i % 2 ? jitter : -jitter), 60 + ((i * 3) % 7)] as [number, number],
      ),
      source,
    ).map((n) => ({ ...n, position: n.position + 16 }));
  const confidenceOf = (notes: HeardNote[]) => {
    const j = judgeBar(notes, 1, A_MINOR).find((x) => x.kind === 'motif');
    return j?.kind === 'motif' ? j.confidence : undefined;
  };

  it('is 1 for a hand exactly on its places, and absent from the nearest step’s reading', () => {
    expect(confidenceOf(at(0))).toBe(1);
    const nearest = judgeBar(at(0), 1, A_MINOR, 'nearest')[0]!;
    expect(nearest.kind === 'motif' && nearest.confidence).toBeUndefined();
  });

  it('falls as a hand gets looser, and stays between 0 and 1', () => {
    const levels = [0, 0.1, 0.2, 0.3, 0.4].map((j) => confidenceOf(at(j))!);
    levels.forEach((c, i) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      if (i > 0) expect(c).toBeLessThanOrEqual(levels[i - 1]!);
    });
    expect(levels[4]!).toBeLessThan(levels[0]!);
  });

  it('is a whole number of hundredths, so it travels as it was judged', () => {
    for (const j of [0.13, 0.27, 0.41]) {
      const c = confidenceOf(at(j))!;
      expect(Math.round(c * 100) / 100).toBe(c);
    }
  });
});

/** A melody of three notes in `bar`, from `source`, starting on `note`. */
const phrase = (bar: number, source = 'the computer keys', note = 69): HeardNote[] =>
  played(
    [
      [16 * bar, note],
      [16 * bar + 4, note + 3],
      [16 * bar + 8, note + 7],
    ],
    source,
  );

/** The Muse run over bars from 0, each with the notes heard in it and whether it was asked to forget. */
function listen(bars: { heard?: HeardNote[]; forget?: boolean }[]) {
  const script: Script<MuseEnv, MuseInput> = bars.map(({ heard = [], forget = false }, bar) => ({
    env: { bar },
    input: { judgements: judgeBar(heard, bar, A_MINOR), forget },
  }));
  let carried: MuseCarried = muse.initial;
  const outputs = script.map(({ env, input }) => {
    const next = muse.advance(env, carried, input);
    carried = next.carried;
    return next.output;
  });
  return { script, outputs };
}

describe('the Muse', () => {
  it('keeps the machine laws, over playing, silence and a forget (F1)', () => {
    const { script } = listen([
      {},
      { heard: phrase(1) },
      { heard: played(range(13).map((i) => [32 + i, 60 + i])) },
      { forget: true },
      { heard: [...phrase(4, 'a'), ...phrase(4, 'b')] },
      ...range(20).map(() => ({})),
    ]);
    expect(lawBreaks(muse, script)).toEqual([]);
  });

  it('offers the motif it takes, with the source and the bar it was heard in (A3)', () => {
    const { outputs } = listen([{}, { heard: phrase(1, 'a MIDI port') }]);
    expect(outputs[0]).toEqual({ bar: 0, judgements: [], offer: null, forgot: null });
    expect(outputs[1]).toEqual({
      bar: 1,
      judgements: [expect.objectContaining({ kind: 'motif', source: 'a MIDI port' })],
      offer: {
        source: 'a MIDI port',
        bar: 1,
        motif: plain([0, 4, 8], [0, 2, 4]),
        level: 100,
      },
      forgot: null,
    });
  });

  it('offers the player’s level beside the motif, as the reading of their style', () => {
    const { outputs } = listen([{ heard: struck(phrase(0), [60, 40, 50]) }]);
    expect(outputs[0]!.offer).toMatchObject({ level: 50, motif: { accents: [10, -10, 0] } });
  });

  it('keeps its offer through bars that give no motif, and replaces it with the next motif taken', () => {
    const { outputs } = listen([
      { heard: phrase(0, 'first') },
      { heard: played([[16, 60]]) },
      {},
      { heard: phrase(3, 'second', 72) },
    ]);
    expect(outputs.map((o) => o.offer?.source ?? null)).toEqual([
      'first',
      'first',
      'first',
      'second',
    ]);
    expect(outputs[1]!.judgements).toEqual([
      { kind: 'too few', source: 'the computer keys', count: 1 },
    ]);
    expect(outputs[3]!.offer!.bar).toBe(3);
  });

  it('forgets its offer once nobody has played for 16 bars, and not a bar sooner (C9)', () => {
    // Notes that give no motif still count as playing.
    const { outputs } = listen([
      { heard: phrase(0) },
      { heard: played([[16, 60]]) },
      ...range(17).map(() => ({})),
    ]);
    const forgotAt = outputs.findIndex((o) => o.forgot !== null);
    expect(forgotAt).toBe(1 + 17);
    expect(outputs[forgotAt]).toMatchObject({ offer: null, forgot: 'silence' });
    expect(outputs[forgotAt - 1]!.offer).not.toBeNull();
    expect(outputs.slice(forgotAt + 1).every((o) => o.forgot === null)).toBe(true);
  });

  it('forgets when asked, and still takes a motif heard in the same bar', () => {
    const { outputs } = listen([
      { heard: phrase(0, 'first') },
      { forget: true },
      { forget: true },
      { heard: phrase(3, 'second'), forget: true },
      { heard: phrase(4, 'third'), forget: true },
    ]);
    expect(outputs[1]).toMatchObject({ offer: null, forgot: 'asked' });
    expect(outputs[2]).toMatchObject({ offer: null, forgot: null });
    expect(outputs[3]).toMatchObject({ offer: { source: 'second' }, forgot: null });
    expect(outputs[4]).toMatchObject({ offer: { source: 'third' }, forgot: 'asked' });
  });

  it('judges only the bar it is at, whatever else it is given', () => {
    const { outputs } = listen([{ heard: [...phrase(0), ...phrase(1)] }, { heard: phrase(0) }]);
    expect(outputs[0]!.judgements).toHaveLength(1);
    expect(outputs[1]).toMatchObject({ judgements: [], offer: { bar: 0 } });
  });
});
