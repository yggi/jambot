import { describe, expect, it } from 'vitest';
import { keyedRandom, keyedRng, mulberry32 } from './random.ts';

// Reference values recorded from prototype/jambot-prototype.html, so songs
// generated from a seed stay the same across the port.
describe('mulberry32', () => {
  it('produces the prototype sequence', () => {
    const r = mulberry32(1);
    expect([r(), r(), r()]).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
  });

  it('stays in [0, 1)', () => {
    const r = mulberry32(0xdeadbeef);
    for (let i = 0; i < 10_000; i++) {
      const x = r();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('keyedRng', () => {
  it('matches the prototype for a seed and key path', () => {
    const r = keyedRng(12345, 1, 0);
    expect([r(), r(), r()]).toEqual([0.370359550928697, 0.890166247729212, 0.7654600373934954]);
    expect(keyedRandom(12345, 11, 0, 3, 7)).toBe(0.9658289530780166);
  });

  it('is a pure function of seed and keys', () => {
    expect(keyedRandom(7, 1, 2, 3)).toBe(keyedRandom(7, 1, 2, 3));
    expect(keyedRandom(7, 1, 2, 3)).not.toBe(keyedRandom(7, 1, 2, 4));
    expect(keyedRandom(7, 1, 2, 3)).not.toBe(keyedRandom(8, 1, 2, 3));
  });

  it('truncates keys to 32-bit integers like the prototype', () => {
    expect(keyedRandom(0xffffffff, 13, -1, 2.9)).toBe(0.46915554720908403);
    expect(keyedRandom(0xffffffff, 13, -1, 2.9)).toBe(keyedRandom(0xffffffff, 13, -1, 2));
  });
});
