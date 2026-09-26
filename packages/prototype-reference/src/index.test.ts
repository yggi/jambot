import { describe, expect, it } from 'vitest';
import { loadPrototype } from './index.ts';

describe('loadPrototype', () => {
  it('loads constants and arrow functions as the prototype defines them', () => {
    const { SCALES, euclidHit } = loadPrototype<{
      SCALES: Record<string, number[]>;
      euclidHit: (step: number, k: number, rotation: number) => boolean;
    }>(['SCALES', 'euclidHit']);
    expect(SCALES.major).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect([...Array(16).keys()].filter((s) => euclidHit(s, 5, 0))).toEqual([0, 4, 7, 10, 13]);
  });

  it('loads function declarations that contain regex literals, templates and comments', () => {
    // parseMini is full of regex literals with brackets, and template strings.
    const { evalMini } = loadPrototype<{
      evalMini: (src: string, cycle: number, span?: number) => { start: number; v: string }[];
    }>(['parseMini', 'evalMini']);
    expect(evalMini('bd(3,8)', 0, 8).map((e) => e.start)).toEqual([0, 3, 6]);
    expect(evalMini('<a b>', 1).map((e) => e.v)).toEqual(['b']);
  });

  it('passes stubs in for definitions that are not loaded', () => {
    const { rv } = loadPrototype<{ rv: (...keys: number[]) => number }>(['rv', 'rng', 'mulberry'], {
      S: { seed: 12345 },
    });
    expect(rv(11, 0, 3, 7)).toBe(0.9658289530780166);
  });

  it('fails loudly for a name the prototype does not define', () => {
    expect(() => loadPrototype(['noSuchDefinition'])).toThrow(/noSuchDefinition/);
  });
});
