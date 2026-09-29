/**
 * The band's own notes of the last bar it finished, one entry per band
 * performer, for a performer's piano roll. `push` takes each event as it is
 * scheduled, in time order, one bar and performer at a time; once a later
 * bar's first note arrives, the bar before it is kept whole across every
 * performer and `get()` returns it, so a roll never changes mid-bar. Before
 * any bar has finished, `get()` gives the one now filling in.
 *
 * A bar keeps its number and the motif the lead played in it (`offered`,
 * from the bar's own `offer` as the band composed it), so what a roll shows
 * and whose motif it is are always the same bar's. The lead plays an offer
 * whole while it stands, so naming it per bar is exact for the lead.
 *
 * `playedIn` is the players' side of the same bar: what each source played
 * in it, placed on the steps the Muse rounds them to.
 */

import { barStart, heardStep, heardIn, type HeardNote } from '@jambot/engine';
import type { Attribution } from './hud.ts';
import type { Performer } from './sounding.ts';

export interface PatternNote {
  /** The step of the bar it starts on, 0–15. */
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
  /** Counted from the song's start, or null before any note. */
  readonly bar: number | null;
  readonly parts: BarPattern;
  /** The source of the motif the lead played in it, by id, and the bar it was heard in; or null. */
  readonly motif: Attribution | null;
}

export const EMPTY_BAR: PatternBar = { bar: null, parts: EMPTY_PATTERN, motif: null };

function empty(): Record<Performer, PatternNote[]> {
  return { drums: [], bass: [], comp: [], lead: [] };
}

export class Pattern {
  #bar: number | null = null;
  #building = empty();
  #last: PatternBar | null = null;
  /** The motif offered for each bar composed and not yet finished. */
  #offers = new Map<number, Attribution | null>();

  /** A note of `performer`'s `bar`, in time order; one of a bar already finished is ignored. */
  push(performer: Performer, bar: number, note: PatternNote) {
    this.#bar ??= bar;
    if (bar > this.#bar) {
      this.#last = this.#view(this.#bar, this.#building);
      for (const b of this.#offers.keys()) if (b <= this.#bar) this.#offers.delete(b);
      this.#building = empty();
      this.#bar = bar;
    }
    if (bar === this.#bar) this.#building[performer] = [...this.#building[performer], note];
  }

  /** A bar composed, with the offer the lead plays in it, or null; kept by source and bar heard alone. */
  offered(bar: number, offer: Attribution | null) {
    this.#offers.set(bar, offer && { source: offer.source, bar: offer.bar });
  }

  /** The last bar finished in full, or the one now filling in before any bar has. */
  get(): PatternBar {
    if (this.#last) return this.#last;
    if (this.#bar === null) return EMPTY_BAR;
    return this.#view(this.#bar, this.#building);
  }

  clear() {
    this.#bar = null;
    this.#building = empty();
    this.#last = null;
    this.#offers.clear();
  }

  #view(bar: number, parts: BarPattern): PatternBar {
    return { bar, parts: { ...parts }, motif: this.#offers.get(bar) ?? null };
  }
}

/**
 * What each source played in `bar`, as rows of notes, by source id: each in
 * the bar and on the step the Muse rounds it to (`heardIn`, `heardStep`), so
 * the row shows what the Muse heard. A note still held, or released on the
 * step it was struck, lasts one step.
 */
export function playedIn(
  notes: readonly HeardNote[],
  bar: number,
): Readonly<Record<string, readonly PatternNote[]>> {
  const start = barStart(bar);
  const rows: Record<string, PatternNote[]> = {};
  for (const n of heardIn(notes, bar)) {
    const step = heardStep(n) - start;
    const end = n.end === null ? null : heardStep({ position: n.end }) - start;
    const length = end === null ? 1 : Math.max(1, end - step);
    (rows[n.source] ??= []).push({ step, note: n.note, length });
  }
  return rows;
}
