import { describe, expect, it } from 'vitest';
import { type Placed, readSequence, writeSequence } from './mini.ts';

const range = (n: number) => [...Array(n).keys()];

/** Every set of steps of a bar of 16 that holds step 0, as words starting there. */
const everyPlacing = (steps: number): Placed[][] =>
  range(2 ** (steps - 1)).map((bits) =>
    range(steps)
      .filter((s) => s === 0 || bits & (1 << (s - 1)))
      .map((step) => ({ word: `w${step}`, step })),
  );

describe('a sequence', () => {
  it('reads back every placing of words on a bar of 16 steps as it was written (Q1a)', () => {
    const placings = everyPlacing(16);
    expect(placings).toHaveLength(32768);
    for (const placed of placings) {
      const text = writeSequence(placed, 16);
      expect(readSequence(text, 16)).toEqual({ placed });
    }
  });

  it('writes the smallest whole weights, @1 left out, so a text is written in one form (Q1a, F3)', () => {
    expect(writeSequence([{ word: 'i', step: 0 }], 16)).toBe('i');
    expect(
      writeSequence(
        [
          { word: 'i', step: 0 },
          { word: 'VI', step: 8 },
        ],
        16,
      ),
    ).toBe('i VI');
    expect(
      writeSequence(
        [
          { word: 'i', step: 0 },
          { word: 'VI', step: 12 },
        ],
        16,
      ),
    ).toBe('i@3 VI');
    for (const text of ['i@2 VI@2', 'i@4 VI@4', '  i   VI ']) {
      const read = readSequence(text, 16);
      expect(read).toHaveProperty('placed');
      if ('placed' in read) expect(writeSequence(read.placed, 16)).toBe('i VI');
    }
  });

  it('refuses a text whose words land between steps, or with no whole weight', () => {
    expect(readSequence('i i i', 16)).toEqual({
      problems: ['"i" starts between steps, at 5.33', '"i" starts between steps, at 10.67'],
    });
    expect(readSequence('i@0 V', 16)).toEqual({
      problems: ['"i@0" is not a word with a whole weight'],
    });
    expect(readSequence('i@1.5 V', 16)).toHaveProperty('problems');
    expect(readSequence('   ', 16)).toEqual({ problems: ['the sequence is empty'] });
  });

  it('refuses to write words that do not start on step 0 or do not rise within the bar', () => {
    expect(() => writeSequence([], 16)).toThrow('at least one word');
    expect(() => writeSequence([{ word: 'i', step: 4 }], 16)).toThrow('step 0');
    const falling = [
      { word: 'i', step: 0 },
      { word: 'V', step: 8 },
      { word: 'iv', step: 4 },
    ];
    expect(() => writeSequence(falling, 16)).toThrow('rise');
    expect(() =>
      writeSequence(
        [
          { word: 'i', step: 0 },
          { word: 'V', step: 16 },
        ],
        16,
      ),
    ).toThrow('rise');
    expect(() => writeSequence([{ word: 'a b', step: 0 }], 16)).toThrow('not a word');
  });
});
