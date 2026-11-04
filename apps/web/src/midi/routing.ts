/**
 * Where a played note lands: which instrument a MIDI channel plays, and the
 * one route every note takes (the Muse, playing along, and on to where the
 * patch passes it). Pulled out of `App.svelte` so this wiring has a test that
 * can fail if it breaks. Reading the message is webmidi's (`@yggi/webmidi`);
 * where a note is passed on is the patch's (`patch.ts`, `forwardsOf`).
 */

import type { Part } from '@jambot/engine';

/** General MIDI's drum channel, 10, counted from 0 as a status byte's nibble is. */
export const DRUM_CHANNEL = 9;

/** Which instrument a MIDI channel plays: the pads on channel 10, the keyboard on every other. */
export const partOf = (channel: number): Extract<Part, 'lead' | 'drums'> =>
  channel === DRUM_CHANNEL ? 'drums' : 'lead';

export interface RouteDeps {
  /** Mutated in place: added on, removed off, as the on-screen keyboard lights it. */
  readonly held: { add(note: number): unknown; delete(note: number): unknown };
  /** The Muse (#79) reads captured notes from here; this only feeds it. */
  readonly humanNoteOn: (note: number, velocity: number, source: string, seconds: number) => void;
  /** Where a captured note is released. */
  readonly humanNoteOff: (note: number, source: string, seconds: number) => void;
  readonly playing: () => boolean;
  /** A `performance.now()`-relative timestamp, as seconds on the player's clock. */
  readonly toOutputSeconds: (performanceMs: number) => number;
  /** Pass it on, where the patch sends this instrument's row (the keys'): a MIDI input's is the device's own. */
  readonly forward?: (note: number, velocity: number, on: boolean) => void;
  /** Heard at once, along with the band, whenever a note is struck. */
  readonly playAlong: (note: number, velocity: number) => void;
  readonly now?: () => number;
}

/** A note from any source: the on-screen keys, the computer keys, or Web MIDI in. */
export function routeNote(
  note: number,
  velocity: number,
  on: boolean,
  source: string,
  deps: RouteDeps,
): void {
  if (on) deps.held.add(note);
  else deps.held.delete(note);
  if (on) deps.playAlong(note, velocity);
  if (deps.playing()) {
    // `performance.now` read off its object throws, so it is called on it.
    const seconds = deps.toOutputSeconds(deps.now ? deps.now() : performance.now());
    if (on) deps.humanNoteOn(note, velocity, source, seconds);
    else deps.humanNoteOff(note, source, seconds);
  }
  deps.forward?.(note, velocity, on);
}
