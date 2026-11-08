import { describe, expect, it } from 'vitest';
import type { Key } from './key.ts';
import type { LeadNote } from './lead-query.ts';
import type { Judgement } from './muse.ts';
import {
  type LeadBar,
  PHRASE_BARS,
  PHRASE_SLIPS,
  distilledLead,
  heardLead,
  leadOf,
  motifNotes,
  phrasesOfLead,
} from './muse-lead.ts';

const A_MINOR: Key = { tonic: 9, mode: 'aeolian' };
const note = (step: number, degree: number, alter = 0): LeadNote => ({ step, degree, alter });

describe('the Muse’s ear for lead lines (#424)', () => {
  it('reads a bar’s notes as degrees of the key from the first, the top note on a step, a note off the key altered', () => {
    // A, C, B and an E under the G below on one step, then an E♭, as a numeral writes it: ♭5
    const notes = [69, 72, 71, 64, 67, 75].map((n, i) => ({
      step: [0, 4, 6, 8, 8, 12][i]!,
      note: n,
    }));
    expect(leadOf(notes, A_MINOR)).toEqual([
      note(0, 0),
      note(4, 2),
      note(6, 1),
      note(8, -1),
      note(12, 4, -1),
    ]);
    expect(leadOf([], A_MINOR)).toEqual([]);
  });

  it('reads a judged motif’s notes, its rests left out', () => {
    expect(
      motifNotes({
        cycle: 16,
        onsets: [0, 4, 6, 9],
        degrees: [null, 0, 2, -1],
        accidentals: [0, 0, 0, -1],
      }),
    ).toEqual([note(4, 0), note(6, 2), note(9, -1, -1)]);
  });

  it('distils, of bars heard without an origin, the pattern most bars play, ties to the earliest, none under three notes', () => {
    const a = [note(0, 0), note(4, 2), note(8, 4)];
    const b = [note(0, 0), note(4, 1), note(8, 2)];
    const alone = (bars: (readonly LeadNote[])[]): LeadBar[] =>
      bars.map((notes, bar) => ({ bar, notes }));
    expect(distilledLead(alone([b, a, a, b, a]), 16)).toEqual(a);
    expect(distilledLead(alone([b, a]), 16)).toEqual(b);
    expect(distilledLead(alone([[note(0, 0), note(8, 2)]]), 16)).toBeNull();
  });

  it('hears each motif judged in a bar, of a source not heard as a bass there', () => {
    const motif = { cycle: 16, onsets: [0, 4, 8], degrees: [0, 2, 4], accidentals: [0, 0, 0] };
    const judgements: Judgement[] = [
      { kind: 'motif', source: 'Ada', motif, level: 90 },
      { kind: 'motif', source: 'Bo', motif, level: 90 },
      { kind: 'too few', source: 'Cy', count: 2 },
    ];
    expect(heardLead(judgements, 5, new Set(['Bo']))).toEqual([
      { source: 'Ada', bar: 5, notes: [note(0, 0), note(4, 2), note(8, 4)] },
    ]);
    // (a judgement that says where its first note sits in the key passes it on, #580 rung 3)
    expect(heardLead([{ kind: 'motif', source: 'Ada', motif, level: 90, origin: 4 }], 5)).toEqual([
      { source: 'Ada', bar: 5, notes: [note(0, 0), note(4, 2), note(8, 4)], origin: 4 },
    ]);
  });
});

/** Twinkle's first two bars as the Muse judges them, each from its first note, and where that note sits in the key. */
const TWINKLE: readonly LeadBar[] = [
  { bar: 8, origin: 0, notes: [0, 0, 4, 4, 5, 5, 4].map((d, i) => note(2 * i, d)) },
  { bar: 9, origin: 3, notes: [0, 0, -1, -1, -2, -2, -3].map((d, i) => note(2 * i, d)) },
];

describe('a player’s phrases, bars in a row joined by their origins (#580, rung 3)', () => {
  it('joins Twinkle’s two bars into one line of two bars, each note’s degree from the phrase’s first', () => {
    expect(phrasesOfLead(TWINKLE, 16)).toEqual([
      [
        ...[0, 0, 4, 4, 5, 5, 4].map((d, i) => note(2 * i, d)),
        ...[3, 3, 2, 2, 1, 1, 0].map((d, i) => note(16 + 2 * i, d)),
      ],
    ]);
  });

  it('keeps a bar without an origin, a bar after a gap, and a bar of under three notes apart', () => {
    const [one, two] = TWINKLE as [LeadBar, LeadBar];
    expect(phrasesOfLead([one, { ...two, origin: undefined }], 16)).toHaveLength(2);
    expect(phrasesOfLead([one, { ...two, bar: 10 }], 16)).toHaveLength(2);
    expect(phrasesOfLead([one, { ...two, notes: two.notes.slice(0, 2) }], 16)).toEqual([one.notes]);
  });

  it(`cuts a run every ${PHRASE_BARS} bars from where it starts`, () => {
    const run = Array.from({ length: 6 }, (_, k) => ({
      bar: k,
      origin: k,
      notes: TWINKLE[0]!.notes,
    }));
    expect(phrasesOfLead(run, 16).map((p) => Math.floor(p.at(-1)!.step / 16) + 1)).toEqual([
      PHRASE_BARS,
      2,
    ]);
  });

  it('takes a phrase that plays its first bars again and again, in the same place in the key, as those bars', () => {
    const [one, two] = TWINKLE as [LeadBar, LeadBar];
    const again = [one, two, { ...one, bar: 10 }, { ...two, bar: 11 }];
    expect(phrasesOfLead(again, 16)).toEqual(phrasesOfLead(TWINKLE, 16));
    const same = [8, 9, 10, 11].map((bar) => ({ ...one, bar }));
    expect(phrasesOfLead(same, 16)).toEqual([one.notes]);
    // (the same bar a degree higher each time is a phrase, not a repeat)
    const rising = [8, 9, 10].map((bar, k) => ({ ...one, bar, origin: k }));
    expect(phrasesOfLead(rising, 16)[0]).toHaveLength(3 * one.notes.length);
  });

  it(`takes a phrase played twice with a slip of up to ${PHRASE_SLIPS} notes as played again, each bar the surer playing`, () => {
    const [one, two] = TWINKLE as [LeadBar, LeadBar];
    // (the first bar's third note a step late in its first playing, read less surely)
    const slipped = {
      ...one,
      confidence: 0.6,
      notes: one.notes.map((n, i) => (i === 2 ? { ...n, step: 5 } : n)),
    };
    const again = [slipped, two, { ...one, bar: 10, confidence: 0.9 }, { ...two, bar: 11 }];
    expect(phrasesOfLead(again, 16)).toEqual(phrasesOfLead(TWINKLE, 16));
    // (a bar played another way, past the slips, is another bar: the four bars a phrase)
    const other = {
      ...one,
      bar: 10,
      notes: one.notes.map((n) => ({ ...n, degree: n.degree + 1 })),
    };
    expect(phrasesOfLead([one, two, other, { ...two, bar: 11 }], 16)[0]).toHaveLength(4 * 7);
  });

  it('distils the phrase played most, ties to the longer: Twinkle’s two bars over a bar heard once alone', () => {
    const alone: LeadBar = { bar: 2, notes: [note(0, 0), note(4, 1), note(8, 2)] };
    const line = distilledLead([alone, ...TWINKLE], 16)!;
    expect(line).toHaveLength(14);
    expect(line.at(-1)).toEqual(note(28, 0));
  });
});
