/**
 * What the band is heard playing right now, for the instruments to show: the
 * lead's notes on the keyboard, the drums' on the pads. A hit sounds from
 * its scheduled time for its duration; `at(seconds)` reads which notes are
 * sounding then, and drops whatever can no longer be, the same way `Heard`
 * drops positions already taken.
 */

export interface Hit {
  readonly part: 'lead' | 'drums';
  readonly note: number;
  readonly seconds: number;
  readonly duration: number;
}

export interface SoundingNotes {
  readonly lead: readonly number[];
  readonly drums: readonly number[];
}

const NONE: SoundingNotes = { lead: [], drums: [] };

export class Sounding {
  #hits: Hit[] = [];

  /** A hit, in time order. */
  push(hit: Hit) {
    this.#hits.push(hit);
  }

  /** The lead's and the drums' notes sounding at `seconds`; a hit that ended before it goes. */
  at(seconds: number): SoundingNotes {
    this.#hits = this.#hits.filter((hit) => hit.seconds + hit.duration > seconds);
    const notesOf = (part: Hit['part']) => [
      ...new Set(
        this.#hits.filter((hit) => hit.part === part && hit.seconds <= seconds).map((h) => h.note),
      ),
    ];
    const lead = notesOf('lead');
    const drums = notesOf('drums');
    return lead.length === 0 && drums.length === 0 ? NONE : { lead, drums };
  }

  clear() {
    this.#hits = [];
  }
}
