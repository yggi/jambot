/**
 * The sound: how the built-in synth's voices are coloured by the style.
 *
 * The lead goes from a soft triangle to a bright square as articulation
 * rises, its filter opening with energy and its attack sharpening. The bass
 * goes from a resonant saw to a round triangle as swing rises into
 * triplets, its filter opening with articulation. The chords swell in
 * legato and are cut short in staccato. These are the prototype's `sound`
 * lines; what they are called in the score is #7's to decide.
 */

import type { Style } from './style.ts';
import { swingParts } from './swing.ts';

export interface Sound {
  readonly lead: {
    /** The mix of each waveform. */
    readonly triangle: number;
    readonly square: number;
    /** The lowpass cutoff, in hertz. */
    readonly cutoff: number;
    /** In seconds. */
    readonly attack: number;
  };
  readonly bass: {
    readonly saw: number;
    readonly triangle: number;
    /** A factor on the filter's cutoff, which velocity sets. */
    readonly cutoff: number;
    /** The filter's Q. */
    readonly resonance: number;
  };
  readonly chords: {
    /** In seconds. */
    readonly attack: number;
    readonly release: number;
  };
}

/** Exact at both ends. */
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/** The sound of a bar: its style, at the energy it plays at. */
export function soundOf(style: Style, energy: number): Sound {
  const { eighth } = swingParts(style.swing);
  const { artic } = style;
  return {
    lead: {
      triangle: 1.8 * (1 - artic),
      square: artic,
      cutoff: 1400 + 2200 * energy,
      attack: lerp(0.04, 0.006, artic),
    },
    bass: {
      saw: 1 - eighth,
      triangle: 1.6 * eighth,
      cutoff: 0.6 + 0.6 * artic,
      resonance: 6 - 4 * eighth,
    },
    chords: { attack: lerp(0.3, 0.01, artic), release: lerp(0.7, 0.12, artic) },
  };
}
