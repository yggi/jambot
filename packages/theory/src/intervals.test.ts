import { describe, expect, it } from 'vitest';
import { INTERVALS, genericSizes, parseInterval } from './intervals.ts';

describe('genericSizes', () => {
  it('comes from the diatonic set: every generic interval has one size or two sizes a semitone apart', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(genericSizes)).toEqual([
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
    for (const [text, steps, semitones] of cases)
      expect(parseInterval(text), text).toEqual({ steps, semitones: [semitones] });
  });

  it('reads generic intervals as both of their sizes', () => {
    expect(parseInterval('second')).toEqual({ steps: 1, semitones: [1, 2] });
    expect(parseInterval('3rd')).toEqual({ steps: 2, semitones: [3, 4] });
    expect(parseInterval('Fifth')).toEqual({ steps: 4, semitones: [6, 7] });
    expect(parseInterval('seventh')).toEqual({ steps: 6, semitones: [10, 11] });
  });

  it('keeps every specific interval inside the sizes of its generic interval', () => {
    for (const interval of Object.values(INTERVALS)) {
      for (const size of interval.semitones) expect(genericSizes(interval.steps)).toContain(size);
    }
  });

  it('tells m and M apart, and rejects what is not an interval', () => {
    expect(parseInterval('m3')!.semitones).toEqual([3]);
    expect(parseInterval('M3')!.semitones).toEqual([4]);
    for (const text of ['', 'P3', 'M5', 'minor fifth', 'ninth-ish', 'C'])
      expect(parseInterval(text), text).toBeUndefined();
  });
});
