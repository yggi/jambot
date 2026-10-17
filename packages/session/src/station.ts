/**
 * A radio station in a session (#313): the walk of `walkRadio` that a host
 * runs while nobody plays, a section at a time.
 *
 * The radio does not live in the band card but in the session (the owner,
 * #313): a host switches it on, and at each section's start the player
 * glides its style track to the next step of the walk. A client follows the
 * track the host sends, so it follows the walk exactly; the station is the
 * host's alone.
 *
 * It carries almost nothing. Where it is, is the style track's targets, the
 * style the walk last reached (the radio is a machine whose state is the
 * style, `radio`, F1), so a player who moves energy or entropy has moved the
 * walk, with no second copy to disagree. What the station adds is which draws
 * come next: the seed it was tuned in with and how many sections it has
 * walked, so a run resumed from them is the run from the start (S2).
 *
 * Pure: it counts, and knows no clock or device.
 */

import { type Style, walkRadio } from '@jambot/engine';

/** A station on the air: its seed, and the sections it has walked. */
export interface Station {
  readonly seed: number;
  readonly walked: number;
}

/** A station tuned in with a seed, before its first section. */
export const tuneIn = (seed: number): Station => ({ seed, walked: 0 });

/** The style a section on from `style`, and the station that walked it. */
export function onward(station: Station, style: Style): { station: Station; style: Style } {
  return {
    station: { seed: station.seed, walked: station.walked + 1 },
    style: walkRadio(style, station.seed, station.walked),
  };
}

/** A station as it was kept, or null for anything that isn't one. */
export function readStation(data: unknown): Station | null {
  if (typeof data !== 'object' || data === null) return null;
  const { seed, walked } = data as Partial<Record<string, unknown>>;
  if (!Number.isInteger(seed) || !Number.isInteger(walked) || (walked as number) < 0) return null;
  return { seed: seed as number, walked: walked as number };
}
