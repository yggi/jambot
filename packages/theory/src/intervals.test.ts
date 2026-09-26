import { describe, expect, it } from 'vitest';
import { even } from './even.ts';
import { INTERVALS, parseDegreeName, parseInterval, partial, sizes } from './intervals.ts';

const diatonic = even(7, 12);

describe('sizes', () => {
  it('comes from the diatonic set: every generic interval has one size or two sizes a semitone apart', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map((generic) => sizes(diatonic, generic))).toEqual([
      [0],
      [1, 2],
      [3, 4],
      [5, 6],
      [6, 7],
      [8, 9],
      [10, 11],
      [12],
    ]);
  });

  it('works on any helix: the seconds of the major pentatonic are 2 and 3', () => {
    expect(sizes({ cycle: 12, heights: [0, 2, 4, 7, 9] }, 1)).toEqual([2, 3]);
    expect(sizes(even(5, 16), 2)).toEqual([6, 7]);
  });
});

describe('parseInterval', () => {
  it('reads the specific intervals in short and long form', () => {
    const cases: [string, number, number][] = [
      ['P1', 0, 0],
      ['unison', 0, 0],
      ['m2', 1, 1],
      ['minor second', 1, 1],
      ['semitone', 1, 1],
      ['half step', 1, 1],
      ['M2', 1, 2],
      ['major second', 1, 2],
      ['whole step', 1, 2],
      ['m3', 2, 3],
      ['M3', 2, 4],
      ['P4', 3, 5],
      ['perfect fourth', 3, 5],
      ['A4', 3, 6],
      ['augmented fourth', 3, 6],
      ['TT', 3, 6],
      ['tritone', 3, 6],
      ['d5', 4, 6],
      ['diminished fifth', 4, 6],
      ['P5', 4, 7],
      ['Perfect Fifth', 4, 7],
      ['m6', 5, 8],
      ['M6', 5, 9],
      ['m7', 6, 10],
      ['M7', 6, 11],
      ['P8', 7, 12],
      ['octave', 7, 12],
    ];
    for (const [text, generic, specific] of cases)
      expect(parseInterval(text), text).toEqual({ generic, specific: [specific] });
  });

  it('reads generic intervals as both of their sizes', () => {
    expect(parseInterval('second')).toEqual({ generic: 1, specific: [1, 2] });
    expect(parseInterval('3rd')).toEqual({ generic: 2, specific: [3, 4] });
    expect(parseInterval('Major 3rd')).toEqual({ generic: 2, specific: [4] });
    expect(parseInterval('Fifth')).toEqual({ generic: 4, specific: [6, 7] });
    expect(parseInterval('seventh')).toEqual({ generic: 6, specific: [10, 11] });
  });

  it('keeps every specific interval inside the sizes of its generic interval', () => {
    for (const interval of Object.values(INTERVALS)) {
      for (const size of interval.specific)
        expect(sizes(diatonic, interval.generic)).toContain(size);
    }
  });

  it('tells m and M apart, and rejects what is not an interval', () => {
    expect(parseInterval('m3')!.specific).toEqual([3]);
    expect(parseInterval('M3')!.specific).toEqual([4]);
    for (const text of ['', 'P3', 'M5', 'minor fifth', 'ninth-ish', 'C'])
      expect(parseInterval(text), text).toBeUndefined();
  });
});

describe('partial', () => {
  it('places the n-th partial of the harmonic series on the nearest semitone', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(partial)).toEqual([0, 12, 19, 24, 28, 31, 34, 36]);
  });
});

describe('parseDegreeName', () => {
  it('names the degrees by function, as generic intervals above the tonic', () => {
    const cases: [string, number][] = [
      ['tonic', 0],
      ['supertonic', 1],
      ['mediant', 2],
      ['subdominant', 3],
      ['dominant', 4],
      ['submediant', 5],
    ];
    for (const [text, generic] of cases)
      expect(parseDegreeName(text), text).toEqual({ generic, specific: sizes(diatonic, generic) });
  });

  it('names the seventh degree by its size', () => {
    expect(parseDegreeName('leading tone')).toEqual({ generic: 6, specific: [11] });
    expect(parseDegreeName('Leading-note')).toEqual({ generic: 6, specific: [11] });
    expect(parseDegreeName('subtonic')).toEqual({ generic: 6, specific: [10] });
    expect(parseDegreeName('fifth')).toBeUndefined();
  });
});
