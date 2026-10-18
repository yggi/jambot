/**
 * What the session says of where the band is in style space (#313, step 5):
 * the preset it is nearest, and the one it heads for, the nearest to where
 * its style track is going. The radio is the session's, not the band card's
 * (the owner), so the line is read off the track alone: a client, which has
 * only the host's track, says it as the host does.
 */

import { type Style, type StyleTrack, nearestPreset, styleAt } from '@jambot/engine';
import { targetOf } from './conductor.ts';

/** Where the style is and where it heads, as the nearest preset's name each. */
export function nowPlaying(at: Style, heading: Style): { at: string; toward: string | null } {
  const [here, there] = [nearestPreset(at), nearestPreset(heading)];
  return { at: here, toward: there === here ? null : there };
}

/**
 * "Lo-fi hip hop" while the style stays near a preset, and "Lo-fi hip hop,
 * drifting toward Techno" while it is heading for another. Null before a
 * position is heard.
 */
export function stationLine(track: StyleTrack, position: number | null): string | null {
  if (position === null) return null;
  const { at, toward } = nowPlaying(styleAt(track, position), targetOf(track));
  return toward === null ? at : `${at}, drifting toward ${toward}`;
}
