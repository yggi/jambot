import { describe, expect, it } from 'vitest';
import { fifthsIndex } from './circle.ts';

const range = (n: number) => [...Array(n).keys()];

describe('fifthsIndex', () => {
  it('lays out C, G, D, A, E, B, F♯, D♭, A♭, E♭, B♭, F clockwise: the standard circle of fifths', () => {
    // pitch class 0..11, C=0 ... B=11, read off in wheel order (index 0..11).
    const byIndex = range(12).map(() => -1);
    for (const pitchClass of range(12)) byIndex[fifthsIndex(pitchClass)] = pitchClass;
    expect(byIndex).toEqual([0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]);
  });

  it('is a permutation of the 12 pitch classes: every index hit exactly once', () => {
    const indices = range(12).map(fifthsIndex);
    expect(new Set(indices).size).toBe(12);
    for (const index of indices) expect(index).toBeGreaterThanOrEqual(0);
    for (const index of indices) expect(index).toBeLessThan(12);
  });

  it('is its own inverse: applying it twice returns the pitch class, for every pitch class', () => {
    for (const pitchClass of range(12))
      expect(fifthsIndex(fifthsIndex(pitchClass))).toBe(pitchClass);
  });

  it('steps by a fifth (7 semitones) per index, for every pitch class', () => {
    for (const pitchClass of range(12)) {
      expect(fifthsIndex((pitchClass + 7) % 12)).toBe((fifthsIndex(pitchClass) + 1) % 12);
    }
  });
});
