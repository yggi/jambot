import { describe, expect, it } from 'vitest';
import { GRADES, gradeGain } from './grades.ts';

describe('the accent slider', () => {
  it('spreads the grades with the slider: only the downbeat stands out at none, each its own level at all, the downbeat never moving', () => {
    for (const grade of GRADES.slice(1)) expect(gradeGain(grade, 0)).toBe(gradeGain('between', 0));
    const at1 = GRADES.map((grade) => gradeGain(grade, 1));
    expect(at1).toEqual([...at1].sort((a, b) => b - a));
    expect(new Set(at1).size).toBe(GRADES.length);
    for (const amount of [0, 0.25, 0.5, 0.75])
      expect(gradeGain('downbeat', amount)).toBe(gradeGain('downbeat', amount + 0.25));
    const spread = (amount: number) =>
      Math.max(...GRADES.map((g) => gradeGain(g, amount))) -
      Math.min(...GRADES.map((g) => gradeGain(g, amount)));
    for (const amount of [0, 0.25, 0.5, 0.75])
      expect(spread(amount + 0.25)).toBeGreaterThan(spread(amount));
  });
});
