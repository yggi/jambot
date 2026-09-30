/**
 * A spectrum on a logarithmic frequency axis, for drawing: bands a constant
 * ratio apart, so the notes are evenly spaced, in decibels below full scale.
 * A band at the low end is narrower than a bin, which it reads between the
 * bins of, and at the high end many bins share a band, of which it keeps the
 * strongest.
 */

import type { Spectrum } from './fft.ts';

export interface BandOptions {
  /** The centre of the first band, in Hz. */
  lowHz: number;
  /** No band is centred above this, in Hz. */
  highHz: number;
  /** Bands to an octave: 12 for a semitone each, 24 for a quarter tone. */
  perOctave: number;
  /** What is quieter reads as this, in dB: −90 by default. */
  floorDb?: number;
}

/** The centre of every band, in Hz. */
export function bandCentres({ lowHz, highHz, perOctave }: BandOptions): Float64Array {
  const count = Math.floor(perOctave * Math.log2(highHz / lowHz) + 1e-9) + 1;
  return Float64Array.from({ length: count }, (_, i) => lowHz * 2 ** (i / perOctave));
}

/** The spectrum's magnitude in each band, in decibels below full scale, floored. */
export function logBands({ magnitudes, binHz }: Spectrum, options: BandOptions): Float64Array {
  const floorDb = options.floorDb ?? -90;
  const floor = 10 ** (floorDb / 20);
  const half = 2 ** (1 / (2 * options.perOctave));
  const last = magnitudes.length - 1;
  return Float64Array.from(bandCentres(options), (centre) => {
    const lowBin = Math.ceil(centre / half / binHz);
    const highBin = Math.floor((centre * half) / binHz);
    let magnitude: number;
    if (highBin >= lowBin) {
      magnitude = 0;
      for (let k = Math.max(0, lowBin); k <= Math.min(last, highBin); k++)
        magnitude = Math.max(magnitude, magnitudes[k]!);
    } else {
      // Narrower than a bin: between its two neighbours.
      const at = Math.min(last, Math.max(0, centre / binHz));
      const k = Math.min(last - 1, Math.floor(at));
      magnitude = magnitudes[k]! + (at - k) * (magnitudes[k + 1]! - magnitudes[k]!);
    }
    return 20 * Math.log10(Math.max(magnitude, floor));
  });
}
