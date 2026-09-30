/**
 * What a pitched sound is made of (#269): the level and place of each of its
 * harmonics, how wide its note is, and a fingerprint of the levels, to tell one
 * instrument's tone from another's.
 *
 * The fingerprint is a claim of the speculative kind. On synthetic
 * instruments that keep their harmonic levels (a saw, a square, a triangle,
 * an organ, a clarinet's odd harmonics, a flute, a bright stop)
 * `timbre.test.ts` measures it: it holds within 3 dB across pitch and level,
 * keeps every pair more than 6 dB apart, and names each by its nearest
 * neighbour every time, noisy (20 dB) or not. It does not hold for a sound
 * with formants: a vowel's harmonic levels follow fixed frequencies, so
 * across pitches from 110 to 440 Hz its fingerprint moves by 6 to 15 dB
 * from its 220 Hz one, more than the 9 dB between that vowel and a saw.
 * Whether it tells recorded instruments apart is not measured, since there
 * are none here to measure.
 */

import { findPeaks } from './peaks.ts';
import type { Spectrum } from './fft.ts';

/** One harmonic of a sound: the k-th multiple of its fundamental, as found. */
export interface Harmonic {
  /** Which multiple it is: 1 is the fundamental. */
  number: number;
  /** Where the peak is, in Hz; null where none is found. */
  hz: number | null;
  /** Its level in dB below the strongest harmonic, 0 for that one; null where none is found. */
  db: number | null;
  /** How far sharp of the exact multiple it is, in cents: a string's partials stretch. Null where none is found. */
  cents: number | null;
}

export interface HarmonicProfile {
  harmonics: Harmonic[];
  /**
   * How wide the note is, in cents: the root mean square spread of the power
   * about its strongest low harmonic's peak, less what the window itself gives
   * a steady sine. A steady sine has none, a pitch that wavers by ±20 cents
   * has about 14, two strings 3 Hz apart at 220 Hz about 22.
   */
  width: number;
}

export interface ProfileOptions {
  /** How many harmonics to look for, 12 by default. */
  count?: number;
  /** How far from the exact multiple a peak may be and still be its harmonic, in cents: 40 by default, more for a string. */
  toleranceCents?: number;
  /** A harmonic this far below the strongest, in dB, is not there: 50 by default. */
  presenceDb?: number;
  /** The length of the frame the spectrum is of, in samples, as its window gives its width: the spectrum's own length by default, which is wrong if it was padded. */
  frameSamples?: number;
}

/** The band the peak's spread is taken over, in bins of the frame either side of it. */
const BAND_BINS = 4;

/** The spread a steady sine has through a Hann window, in bins of the frame, the same at any pitch and frame (measured: 0.577, 1/√3). */
const HANN_SPREAD_BINS = 0.577;

export function harmonicProfile(
  spectrum: Spectrum,
  fundamental: number,
  { count = 12, toleranceCents = 40, presenceDb = 50, frameSamples }: ProfileOptions = {},
): HarmonicProfile {
  const { magnitudes, binHz, sampleRate } = spectrum;
  const strongest = Math.max(0, ...magnitudes);
  const peaks =
    strongest > 0
      ? findPeaks(spectrum, { minMagnitude: strongest * 10 ** (-presenceDb / 20) })
      : [];
  const found = Array.from({ length: count }, (_, i) => {
    const expected = fundamental * (i + 1);
    const tolerance = 2 ** (toleranceCents / 1200);
    if (expected * tolerance >= sampleRate / 2) return null;
    let best: { hz: number; magnitude: number } | null = null;
    for (const peak of peaks)
      if (
        peak.hz >= expected / tolerance &&
        peak.hz <= expected * tolerance &&
        (!best || peak.magnitude > best.magnitude)
      )
        best = peak;
    return best;
  });
  const top = Math.max(0, ...found.map((p) => p?.magnitude ?? 0));
  const harmonics: Harmonic[] = found.map((peak, i) =>
    peak
      ? {
          number: i + 1,
          hz: peak.hz,
          db: 20 * Math.log10(peak.magnitude / top),
          cents: 1200 * Math.log2(peak.hz / (fundamental * (i + 1))),
        }
      : { number: i + 1, hz: null, db: null, cents: null },
  );

  // The width, at the strongest of the first four harmonics that are there: how far the peak's power
  // spreads about its centre, in a band of four bins of the frame either side, less what the window gives a steady sine.
  let width = 0;
  const lows = found.slice(0, 4).filter((p): p is { hz: number; magnitude: number } => p !== null);
  const peak = lows.reduce<{ hz: number; magnitude: number } | null>(
    (a, p) => (!a || p.magnitude > a.magnitude ? p : a),
    null,
  );
  if (peak) {
    const frameBin = sampleRate / (frameSamples ?? sampleRate / binHz);
    const from = Math.max(0, Math.floor((peak.hz - BAND_BINS * frameBin) / binHz));
    const to = Math.min(magnitudes.length - 1, Math.ceil((peak.hz + BAND_BINS * frameBin) / binHz));
    let power = 0;
    let first = 0;
    for (let k = from; k <= to; k++) {
      power += magnitudes[k]! ** 2;
      first += magnitudes[k]! ** 2 * k * binHz;
    }
    const centre = first / power;
    let second = 0;
    for (let k = from; k <= to; k++) second += magnitudes[k]! ** 2 * (k * binHz - centre) ** 2;
    const spread = Math.sqrt(second / power) / frameBin;
    const excessHz = Math.sqrt(Math.max(0, spread * spread - HANN_SPREAD_BINS ** 2)) * frameBin;
    width = 1200 * Math.log2((centre + excessHz) / centre);
  }
  return { harmonics, width };
}

/** The harmonic levels of a sound, in dB below the strongest, a harmonic that is not there at the floor. */
export type Fingerprint = readonly number[];

/** The level a missing harmonic has in a fingerprint, in dB. */
export const FINGERPRINT_FLOOR_DB = -60;

export function fingerprintOf({ harmonics }: HarmonicProfile): Fingerprint {
  return harmonics.map((h) => Math.max(FINGERPRINT_FLOOR_DB, h.db ?? FINGERPRINT_FLOOR_DB));
}

/** How far apart two fingerprints are: the root mean square of the differences of their levels, in dB. Zero from itself. */
export function fingerprintDistance(a: Fingerprint, b: Fingerprint): number {
  const n = Math.max(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < n; i++)
    sum += ((a[i] ?? FINGERPRINT_FLOOR_DB) - (b[i] ?? FINGERPRINT_FLOOR_DB)) ** 2;
  return Math.sqrt(sum / n);
}
