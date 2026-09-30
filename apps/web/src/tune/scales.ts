/**
 * The scales a live correction (#298) may snap to, as the theory has them
 * (`SCALES`): each moved to a root as the pitch classes it holds, from C.
 */

import { SCALES } from '@jambot/theory';

/** The scales on offer: the theory's id, and the name a player knows it by. */
export const CORRECTION_SCALES: readonly { id: string; name: string }[] = [
  { id: 'ionian', name: 'major' },
  { id: 'aeolian', name: 'minor' },
  { id: 'major pentatonic', name: 'major pentatonic' },
  { id: 'minor pentatonic', name: 'minor pentatonic' },
  { id: 'blues', name: 'blues' },
  { id: 'chromatic', name: 'chromatic' },
];

/** The pitch classes of a scale on a root (0 is C), sorted. */
export function pitchClassesOf(id: string, root: number): number[] {
  const scale = SCALES[id];
  if (!scale) throw new Error(`no such scale: ${id}`);
  return scale.helix.heights.map((height) => (height + root) % 12).sort((a, b) => a - b);
}
