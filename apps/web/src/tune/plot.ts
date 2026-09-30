/**
 * The spectrum's drawing as numbers: the path of its line, and where a
 * frequency and each octave's C stand along it. The axis is logarithmic over
 * `@jambot/spectrum`'s piano bands, so the notes are evenly spaced and a note's
 * place on it is what the keyboard below it would show.
 */

import { type Harmonic, PIANO_BANDS } from '@jambot/spectrum';
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

/** One harmonic's bar: where it stands, how high, and how far sharp or flat of its exact multiple. */
export interface HarmonicBar {
  number: number;
  x: number;
  width: number;
  /** From 0 at the floor (−60 dB) to the plot's height at full (0 dB); 0 where the harmonic is missing. */
  height: number;
  present: boolean;
  /** Sideways from the bar's middle, in the plot's units: ±50 cents is half the bar's width either way. */
  offset: number;
}

/** The harmonics as bars, side by side across a plot `width` wide and `height` tall. */
export function harmonicBars(
  harmonics: readonly Harmonic[],
  { width, height }: { width: number; height: number },
): HarmonicBar[] {
  const slot = width / Math.max(1, harmonics.length);
  const barWidth = slot * 0.7;
  return harmonics.map((h, i) => ({
    number: h.number,
    x: i * slot + (slot - barWidth) / 2,
    width: barWidth,
    height: h.db === null ? 0 : Math.min(1, Math.max(0, (h.db + 60) / 60)) * height,
    present: h.db !== null,
    offset: h.cents === null ? 0 : Math.max(-1, Math.min(1, h.cents / 50)) * (barWidth / 2),
  }));
}
