/**
 * The harmonic history: which pitch classes the band has actually sounded
 * lately, weighted by how often and how recently, for a live radar over the
 * circle of fifths. Only the harmonic performers count; a drum hit carries
 * no pitch class worth reading as harmony, so it's ignored. `push` takes
 * each note as it is scheduled, one bar at a time; a later bar's first note
 * decays every weight by how many bars passed silently between, so the
 * shape follows what the band is playing now, fading rather than cutting
 * off what it played a while ago.
 */

import { mod } from '@jambot/theory';
import type { Performer } from './sounding.ts';

/** One weight per pitch class, 0–11, C = 0; never negative. */
export type HarmonicWeights = readonly number[];

export const EMPTY_HISTORY: HarmonicWeights = new Array(12).fill(0);

/** What a bar's weight keeps into the next: roughly four bars' worth of memory. */
const DECAY_PER_BAR = 0.85;

export class HarmonicHistory {
  #bar: number | null = null;
  #weights: number[] = [...EMPTY_HISTORY];

  /** A note played in `bar` by `performer`, MIDI 0–127; ignored for the drums. */
  push(performer: Performer, bar: number, note: number) {
    if (performer === 'drums') return;
    if (this.#bar !== null && bar > this.#bar) {
      const factor = DECAY_PER_BAR ** (bar - this.#bar);
      this.#weights = this.#weights.map((w) => w * factor);
    }
    this.#bar = bar;
    this.#weights[mod(note, 12)]! += 1;
  }

  /** The current weights, as last left by `push`. */
  get(): HarmonicWeights {
    return [...this.#weights];
  }

  clear() {
    this.#bar = null;
    this.#weights = [...EMPTY_HISTORY];
  }
}
