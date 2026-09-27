/**
 * What the band is heard playing right now, for the instruments and the
 * stage's performers to show: the lead's notes on the keyboard, the drums'
 * on the pads, and each of the band's four performers on the stage. A hit
 * sounds from its scheduled time for its duration; `at(seconds)` reads
 * which notes are sounding then, and drops whatever can no longer be, the
 * same way `Heard` drops positions already taken.
 */

import type { Part } from '@jambot/engine';

/**
 * One of the band's four performers, as the stage and the instruments show
 * it: the composer writes what each plays, and the performer is what plays
 * it — the band's own voice, or a human at that voice's instrument.
 */
export type Performer = 'drums' | 'bass' | 'comp' | 'lead';

export const PERFORMERS: readonly Performer[] = ['drums', 'bass', 'comp', 'lead'];

/**
 * The comp is one machine that writes two parts, `pad` and `stab` (L6, two
 * parts for one machine's note-off bookkeeping); this view groups both under
 * the one performer a person would call by one name, "chords" (R4).
 */
export function performerOf(part: Part): Performer {
  return part === 'pad' || part === 'stab' ? 'comp' : part;
}

export interface Hit {
  readonly performer: Performer;
  readonly note: number;
  readonly seconds: number;
  readonly duration: number;
}

export type SoundingNotes = Readonly<Record<Performer, readonly number[]>>;

const NONE: SoundingNotes = { drums: [], bass: [], comp: [], lead: [] };

export class Sounding {
  #hits: Hit[] = [];

  /** A hit, in time order. */
  push(hit: Hit) {
    this.#hits.push(hit);
  }

  /** Each performer's notes sounding at `seconds`; a hit that ended before it goes. */
  at(seconds: number): SoundingNotes {
    this.#hits = this.#hits.filter((hit) => hit.seconds + hit.duration > seconds);
    const notesOf = (performer: Performer) => [
      ...new Set(
        this.#hits
          .filter((hit) => hit.performer === performer && hit.seconds <= seconds)
          .map((h) => h.note),
      ),
    ];
    const notes = Object.fromEntries(
      PERFORMERS.map((performer) => [performer, notesOf(performer)]),
    ) as Record<Performer, number[]>;
    return PERFORMERS.every((performer) => notes[performer].length === 0) ? NONE : notes;
  }

  clear() {
    this.#hits = [];
  }
}
