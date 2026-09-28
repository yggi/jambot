/**
 * L4 pinned as a running test, not prose: every placing a sequence can write
 * agrees with `@strudel/mini` on where its words start, and `:` does not —
 * Strudel reads it as a sample bank index (a value pair), never a bare word,
 * so a mark that reuses `:` collides with Strudel's own grammar (#11).
 */
import { mini } from '@strudel/mini';
import { describe, expect, it } from 'vitest';
import { type Placed, writeSequence } from './mini.ts';

const range = (n: number) => [...Array(n).keys()];

/** Every set of steps of a bar of 8 that holds step 0, as words starting there. */
const everyPlacing = (steps: number): Placed[][] =>
  range(2 ** (steps - 1)).map((bits) =>
    range(steps)
      .filter((s) => s === 0 || bits & (1 << (s - 1)))
      .map((step) => ({ word: `w${step}`, step })),
  );

/** A mini-notation text's words, as `@strudel/mini` places them on a bar of `steps`. */
function strudelPlaced(text: string, steps: number): { step: number; value: unknown }[] {
  return mini(text)
    .queryArc(0, 1)
    .map((event) => ({ step: Math.round(Number(event.whole.begin) * steps), value: event.value }))
    .sort((a, b) => a.step - b.step);
}

describe('a sequence agrees with @strudel/mini on the shared grammar (L4)', () => {
  it('places every word of a bar of 8 on the step and with the word @strudel/mini gives it (L4)', () => {
    const placings = everyPlacing(8);
    expect(placings).toHaveLength(128);
    for (const placed of placings) {
      const theirs = strudelPlaced(writeSequence(placed, 8), 8);
      expect(theirs).toEqual(placed.map((p) => ({ step: p.step, value: p.word })));
    }
  });

  it("reads a word marked with ':' as a name and an index, not a word (L4 counterexample)", () => {
    expect(strudelPlaced('sd:2', 1)).toEqual([{ step: 0, value: ['sd', 2] }]);
    expect(strudelPlaced('sd:ghost', 1)).toEqual([{ step: 0, value: ['sd', 'ghost'] }]);
    expect(strudelPlaced('sd', 1)).toEqual([{ step: 0, value: 'sd' }]);
  });
});
