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
    expect(at.get(20)).toMatchObject({ recognised: 133, readBoth: 132 });
    expect(at.get(30)).toMatchObject({ recognised: 44, readBoth: 41 });
  });
});

describe('the cells of the lead’s phrases, E20 and #207 M1 (#207, Q12)', () => {
  it('hears the shape the lead returns to, but its variations, fitted to the chords, rarely as an exact operator on it (Q12)', () => {
    const lead = leadCells();
    expect(lead).toMatchObject({ phrases: 385, joined: 385, later: 1155, repeated: 443, underOp: 45 });
    expect(lead.orders[0]).toEqual(['A B A C', 240]);
  });
});
