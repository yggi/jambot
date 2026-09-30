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
  /** Each performer's level, 0 to 1, where it isn't whole. */
  readonly levels: Readonly<Partial<Record<Performer, number>>>;
}

export const EVEN_MIX: Mix = { muted: [], soloed: [], levels: {} };

/** Whether `performer` sounds in `mix`. */
export function sounds(mix: Mix, performer: Performer): boolean {
  return mix.soloed.length > 0 ? mix.soloed.includes(performer) : !mix.muted.includes(performer);
}

/** `mix` with `performer`'s mute or solo turned over. */
export function toggled(mix: Mix, which: 'muted' | 'soloed', performer: Performer): Mix {
  const on = !mix[which].includes(performer);
  return {
    ...mix,
    [which]: PERFORMERS.filter((p) => (p === performer ? on : mix[which].includes(p))),
  };
}

/** `performer`'s level in `mix`, from 0 to 1: whole until it is set. */
export const level = (mix: Mix, performer: Performer): number => mix.levels[performer] ?? 1;

/** `mix` with `performer`'s level set, kept between none and whole. */
export function withLevel(mix: Mix, performer: Performer, value: number): Mix {
  const kept = Number.isNaN(value) ? 1 : Math.min(1, Math.max(0, value));
  return { ...mix, levels: { ...mix.levels, [performer]: kept } };
}

/**
 * The velocity a note of `performer` reaches the output with: scaled by its
 * level but never below 1, since a MIDI note on at velocity 0 is a note off;
 * none where the level is none, which stands for a note not played.
 */
export function velocityFor(mix: Mix, performer: Performer, velocity: number): number {
  const at = level(mix, performer);
  return at === 0 ? 0 : Math.max(1, Math.round(velocity * at));
}
