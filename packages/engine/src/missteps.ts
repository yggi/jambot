/**
 * Missteps (#747, #580 rung 5): a player who strikes a wrong key and corrects it at once meant the second note, not
 * both. A note is heard as such a slip, and dropped before a phrase is read, where it is off the key, short, and the
 * same source strikes a note on the key at most `CORRECTION_REACH` semitones from it within `CORRECTION_STEPS` of its
 * onset. The margins are fractions of a step: a correction comes in tens of milliseconds, where a tight hand's chromatic
 * passing sixteenth comes a whole step before its neighbour, and is kept. Off the chord waits for the reader to hold the
 * chord where it hears, with the lift into cells (rung 7, yggi/cells#512). Pure.
 */

import { type Key, keyHelix } from './key.ts';
import type { HeardNote } from './muse.ts';

/** How soon a correction follows a slip, and how long the slip sounds at most: 0.6 of a step, 75 ms at 120 bpm. */
export const CORRECTION_STEPS = 0.6;

/** How far, in semitones, the note meant lies from the slip: the keys either side, and the next ones. */
export const CORRECTION_REACH = 2;

/** Whether a note's pitch class is one of the key's scale. */
export function onKey(note: number, key: Key): boolean {
  const pc = ((note % 12) + 12) % 12;
  return keyHelix(key).heights.some((h) => ((h % 12) + 12) % 12 === pc);
}

/** Whether `wrong` is a slip `right` corrects (see the module's comment). */
function corrects(wrong: HeardNote, right: HeardNote, key: Key): boolean {
  const gap = right.position - wrong.position;
  const apart = Math.abs(right.note - wrong.note);
  return (
    right.source === wrong.source &&
    gap > 0 &&
    gap <= CORRECTION_STEPS &&
    apart > 0 &&
    apart <= CORRECTION_REACH &&
    onKey(right.note, key)
  );
}

/** The notes heard, a corrected misstep left out, in the order heard: the same objects. */
export function withoutMissteps(notes: readonly HeardNote[], key: Key): HeardNote[] {
  return notes.filter((wrong) => {
    if (onKey(wrong.note, key)) return true;
    // (one still held is short as far as it has sounded: its correction says it slipped)
    if (wrong.end !== null && wrong.end - wrong.position > CORRECTION_STEPS) return true;
    return !notes.some((right) => corrects(wrong, right, key));
  });
}
