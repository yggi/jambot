import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, type ComposerMode, keyHelix } from '@jambot/engine';
import { positions } from '@jambot/theory';
import { figureArc, wheelAngle, wheelDistance, wheelOrder, wheelPoint } from './circleLayout.ts';

const range = (n: number) => [...Array(n).keys()];

describe('wheelAngle and wheelPoint', () => {
  it('puts index 0 at the top and steps 30° clockwise per index, for every index', () => {
    for (const index of range(12)) {
      expect(wheelAngle(index)).toBeCloseTo(((index * 30 - 90) * Math.PI) / 180);
    }
  });

  it('places the four compass points where a clock face would, for every radius', () => {
    for (const radius of [1, 10, 100]) {
      expect(wheelPoint(0, radius).x).toBeCloseTo(0);
      expect(wheelPoint(0, radius).y).toBeCloseTo(-radius);
      expect(wheelPoint(3, radius).x).toBeCloseTo(radius);
      expect(wheelPoint(3, radius).y).toBeCloseTo(0);
      expect(wheelPoint(6, radius).x).toBeCloseTo(0);
      expect(wheelPoint(6, radius).y).toBeCloseTo(radius);
      expect(wheelPoint(9, radius).x).toBeCloseTo(-radius);
      expect(wheelPoint(9, radius).y).toBeCloseTo(0);
    }
  });
});

describe('wheelDistance', () => {
  it('is the short way round the wheel, symmetric, 0 to 6, for every pair', () => {
    for (const a of range(12)) {
      for (const b of range(12)) {
        expect(wheelDistance(a, b)).toBe(wheelDistance(b, a));
        expect(wheelDistance(a, b)).toBeLessThanOrEqual(6);
      }
      expect(wheelDistance(a, a)).toBe(0);
    }
    expect(wheelDistance(0, 7)).toBe(1);
    expect(wheelDistance(0, 5)).toBe(1);
    expect(wheelDistance(0, 6)).toBe(6);
  });
});

describe('figureArc', () => {
  const scaleOf = (tonic: number, mode: ComposerMode) => positions(keyHelix({ tonic, mode }));

  it('draws every mode on every tonic as an arc with no edge longer than one step of the wheel', () => {
    for (const mode of COMPOSER_MODES) {
      for (const tonic of range(12)) {
        const arc = figureArc(scaleOf(tonic, mode));
        expect(arc).toHaveLength(7);
        for (let i = 1; i < arc.length; i++) {
          expect(wheelDistance(arc[i - 1]!, arc[i]!), `${mode} on ${tonic}`).toBe(1);
        }
      }
    }
  });

  it('is a permutation of the scale it orders', () => {
    for (const tonic of range(12)) {
      const scale = scaleOf(tonic, 'aeolian');
      expect(new Set(figureArc(scale))).toEqual(new Set(scale));
    }
  });

  it('runs from the flat end to the sharp end: C ionian is F C G D A E B', () => {
    expect(figureArc([0, 2, 4, 5, 7, 9, 11])).toEqual([5, 0, 7, 2, 9, 4, 11]);
  });

  it('leaves a long edge where a scale is not contiguous: harmonic minor has one', () => {
    // A harmonic minor: A B C D E F G♯. On the wheel F C G D A E B are seven in a row, but G♯ (8) sits far from the rest.
    const arc = figureArc([9, 11, 0, 2, 4, 5, 8]);
    const longest = Math.max(...arc.slice(1).map((pc, i) => wheelDistance(arc[i]!, pc)));
    expect(longest).toBeGreaterThan(1);
  });

  it('copes with empty and single-note scales', () => {
    expect(figureArc([])).toEqual([]);
    expect(figureArc([3])).toEqual([3]);
  });
});

describe('wheelOrder', () => {
  it('is C, G, D, A, E, B, F♯, D♭, A♭, E♭, B♭, F: the standard circle of fifths from C', () => {
    expect(wheelOrder()).toEqual([0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]);
  });

  it('is every pitch class exactly once', () => {
    expect(new Set(wheelOrder())).toEqual(new Set(range(12)));
    expect(wheelOrder()).toHaveLength(12);
  });
});
