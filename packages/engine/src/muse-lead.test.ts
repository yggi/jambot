import { describe, expect, it } from 'vitest';
import type { Key } from './key.ts';
import type { LeadNote } from './lead-query.ts';
import type { Judgement } from './muse.ts';
import { distilledLead, heardLead, leadOf, motifNotes } from './muse-lead.ts';

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

  it('distils the pattern most bars play, the first bar playing it, ties to the earliest, none under three notes', () => {
    const a = [note(0, 0), note(4, 2), note(8, 4)];
    const b = [note(0, 0), note(4, 1), note(8, 2)];
    expect(distilledLead([b, a, a, b, a])).toBe([b, a, a, b, a][1]);
    expect(distilledLead([b, a])).toBe(b);
    expect(distilledLead([[note(0, 0), note(8, 2)]])).toBeNull();
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
  });
});
