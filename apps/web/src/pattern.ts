/**
 * The band's own notes of its last bars, one entry per band performer, for
 * the tracks' grid. `push` takes each event as it is scheduled, in time
 * order, one bar and performer at a time, so the bar now building fills in
 * a moment before it is heard, and a bar before it is whole. `get()` gives
 * the last `PATTERN_BARS` bars and the one building, oldest first; the bar
 * building can run a bar ahead of the bar heard, for as long as the band
 * schedules ahead (`LOOKAHEAD`).
 *
 * A bar keeps its number and the motif the lead played in it (`offered`,
 * from the bar's own `offer` as the band composed it), so what a bar shows
 * and whose motif it is are always the same bar's. The lead plays an offer
 * whole while it stands, so naming it per bar is exact for the lead.
 *
 * `playedIn` is the players' side of the same bar: what each source played
 * in it, placed on the steps the Muse rounds them to.
 */

import {
  type BandBar,
  SONG_CLOCK,
  type SongClock,
  heardInBar,
  heardStep,
  type HeardNote,
} from '@jambot/engine';
import type { Attribution } from './attribution.ts';
import { type Performer, performerOf } from './sounding.ts';

/** How many bars the tracks show: the bar heard in the middle, with as many behind it as ahead. */
export const PATTERN_BARS = 5;

/** How many of them come before the bar heard. */
export const BARS_BEHIND = 2;

export interface PatternNote {
  /** The step of the bar it starts on, from 0 up to its bar's steps. */
  readonly step: number;
  /** The MIDI note, 0–127, C4 = 60. */
  readonly note: number;
  /** How long it sounds, in steps; it may run past the bar. */
  readonly length: number;
}

export type BarPattern = Readonly<Record<Performer, readonly PatternNote[]>>;

export const EMPTY_PATTERN: BarPattern = { drums: [], bass: [], comp: [], lead: [] };

/** A bar of the band's notes, the bar it is, and the motif the lead played in it. */
export interface PatternBar {
  /** Counted from the song's start. */
  readonly bar: number;
  readonly parts: BarPattern;
  /** The source of the motif the lead played in it, by id, and the bar it was heard in; or null. */
  readonly motif: Attribution | null;
}

function empty(): Record<Performer, PatternNote[]> {
  return { drums: [], bass: [], comp: [], lead: [] };
}

export class Pattern {
  /** The bars kept, by number, oldest first; the last is the one building. */
  #bars = new Map<number, Record<Performer, PatternNote[]>>();
  /** The motif offered for each bar composed and still kept or ahead. */
  #offers = new Map<number, Attribution | null>();

  /** A note of `performer`'s `bar`, in time order; one of a bar before the one building is ignored. */
  push(performer: Performer, bar: number, note: PatternNote) {
    const building = [...this.#bars.keys()].at(-1);
    if (building !== undefined && bar < building) return;
    if (bar !== building) {
      this.#bars.set(bar, empty());
      for (const b of this.#bars.keys()) if (b < bar - PATTERN_BARS) this.#bars.delete(b);
      for (const b of this.#offers.keys()) if (b < bar - PATTERN_BARS) this.#offers.delete(b);
    }
    this.#bars.get(bar)![performer].push(note);
  }

  /** A bar composed, with the offer the lead plays in it, or null; kept by source and bar heard alone. */
  offered(bar: number, offer: Attribution | null) {
    this.#offers.set(bar, offer && { source: offer.source, bar: offer.bar });
  }

  /** The last `PATTERN_BARS` bars and the one building, oldest first; none before any note. */
  get(): readonly PatternBar[] {
    return [...this.#bars].map(([bar, parts]) => ({
      bar,
      parts: {
        drums: [...parts.drums],
        bass: [...parts.bass],
        comp: [...parts.comp],
        lead: [...parts.lead],
      },
      motif: this.#offers.get(bar) ?? null,
    }));
  }

  clear() {
    this.#bars.clear();
    this.#offers.clear();
  }
}

/**
 * A bar composed, or foreseen (`foresight`), as the tracks draw it: its
 * notes under their performers, and the motif the lead plays in it.
 */
export function patternBarOf(bar: BandBar): PatternBar {
  const parts = empty();
  for (const { part, step, note, length } of bar.dough)
    parts[performerOf(part)].push({ step, note, length });
  return {
    bar: bar.bar,
    parts,
    motif: bar.offer && { source: bar.offer.source, bar: bar.offer.bar },
  };
}

/**
 * What each source played in `bar`, as rows of notes, by source id: each as
 * the Muse hears it (`heardInBar`, a phrase read so far), in the bar and on
 * the step she read it on, so the row shows what she heard. A note still held, or released on the
 * step it was struck, lasts one step.
 */
export function playedIn(
  notes: readonly HeardNote[],
  bar: number,
  clock: SongClock = SONG_CLOCK,
): Readonly<Record<string, readonly PatternNote[]>> {
  const start = clock.barStart(bar);
  const rows: Record<string, PatternNote[]> = {};
  for (const { source, notes: heard } of heardInBar(notes, bar, 'phrases', clock))
    for (const n of heard) {
      const step = heardStep(n) - start;
      const end = n.end === null ? null : heardStep({ position: n.end }) - start;
      const length = end === null ? 1 : Math.max(1, end - step);
      (rows[source] ??= []).push({ step, note: n.note, length });
    }
  return rows;
}
