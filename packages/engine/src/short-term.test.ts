import { describe, expect, it } from 'vitest';
import {
  NO_SHORT_TERM,
  SHORT_TERM_DECAY,
  SHORT_TERM_FLOOR,
  chosenOf,
  remembered,
} from './short-term.ts';
import { timeConstant } from './fading.ts';

describe('the composer’s short-term memory (#401)', () => {
  it('keeps a fragment kept at one section in mind for the next two, then lets it go', () => {
    let memory = remembered(NO_SHORT_TERM, ['5/4'], 1);
    const weights: number[] = [];
    for (let section = 1; section <= 4; section++) {
      memory = remembered(memory, []);
      weights.push(memory.find((m) => m.id === '5/4')?.weight ?? 0);
    }
    expect(weights).toEqual([0.5, 0.25, 0, 0]);
    expect([timeConstant(SHORT_TERM_DECAY), SHORT_TERM_FLOOR]).toEqual([2, 0.25]);
  });

  it('adds to a fragment in mind, and takes a new one in at the end, in the order they entered', () => {
    const memory = remembered(remembered(NO_SHORT_TERM, ['a', 'b'], 1), ['b', 'c']);
    expect(memory).toEqual([
      { id: 'a', weight: 0.5 },
      { id: 'b', weight: 1.5 },
      { id: 'c', weight: 1 },
    ]);
    expect(chosenOf(memory)).toEqual(['a', 'b', 'c']);
  });

  it('chooses nothing from an empty memory, and leaves the one given unchanged', () => {
    expect(chosenOf(remembered(NO_SHORT_TERM, []))).toEqual([]);
    const memory = remembered(NO_SHORT_TERM, ['a'], 1);
    remembered(memory, ['b']);
    expect(memory).toEqual([{ id: 'a', weight: 1 }]);
  });
});
