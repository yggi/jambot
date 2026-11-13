import { describe, expect, it } from 'vitest';
import type { Key } from './key.ts';
import type { LeadNote } from './lead-query.ts';
import type { Judgement } from './muse.ts';
import { METERS } from '@jambot/theory';
import { writtenOut } from '@yggi/cells/repository/decompose';
import { readLead } from './lead-lines.ts';
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
    expect(distilledLead(alone([b, a, a, b, a]), 16)).toEqual({ notes: a });
    expect(distilledLead(alone([b, a]), 16)).toEqual({ notes: b });
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
    const { notes } = distilledLead([alone, ...TWINKLE], 16)!;
    expect(notes).toHaveLength(14);
    expect(notes.at(-1)).toEqual(note(28, 0));
  });
});

/**
 * A tune as the Muse hears it played whole, bar by bar: cells' form over the seed's motifs written out (`writtenOut`),
 * read back as the key's degrees, and each bar as she judges it, its degrees from its first note and that note's place
 * in the key its origin (the tonic in A4's octave, 35).
 */
function heardWhole(text: string): LeadBar[] {
  const line = writtenOut(text, 'song', '4/4', 'lead')!;
  const read = readLead(line, METERS['4/4'])!;
  return Array.from({ length: read.bars }, (_, bar) => {
    const notes = read.notes.filter((n) => n.step >= 16 * bar && n.step < 16 * (bar + 1));
    const first = notes[0]!.degree;
    return {
      bar: 8 + bar,
      origin: 35 + first,
      notes: notes.map((n) => ({ ...n, step: n.step - 16 * bar, degree: n.degree - first })),
    };
  });
}

describe('a player’s run that is a form over the seed’s motifs, filed as it (#580, rung 4)', () => {
  it('files Twinkle played whole, six bars, as ternary over twinkle, its answer wonder, in the key’s own degrees', () => {
    const bars = heardWhole(
      '&twinkle from kinderlied &key\n&wonder from kinderlied &key\n&song from ternary(answer=&wonder) &twinkle',
    );
    const line = distilledLead(bars, 16, '4/4')!;
    expect(line.text).toBe(
      [
        '&twinkle from kinderlied &key',
        '&wonder from kinderlied &key',
        '&lead from ternary(answer=&wonder) &twinkle',
      ].join('\n'),
    );
    // (its notes, each degree from its first, the six bars rung 3 would have played)
    expect(line.notes).toHaveLength(42);
    expect(readLead(line.text!, METERS['4/4'])!.bars).toBe(6);
  });

  it('files Hänschen klein played whole, eight bars from the fifth, as rounded binary over haenschen, its answers and bridge the tune’s', () => {
    const bars = heardWhole(
      [
        '&haenschen from kinderlied &key',
        '&hinein from kinderlied &key',
        '&heim from kinderlied &key',
        '&weinet from kinderlied &key',
        '&song from rounded_binary(answer=&hinein, close=&heim, bridge=&weinet) &haenschen',
      ].join('\n'),
    );
    expect(bars[0]!.origin).toBe(39);
    expect(distilledLead(bars, 16, '4/4')?.text).toBe(
      [
        '&haenschen from kinderlied &key',
        '&hinein from kinderlied &key',
        '&heim from kinderlied &key',
        '&weinet from kinderlied &key',
        '&lead from rounded_binary(answer=&hinein, close=&heim, bridge=&weinet) &haenschen',
      ].join('\n'),
    );
  });

  it('files a run that is no form as rung 3 does, and tries no form without a meter, or for a bar alone', () => {
    // (four bars that repeat nothing: no form says them in less than the line)
    const bars = heardWhole(
      '&song over=&key step=8n 0 2 4 2 0 1 3 5 6 4 2 1 -1 0 3 2 1 5 2 6 0 4 3 -2 2 0 -3 1 4 6 5 3',
    );
    expect(distilledLead(bars, 16, '4/4')).toEqual(distilledLead(bars, 16));
    expect(distilledLead(bars, 16)?.text).toBeUndefined();
    expect(distilledLead(TWINKLE.slice(0, 1), 16, '4/4')?.text).toBeUndefined();
  });
});
