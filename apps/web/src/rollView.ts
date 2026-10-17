/**
 * The Melody view's roll, as numbers: its columns are the keys under it, so
 * a note falls onto the key that plays it, and its time runs down the roll,
 * the steps ahead above a line where the step heard is and those played
 * below it. Every place is a fraction of the roll, 0 to 1, top to bottom
 * and left to right, so the drawing is a picture of these and nothing else.
 */

import type { KeyLayout } from './midi/surfaces.ts';
import type { LaneNote } from './tracks.ts';

/** How many steps ahead of the one heard the roll shows: a bar and a half of 4/4. */
export const ROLL_AHEAD = 24;
/** How many steps behind it. */
export const ROLL_BEHIND = 12;

/** Where the line of the step heard is, from the top. */
export const NOW_AT = ROLL_AHEAD / (ROLL_AHEAD + ROLL_BEHIND);

/** Whose a note is: the band's, played or foreseen, this player's own, or another player's. */
export type RollKind = 'played' | 'foreseen' | 'own' | 'other';

export interface RollNote {
  readonly note: number;
  /** Where no key plays it: above the keys, drawn at the right edge, or below them, at the left. */
  readonly beyond: 'above' | 'below' | null;
  readonly kind: RollKind;
  /** A player's colour, for their own notes and another's (`--source-n`). */
  readonly colour: number | null;
  readonly left: number;
  readonly width: number;
  readonly top: number;
  readonly height: number;
}

/** The place of a step on the roll, from the top: those ahead above `NOW_AT`, those played below. */
export const rollY = (step: number, playhead: number): number =>
  NOW_AT - (step - playhead) / (ROLL_AHEAD + ROLL_BEHIND);

/** How wide a note beyond the keys is drawn at the roll's edge. */
export const EDGE = 0.025;

/**
 * A note on the key that plays it, where it sounds; a note no key plays as a
 * mark at the edge it is beyond (a key it falls between, out of a locked
 * scale, has none); none where it is off the roll.
 */
function placed(
  note: LaneNote,
  keys: ReadonlyMap<number, KeyLayout>,
  range: { low: number; high: number },
  playhead: number,
  kind: RollKind,
  colour: number | null,
): RollNote | null {
  const beyond = note.note > range.high ? 'above' : note.note < range.low ? 'below' : null;
  const key = beyond
    ? { left: beyond === 'above' ? 100 * (1 - EDGE) : 0, width: 100 * EDGE }
    : keys.get(note.note);
  if (!key) return null;
  const top = rollY(note.step + note.length, playhead);
  const bottom = rollY(note.step, playhead);
  if (bottom <= 0 || top >= 1) return null;
  return {
    note: note.note,
    beyond,
    kind,
    colour,
    left: key.left / 100,
    width: key.width / 100,
    top: Math.max(0, top),
    height: Math.min(1, bottom) - Math.max(0, top),
  };
}

export interface RollInput {
  readonly keys: readonly KeyLayout[];
  /** The step heard, from the first bar shown's start. */
  readonly playhead: number;
  /** The band's lead. */
  readonly band: readonly LaneNote[];
  /** Players' notes on the lead, with their colour and whether they are this device's. */
  readonly players: readonly {
    readonly notes: readonly LaneNote[];
    readonly colour: number;
    readonly local: boolean;
  }[];
}

/**
 * Every note on the roll: the band's, foreseen where they start after the
 * step heard and played where they don't, and the players', drawn over them.
 */
export function rollNotes({ keys, playhead, band, players }: RollInput): RollNote[] {
  const byNote = new Map(keys.map((key) => [key.note, key]));
  const range = {
    low: Math.min(...keys.map((key) => key.note)),
    high: Math.max(...keys.map((key) => key.note)),
  };
  const out: RollNote[] = [];
  for (const note of band) {
    const kind = note.step > playhead ? 'foreseen' : 'played';
    const at = placed(note, byNote, range, playhead, kind, null);
    if (at) out.push(at);
  }
  for (const player of players)
    for (const note of player.notes) {
      const at = placed(
        note,
        byNote,
        range,
        playhead,
        player.local ? 'own' : 'other',
        player.colour,
      );
      if (at) out.push(at);
    }
  return out;
}

/** The lines where bars start, on the roll, from the top. */
export function rollBars(starts: readonly number[], playhead: number): number[] {
  return starts.map((start) => rollY(start, playhead)).filter((y) => y > 0 && y < 1);
}
