/**
 * The spectrum's drawing as numbers: the path of its line, and where a
 * frequency and each octave's C stand along it. The axis is logarithmic over
 * `@jambot/spectrum`'s piano bands, so the notes are evenly spaced and a note's
 * place on it is what the keyboard below it would show.
 */

import { PIANO_BANDS } from '@jambot/spectrum';
import { frequencyOf } from '@jambot/theory';

export interface PlotSize {
  width: number;
  height: number;
  /** What the bottom of the plot stands for, in dB: the bands' floor, −90. */
  floorDb?: number;
  /** What the top stands for: 0, full scale. */
  topDb?: number;
}

/** The plot's line: a point for each band, left to right, a band at the floor on the bottom edge. */
export function spectrumPath(
  bands: ArrayLike<number>,
  { width, height, floorDb = -90, topDb = 0 }: PlotSize,
): string {
  const last = Math.max(1, bands.length - 1);
  const points = Array.from({ length: bands.length }, (_, i) => {
    const level = Math.min(1, Math.max(0, (bands[i]! - floorDb) / (topDb - floorDb)));
    return `${i === 0 ? 'M' : 'L'}${round((i / last) * width)},${round(height * (1 - level))}`;
  });
  return points.join(' ');
}

const round = (x: number) => Math.round(x * 100) / 100;

/** The octaves between the first band and the last. */
const OCTAVES = Math.log2(PIANO_BANDS.highHz / PIANO_BANDS.lowHz);

/** Where a frequency stands along a plot `width` wide: 0 at the first band, `width` at the last. */
export function xOfHz(hz: number, width: number): number {
  // The last band is centred a little short of the top of the range, at a whole number of bands.
  const bands = Math.floor(PIANO_BANDS.perOctave * OCTAVES + 1e-9);
  return (Math.log2(hz / PIANO_BANDS.lowHz) * PIANO_BANDS.perOctave * width) / bands;
}

/** A mark on the axis. */
export interface Mark {
  name: string;
  x: number;
}

/** The C of every octave from C1 to C8, for the axis. */
export function octaveMarks(width: number): Mark[] {
  return Array.from({ length: 8 }, (_, i) => ({
    name: `C${i + 1}`,
    x: xOfHz(frequencyOf(12 * (i + 2)), width),
  }));
}
