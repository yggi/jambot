/**
 * The Rhythm view's grid, as values (#327): a pattern of a person's own is
 * hits, each a drum's note at a step of the bar, which they edit by tapping
 * the grid or record by playing the pads; the band's bar heard is read as
 * hits of the same kind from its drum lane, so the grid draws both on one
 * pattern of rows. A pattern belongs to no meter: it is played on a bar's
 * steps by their place in the bar, so a hit past a shorter bar's end waits
 * for a longer one.
 */

import { DRUM_NOTES } from '@jambot/engine';
import type { LaneNote } from './tracks.ts';

/** The kit's pads, top to bottom, each a General MIDI note: the grid's rows and the pads' order. */
export const KIT: readonly { readonly note: number; readonly label: string }[] = [
  { note: DRUM_NOTES.kick, label: 'Kick' },
  { note: DRUM_NOTES.snare, label: 'Snare' },
  { note: DRUM_NOTES.closedHat, label: 'Closed hat' },
  { note: DRUM_NOTES.openHat, label: 'Open hat' },
  { note: DRUM_NOTES.pedalHat, label: 'Pedal hat' },
  { note: DRUM_NOTES.rim, label: 'Rim' },
  { note: DRUM_NOTES.ride, label: 'Ride' },
];

export interface Hit {
  readonly note: number;
  /** In the bar, from 0. */
  readonly step: number;
}

/** A person's own pattern: its hits, in the order of their steps and then their notes, none twice. */
export type Rhythm = readonly Hit[];

const ordered = (hits: Hit[]): Rhythm => hits.sort((a, b) => a.step - b.step || a.note - b.note);

/** Whether a pattern has a hit of `note` at `step`. */
export const hasHit = (pattern: Rhythm, note: number, step: number): boolean =>
  pattern.some((hit) => hit.note === note && hit.step === step);

/** The pattern with that hit taken out where it is, put in where it isn't: a tap on the grid. */
export function toggled(pattern: Rhythm, note: number, step: number): Rhythm {
  return hasHit(pattern, note, step)
    ? pattern.filter((hit) => !(hit.note === note && hit.step === step))
    : ordered([...pattern, { note, step }]);
}

/** The pattern with a hit put in where it isn't yet: a pad struck while it records. */
export function recorded(pattern: Rhythm, note: number, step: number): Rhythm {
  return hasHit(pattern, note, step) ? pattern : ordered([...pattern, { note, step }]);
}

/** The notes a pattern strikes at a step of a bar `steps` long. */
export function hitsAt(pattern: Rhythm, step: number, steps: number): number[] {
  const at = ((step % steps) + steps) % steps;
  return pattern.filter((hit) => hit.step === at).map((hit) => hit.note);
}

/** The band's hits in a bar, from its drum lane: the notes that start in it, by their step in it. */
export function barHits(notes: readonly LaneNote[], start: number, steps: number): Rhythm {
  return ordered(
    notes
      .filter((n) => n.step >= start && n.step < start + steps)
      .map((n) => ({ note: n.note, step: n.step - start })),
  );
}
