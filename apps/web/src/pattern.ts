/**
 * The band's own notes of the last bar it finished, one track per band
 * member, for a track's piano roll. `push` takes each event as it is
 * scheduled, in time order, one bar and track at a time; once a later
 * bar's first note arrives, the bar before it is kept whole across every
 * track and `get()` returns it, so a roll never changes mid-bar. Before any
 * bar has finished, `get()` gives the one now filling in.
 */

import type { TrackPart } from './sounding.ts';

export interface PatternNote {
  /** The step of the bar it starts on, 0–15. */
  readonly step: number;
  /** The MIDI note, 0–127, C4 = 60. */
  readonly note: number;
  /** How long it sounds, in steps; it may run past the bar. */
  readonly length: number;
}

export type BarPattern = Readonly<Record<TrackPart, readonly PatternNote[]>>;

export const EMPTY_PATTERN: BarPattern = { drums: [], bass: [], comp: [], lead: [] };

function empty(): Record<TrackPart, PatternNote[]> {
  return { drums: [], bass: [], comp: [], lead: [] };
}

export class Pattern {
  #bar: number | null = null;
  #building = empty();
  #last: BarPattern | null = null;

  /** A note of `part`'s `bar`, in time order; one of a bar already finished is ignored. */
  push(part: TrackPart, bar: number, note: PatternNote) {
    this.#bar ??= bar;
    if (bar > this.#bar) {
      this.#last = this.#building;
      this.#building = empty();
      this.#bar = bar;
    }
    if (bar === this.#bar) this.#building[part] = [...this.#building[part], note];
  }

  /** The last bar finished in full, or the one now filling in before any bar has. */
  get(): BarPattern {
    return { ...(this.#last ?? this.#building) };
  }

  clear() {
    this.#bar = null;
    this.#building = empty();
    this.#last = null;
  }
}
