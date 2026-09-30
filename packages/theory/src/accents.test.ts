import { describe, expect, it } from 'vitest';
import { ACCENT_GRADES, accentLine, accentsOf } from './accents.ts';
import { type Meter, METERS } from './meter.ts';

/** Every named meter's accent line, by hand, an eighth to a symbol: the ground truth `accentLine` is checked against. */
const LINES: Record<keyof typeof METERS, string> = {
  '3/4': '* . + . + .',
  '4/4': '* . - . + . - .',
  '5/4': '* . - . - . + . - .',
  '5/8': '* . . + .',
  '6/8': '* . . + . .',
  '7/8': '* . . + . + .',
  '9/8': '* . . + . . + . .',
  '10/8': '* . . - . . + . - .',
  '12/8': '* . . - . . + . . - . .',
};

const meters = Object.entries(METERS) as [keyof typeof METERS, Meter][];

describe('the accent grades', () => {
  it('write every named meter as its accent line, against the lines written out by hand (finite: every meter)', () => {
    for (const [name, meter] of meters)
      expect([name, accentLine(meter)]).toEqual([name, LINES[name]]);
  });

  it('grade the downbeat alone as such, in every meter, and never a pulse below the downbeat’s grade', () => {
    for (const [, meter] of meters) {
      const grades = accentsOf(meter);
      expect(grades).toHaveLength(meter.cycle);
      expect(grades[0]).toBe('downbeat');
      expect(grades.slice(1)).not.toContain('downbeat');
      meter.heights.slice(1).forEach((height) => expect(grades[height]).not.toBe('between'));
    }
  });

  it('gives the bar’s children a half each but the first, as many as it has: a flat root of two or three pulses, two halves of four or more (finite: every meter)', () => {
    for (const [name, meter] of meters) {
      const halves = accentsOf(meter).filter((g) => g === 'half').length;
      const pulses = meter.heights.length;
      expect([name, halves]).toEqual([name, pulses <= 3 ? pulses - 1 : 1]);
    }
  });

  it('counts from the root: the same pulse is a half in 6/8 and a pulse below one in 12/8', () => {
    expect(accentsOf(METERS['6/8'])[3]).toBe('half');
    expect(accentsOf(METERS['12/8'])[3]).toBe('pulse');
    expect(accentsOf(METERS['12/8'])[6]).toBe('half');
    expect(accentsOf(METERS['3/4'])[2]).toBe('half');
    expect(accentsOf(METERS['4/4'])[2]).toBe('pulse');
  });

  it('mirrors the grouping only where a run of five pulses has two ways: 5/4 as 3+2 or 2+3, the grades the same in number (finite: every meter)', () => {
    for (const [name, meter] of meters) {
      const same = accentLine(meter, true) === accentLine(meter);
      expect([name, same]).toEqual([name, name !== '5/4']);
      const counts = (mirrored: boolean) =>
        ACCENT_GRADES.map((g) => accentsOf(meter, mirrored).filter((x) => x === g).length);
      expect(counts(true)).toEqual(counts(false));
    }
    expect(accentLine(METERS['5/4'], true)).toBe('* . - . + . - . - .');
  });
});
