import { heightOf } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, type Key, keyHelix } from './key.ts';
import { type Script, lawBreaks } from './machine.ts';
import {
  type HeardNote,
  MUSE,
  type MuseCarried,
  type MuseEnv,
  type MuseInput,
  heardIn,
  judgeBar,
  muse,
  taken,
} from './muse.ts';

const range = (n: number) => [...Array(n).keys()];
const keys: Key[] = COMPOSER_MODES.flatMap((mode) => range(12).map((tonic) => ({ tonic, mode })));
const A_MINOR: Key = { tonic: 9, mode: 'aeolian' };

/** Notes from one source in bar 0, one per `[step, note]`. */
const played = (notes: [number, number][], source = 'the computer keys'): HeardNote[] =>
  notes.map(([position, note]) => ({ note, velocity: 100, source, position, end: null }));

const judgeOne = (notes: HeardNote[], key = A_MINOR) => {
  const judgements = judgeBar(notes, 0, key);
  expect(judgements).toHaveLength(1);
  return judgements[0]!;
};

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
      motif: { span: 16, steps: [0, 4, 8], degrees: [0, 2, 1] },
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
        motif: { span: 16, steps: [0, 3, 6, 9, 12], degrees: shape },
      });
    }
  });

  it('gives back every note in the key, and moves every note off it to its nearest degree, ties going down (#7 (d), ahead of the evidence)', () => {
    // The prototype's rule, taken until (d) decides whether a motif carries
    // altered degrees: of the 12 notes of an octave, the 5 off a diatonic key
    // come back as a neighbour. Counted here, so the choice has its measure.
    let moved = 0;
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
        const back = heightOf(scale, 35 + judgement.motif.degrees[1]!);
        const inKey = scale.heights.some((h) => (h - note) % 12 === 0);
        if (inKey) expect(back).toBe(note);
        else {
          expect(Math.abs(back - note)).toBe(1);
          moved++;
        }
        const below = heightOf(scale, 35 + judgement.motif.degrees[1]! - 1);
        if (!inKey && below === note - 1 && back === note + 1) throw new Error('a tie went up');
      }
    }
    expect(moved).toBe(5 * keys.length);
  });

  it('puts each note on the step nearest where it was heard', () => {
    const judgement = judgeOne(
      played([
        [0.4, 69],
        [3.6, 72],
        [8.49, 76],
        [11.49, 74],
      ]),
    );
    expect(judgement).toMatchObject({ motif: { steps: [0, 4, 8, 11] } });
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
    expect(first).toMatchObject({ motif: { steps: [0, 4, 8] } });
    const [second] = judgeBar(notes, 1, A_MINOR);
    expect(second).toMatchObject({ motif: { steps: [0, 4, 8, 12] } });
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
        motif: { span: 16, steps: [2, 6, 10], degrees: [0, 1, 2] },
      },
      {
        kind: 'motif',
        source: 'the on-screen keys',
        motif: { span: 16, steps: [0, 4, 8], degrees: [0, 2, 4] },
      },
    ]);
  });

  it('takes the motif with the most notes, the first to arrive on a tie, and none when none is a motif (A3)', () => {
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
    env: { bar, key: A_MINOR },
    input: { heard, forget },
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
        motif: { span: 16, steps: [0, 4, 8], degrees: [0, 2, 4] },
      },
      forgot: null,
    });
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

  it('forgets its offer once nobody has played for 16 bars, and not a bar sooner', () => {
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
