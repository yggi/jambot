/**
 * The peaks of a magnitude spectrum, each placed between the bins.
 */

import type { Spectrum } from './fft.ts';

/** A peak of a spectrum: where it is and how strong. */
export interface Peak {
  hz: number;
  /** The amplitude of the sine that makes it. */
  magnitude: number;
}

export interface PeakOptions {
  /** At most this many, the strongest. All by default. */
  count?: number;
  /** Peaks weaker than this are left out. */
  minMagnitude?: number;
}

/**
 * The local maxima of a spectrum, strongest first. A maximum is placed by a
 * parabola through the logarithm of its bin and its two neighbours: a Hann
 * window's main lobe is close to a Gaussian, whose logarithm is one, so the
 * peak lands within a few hundredths of a bin, where the bin alone would be
 * off by half of one.
 */
export function findPeaks(
  { magnitudes, binHz }: Spectrum,
  { count = Infinity, minMagnitude = 0 }: PeakOptions = {},
): Peak[] {
  const peaks: Peak[] = [];
  for (let k = 1; k < magnitudes.length - 1; k++) {
    const b = magnitudes[k]!;
    const a = magnitudes[k - 1]!;
    const c = magnitudes[k + 1]!;
    if (!(b > a && b >= c) || b <= 0 || b < minMagnitude) continue;
    const la = Math.log(Math.max(a, 1e-300));
    const lb = Math.log(b);
    const lc = Math.log(Math.max(c, 1e-300));
    const curve = la - 2 * lb + lc;
    const offset = curve === 0 ? 0 : (0.5 * (la - lc)) / curve;
    peaks.push({
      hz: (k + offset) * binHz,
      magnitude: Math.exp(lb - 0.25 * (la - lc) * offset),
    });
  }
  peaks.sort((p, q) => q.magnitude - p.magnitude);
  return peaks.slice(0, count);
}
