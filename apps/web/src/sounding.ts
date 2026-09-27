/**
 * What the band is heard playing right now, for the instruments and the
 * stage's members to show: the lead's notes on the keyboard, the drums' on
 * the pads, and each of the band's four members on the stage. A hit sounds
 * from its scheduled time for its duration; `at(seconds)` reads which notes
 * are sounding then, and drops whatever can no longer be, the same way
 * `Heard` drops positions already taken.
 */

import type { Part } from '@jambot/engine';

/** One of the band's four members, as the stage and the instruments show it. */
export type Member = 'drums' | 'bass' | 'comp' | 'lead';

export const MEMBERS: readonly Member[] = ['drums', 'bass', 'comp', 'lead'];

/**
 * The comp is one machine that writes two parts, `pad` and `stab` (L6, two
 * parts for one machine's note-off bookkeeping); this view groups both under
 * the one member a person would call by one name, "chords" (R4).
 */
export function memberOf(part: Part): Member {
  return part === 'pad' || part === 'stab' ? 'comp' : part;
}

export interface Hit {
  readonly member: Member;
  readonly note: number;
  readonly seconds: number;
  readonly duration: number;
}

export type SoundingNotes = Readonly<Record<Member, readonly number[]>>;

const NONE: SoundingNotes = { drums: [], bass: [], comp: [], lead: [] };

export class Sounding {
  #hits: Hit[] = [];

  /** A hit, in time order. */
  push(hit: Hit) {
    this.#hits.push(hit);
  }

  /** Each member's notes sounding at `seconds`; a hit that ended before it goes. */
  at(seconds: number): SoundingNotes {
    this.#hits = this.#hits.filter((hit) => hit.seconds + hit.duration > seconds);
    const notesOf = (member: Member) => [
      ...new Set(
        this.#hits
          .filter((hit) => hit.member === member && hit.seconds <= seconds)
          .map((h) => h.note),
      ),
    ];
    const notes = Object.fromEntries(MEMBERS.map((member) => [member, notesOf(member)])) as Record<
      Member,
      number[]
    >;
    return MEMBERS.every((member) => notes[member].length === 0) ? NONE : notes;
  }

  clear() {
    this.#hits = [];
  }
}
