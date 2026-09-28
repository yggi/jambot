import { describe, expect, it } from 'vitest';
import { figureOrder, wheelAngle, wheelOrder, wheelPoint } from './circleLayout.ts';

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

describe('figureOrder', () => {
  it('starts at the tonic and threads the diatonic scale as the arc of wheel-adjacent positions it is', () => {
    // C ionian: C D E F G A B. On the wheel: C(0) G(1) D(2) A(3) E(4) B(5) F(11, i.e. -1).
    // From tonic C, wheel-distance order is C, G, D, A, E, B, F.
    expect(figureOrder([0, 2, 4, 5, 7, 9, 11], 0)).toEqual([0, 7, 2, 9, 4, 11, 5]);
  });

  it('gives the same shape wherever the tonic falls on the wheel, wrapping around 0', () => {
    // F♯ ionian (tonic 6): F♯ G♯ A♯ B C♯ D♯ E♯(F). Same relative arc as C ionian, from F♯.
    const scale = [6, 8, 10, 11, 1, 3, 5];
    expect(figureOrder(scale, 6)).toEqual([6, 1, 8, 3, 10, 5, 11]);
  });

  it('is a permutation of the scale it orders, for every tonic 0..11', () => {
    const cIonian = [0, 2, 4, 5, 7, 9, 11];
    for (const tonic of range(12)) {
      const ordered = figureOrder(cIonian, tonic);
      expect(new Set(ordered)).toEqual(new Set(cIonian));
      expect(ordered).toHaveLength(cIonian.length);
    }
  });

  it('puts the tonic first when the tonic is itself in the scale', () => {
    const cIonian = [0, 2, 4, 5, 7, 9, 11];
    for (const tonic of cIonian) {
      expect(figureOrder(cIonian, tonic)[0]).toBe(tonic);
    }
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
