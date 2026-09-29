/**
 * The local mix: which of the band's performers this device sounds. A
 * performer muted is still composed, scheduled and drawn in the tracks; its
 * notes only don't reach this device's output. Where any performer is
 * soloed, only the soloed sound, and each row's mute and solo are its own,
 * as on a mixing desk. A player's own notes always sound: the mix is the
 * band's, which lets a player take a part by muting the band's voice on it.
 *
 * It is this device's alone, never sent to a session, and lasts as long as
 * the page: a mute left on from an earlier visit would be a silent band.
 */

import { PERFORMERS, type Performer } from './sounding.ts';

export interface Mix {
  readonly muted: readonly Performer[];
  readonly soloed: readonly Performer[];
}

export const EVEN_MIX: Mix = { muted: [], soloed: [] };

/** Whether `performer` sounds in `mix`. */
export function sounds(mix: Mix, performer: Performer): boolean {
  return mix.soloed.length > 0 ? mix.soloed.includes(performer) : !mix.muted.includes(performer);
}

/** `mix` with `performer`'s mute or solo turned over. */
export function toggled(mix: Mix, which: keyof Mix, performer: Performer): Mix {
  const on = !mix[which].includes(performer);
  return {
    ...mix,
    [which]: PERFORMERS.filter((p) => (p === performer ? on : mix[which].includes(p))),
  };
}
