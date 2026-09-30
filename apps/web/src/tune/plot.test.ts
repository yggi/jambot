// @vitest-environment node
import { PIANO_BANDS, bandCentres } from '@jambot/spectrum';
import { describe, expect, it } from 'vitest';
import { octaveMarks, spectrumPath, xOfHz } from './plot.ts';

const size = { width: 700, height: 100 };
const centres = bandCentres(PIANO_BANDS);

describe('spectrumPath', () => {
  it('runs from the left edge to the right, a point to a band, and a quiet band is at the bottom', () => {
    const path = spectrumPath(new Float64Array(5).fill(-90), size);
    expect(path).toBe('M0,100 L175,100 L350,100 L525,100 L700,100');
  });

  it('puts full scale at the top and halves the height at the middle of the range', () => {
    expect(spectrumPath(Float64Array.of(0, -45, -90), size)).toBe('M0,0 L350,50 L700,100');
  });

  it('keeps a band above full scale, or below the floor, inside the plot', () => {
    expect(spectrumPath(Float64Array.of(12, -200), size)).toBe('M0,0 L700,100');
  });

  it('takes a range of its own', () => {
    expect(spectrumPath(Float64Array.of(-10, -60), { ...size, floorDb: -60, topDb: -10 })).toBe(
      'M0,0 L700,100',
    );
  });

  it('is empty for no bands', () => {
    expect(spectrumPath(new Float64Array(0), size)).toBe('');
  });
});

describe('xOfHz', () => {
  it('puts the first band at the left and the last at the right, and an octave in between at equal steps', () => {
    expect(xOfHz(27.5, size.width)).toBeCloseTo(0, 9);
    expect(xOfHz(centres.at(-1)!, size.width)).toBeCloseTo(700, 9);
    const octave = xOfHz(55, size.width) - xOfHz(27.5, size.width);
    expect(xOfHz(110, size.width) - xOfHz(55, size.width)).toBeCloseTo(octave, 9);
  });

  it('agrees with where a band sits in the path, at every band', () => {
    centres.forEach((hz, i) =>
      expect(xOfHz(hz, size.width), `${i}`).toBeCloseTo((i / (centres.length - 1)) * size.width, 6),
    );
  });
});

describe('octaveMarks', () => {
  it('marks every C from C1 to C8, named, left to right, and keeps them inside the plot', () => {
    const marks = octaveMarks(size.width);
    expect(marks.map((m) => m.name)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']);
    expect(marks[3]!.x).toBeCloseTo(xOfHz(261.6256, size.width), 3);
    for (let i = 1; i < marks.length; i++) expect(marks[i]!.x).toBeGreaterThan(marks[i - 1]!.x);
    for (const mark of marks) {
      expect(mark.x).toBeGreaterThan(0);
      expect(mark.x).toBeLessThanOrEqual(size.width);
    }
  });
});
