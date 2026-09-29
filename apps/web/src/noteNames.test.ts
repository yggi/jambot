// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { scaleNoteNames, TONIC_NAMES } from './noteNames.ts';

describe('scaleNoteNames', () => {
  it('names A aeolian ascending from its tonic: A B C D E F G', () => {
    expect(scaleNoteNames([0, 2, 4, 5, 7, 9, 11], 9)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('names C ionian ascending from its tonic, already first: C D E F G A B', () => {
    expect(scaleNoteNames([0, 2, 4, 5, 7, 9, 11], 0)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('is a permutation of the scale it names, starting at the tonic, for every tonic in it', () => {
    const cIonian = [0, 2, 4, 5, 7, 9, 11];
    for (const tonic of cIonian) {
      const names = scaleNoteNames(cIonian, tonic);
      expect(names[0]).toBe(TONIC_NAMES[tonic]);
      expect(new Set(names)).toEqual(new Set(cIonian.map((pc) => TONIC_NAMES[pc])));
    }
  });
});
