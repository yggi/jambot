/**
 * Where the band is in style space (#313, step 5): the preset it is nearest,
 * and the one it heads for, the nearest to where its style track is going.
 * The style card says it (`styleSub`), the radio on the air or not.
 */

import { type Style, nearestPreset } from '@jambot/engine';

/** Where the style is and where it heads, as the nearest preset's name each. */
export function nowPlaying(at: Style, heading: Style): { at: string; toward: string | null } {
  const [here, there] = [nearestPreset(at), nearestPreset(heading)];
  return { at: here, toward: there === here ? null : there };
}
