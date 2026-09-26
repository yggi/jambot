/**
 * Modes: the same helix entered from another degree.
 *
 * A mode keeps the heights and renumbers the degrees, so mode 1 of C major is
 * D dorian: the same positions, another tonic. A shift does the opposite: it
 * moves the heights and keeps the degrees. So a shift of an inner helix is a
 * mode of the outer one it is composed with.
 *
 * Brightness is a number: the sum of the heights above degree 0. Sorted by
 * it, the modes of an even set run along its generator (see `generator`), one
 * note lower at each step. For 7 of 12 the generator is the fifth, and the
 * order runs from Lydian to Locrian.
 */

import { even } from './even.ts';
import { type Helix, heightOf, shift } from './helix.ts';

/** The helix entered from `degree`: the heights kept, degree `degree` numbered 0. */
export function mode(helix: Helix, degree: number): Helix {
  return {
    cycle: helix.cycle,
    heights: helix.heights.map((_, e) => heightOf(helix, e + degree)),
  };
}

/** The k modes of a helix, in degree order. */
export function modes(helix: Helix): Helix[] {
  return helix.heights.map((_, d) => mode(helix, d));
}

/** The sum of the heights above degree 0: 39 for Lydian, 33 for Locrian. */
export function brightness(helix: Helix): number {
  const tonic = helix.heights[0]!;
  return helix.heights.reduce((sum, x) => sum + x - tonic, 0);
}

/** The diatonic modes, from the brightest to the darkest. */
export const DIATONIC_MODE_NAMES = [
  'lydian',
  'ionian',
  'mixolydian',
  'dorian',
  'aeolian',
  'phrygian',
  'locrian',
] as const;

export type DiatonicModeName = (typeof DIATONIC_MODE_NAMES)[number];

const DIATONIC_MODES = modes(even(7, 12))
  .map((m) => shift(m, -heightOf(m, 0)))
  .sort((a, b) => brightness(b) - brightness(a));

/** A diatonic mode by name, with its tonic at 0. */
export function diatonicMode(name: DiatonicModeName): Helix {
  return DIATONIC_MODES[DIATONIC_MODE_NAMES.indexOf(name)]!;
}
