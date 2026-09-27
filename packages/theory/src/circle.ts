/**
 * The circle of fifths: the wheel a stack of fifths traces through the 12
 * pitch classes.
 *
 * The fifths step g = generator(7, 12) is its own inverse mod 12 (7·7 = 49 ≡
 * 1), so the one multiplication both lays a pitch class onto its place on
 * the wheel and reads a wheel index back off as a pitch class: C (0) at
 * index 0, G (7) at index 1, D (2) at index 2, and so on clockwise.
 */

import { generator } from './even.ts';
import { mod } from './helix.ts';

/** A pitch class's place around the circle of fifths, 0 at C, rising by fifths. */
export function fifthsIndex(pitchClass: number): number {
  return mod(pitchClass * generator(7, 12), 12);
}
