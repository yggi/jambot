import { describe, expect, it } from 'vitest';
import { leadCells, repetition } from './recognition.ts';

// The numbers are literals, to be raised by the step that improves them.
describe('repetition heard by the Muse, E20 and #204 H8 (#204, Q12)', () => {
  const at = new Map([0, 20, 30].map((s) => [s, repetition(s)]));

  it('recognises every pattern a hand plays twice exactly, and no other pattern as it, at any looseness (Q12)', () => {
    expect(at.get(0)).toMatchObject({ repeats: 178, recognised: 178, readBoth: 178 });
    for (const r of at.values()) expect([r.strangers, r.falseAlarms]).toEqual([157, 0]);
  });

  it('recognises a loose hand’s repeat only as often as it reads both playings right, which falls fast (Q12)', () => {
    expect(at.get(20)).toMatchObject({ recognised: 136, readBoth: 133 });
    expect(at.get(30)).toMatchObject({ recognised: 62, readBoth: 59 });
  });
});

describe('the cells of the lead’s phrases, E20 and #207 M1 (#207, Q12)', () => {
  it('hears the shape the lead returns to, but its variations, fitted to the chords, rarely as an exact operator on it (Q12)', () => {
    const lead = leadCells();
    // (385 phrases, all joined, 1155 later, 443 repeated, 45 under an operator, 240 of A B A C before #655's song forms;
    // 352, 352, 1056, 366 repeated and 220 of A B A C before cells v0.30.0, whose jazz solos play hotter and without the
    // pad)
    expect(lead).toMatchObject({
      phrases: 354,
      joined: 354,
      later: 1062,
      repeated: 365,
      underOp: 42,
    });
    expect(lead.orders[0]).toEqual(['A B A C', 214]);
  });
});
