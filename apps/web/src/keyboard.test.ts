import { describe, expect, it } from 'vitest';
import { scaleLayout } from './keyboard.ts';

describe('the keyboard locked to a scale', () => {
  it('has a key for each note of the scale alone, each as wide, filling the width', () => {
    const keys = scaleLayout(60, 76, [9, 11, 0, 2, 4, 5, 7]);
    expect(keys.map((k) => k.note)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 76]);
    for (const [i, key] of keys.entries()) {
      expect(key.black).toBe(false);
      expect(key.width).toBeCloseTo(10, 12);
      expect(key.left).toBeCloseTo(i * 10, 12);
    }
  });

  it('has the pentatonic’s five to an octave', () => {
    expect(scaleLayout(60, 71, [9, 0, 2, 4, 7]).map((k) => k.note % 12)).toEqual([0, 2, 4, 7, 9]);
  });
});
