/**
 * What the band is heard playing right now, for the instruments and the
 * stage's tracks to show: the lead's notes on the keyboard, the drums' on
 * the pads, and each of the band's four tracks on the stage. A hit sounds
 * from its scheduled time for its duration; `at(seconds)` reads which notes
 * are sounding then, and drops whatever can no longer be, the same way
 * `Heard` drops positions already taken.
 */

import type { Part } from '@jambot/engine';

/** One of the band's four tracks, as the stage and the instruments show it. */
export type TrackPart = 'drums' | 'bass' | 'comp' | 'lead';

export const TRACK_PARTS: readonly TrackPart[] = ['drums', 'bass', 'comp', 'lead'];

/** The comp's `pad` and `stab` both sound on the one chords track (L6). */
export function trackPartOf(part: Part): TrackPart {
  return part === 'pad' || part === 'stab' ? 'comp' : part;
}

export interface Hit {
  readonly part: TrackPart;
  readonly note: number;
  readonly seconds: number;
  readonly duration: number;
}

export type SoundingNotes = Readonly<Record<TrackPart, readonly number[]>>;

const NONE: SoundingNotes = { drums: [], bass: [], comp: [], lead: [] };

export class Sounding {
  #hits: Hit[] = [];

  /** A hit, in time order. */
  push(hit: Hit) {
    this.#hits.push(hit);
  }

  /** Each track's notes sounding at `seconds`; a hit that ended before it goes. */
  at(seconds: number): SoundingNotes {
    this.#hits = this.#hits.filter((hit) => hit.seconds + hit.duration > seconds);
    const notesOf = (part: TrackPart) => [
      ...new Set(
        this.#hits.filter((hit) => hit.part === part && hit.seconds <= seconds).map((h) => h.note),
      ),
    ];
    const notes = Object.fromEntries(TRACK_PARTS.map((part) => [part, notesOf(part)])) as Record<
      TrackPart,
      number[]
    >;
    return TRACK_PARTS.every((part) => notes[part].length === 0) ? NONE : notes;
  }

  clear() {
    this.#hits = [];
  }
}
