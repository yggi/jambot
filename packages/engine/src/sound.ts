/**
 * The dough: a pitched voice's colour, as the style shapes it (C1, C2).
 *
 * The lead goes from a soft triangle to a bright square as articulation
 * rises, its filter opening with energy and its attack sharpening. The bass
 * goes from a resonant saw to a round triangle as swing rises into
 * triplets, its filter opening with articulation. The chords swell in
 * legato and are cut short in staccato. These are the prototype's `sound`
 * lines, one performer's own now (`performer.ts`, #107).
 */

import type { Part, Timbre } from './events.ts';
import type { Style } from './style.ts';
import { swingParts } from './swing.ts';

/** Exact at both ends. */
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/** A part's colour: its style, at the energy it plays at. The drums read none. */
export function timbreOf(part: Part, style: Style, energy: number): Timbre {
  const { artic } = style;
  switch (part) {
    case 'lead':
      return {
        triangle: 1.8 * (1 - artic),
        square: artic,
        cutoff: 1400 + 2200 * energy,
        attack: lerp(0.04, 0.006, artic),
      };
    case 'bass': {
      const { eighth } = swingParts(style.swing);
      return {
        saw: 1 - eighth,
        triangle: 1.6 * eighth,
        cutoff: 0.6 + 0.6 * artic,
        resonance: 6 - 4 * eighth,
      };
    }
    case 'pad':
    case 'stab':
      return { attack: lerp(0.3, 0.01, artic), release: lerp(0.7, 0.12, artic) };
    case 'drums':
      return {};
  }
}
