/**
 * A pitch tracker that has only the past, for a live sound (#298): it keeps
 * the newest `window` samples, and every `hop` samples reads their pitch, so
 * what it says at any moment is the pitch of the sound half a window ago. The
 * window is the trade: 1024 samples (21 ms) follows a pitch that moves, and
 * holds 2.3 periods of an A2; 2048 is steadier and twice as late.
 */

import { estimatePitch, type PitchEstimate } from './pitch.ts';

export interface TrackerOptions {
  sampleRate: number;
  /** The samples the pitch is read from: 1024 by default. */
  window?: number;
  /** How many samples between looks: 256 by default. A look costs about as much as a fifth of a millisecond at 1024. */
  hop?: number;
  /** The range looked in, in Hz: 70 to 1000. */
  minHz?: number;
  maxHz?: number;
  /** Below this clarity there is no pitch: 0.6 by default. */
  minClarity?: number;
}

export class PitchTracker {
  readonly window: number;
  readonly hop: number;
  readonly #sampleRate: number;
  readonly #minHz: number;
  readonly #maxHz: number;
  readonly #minClarity: number;
  readonly #ring: Float64Array;
  #total = 0;
  #sinceLook = 0;
  #latest: PitchEstimate | undefined;

  constructor({
    sampleRate,
    window = 1024,
    hop = 256,
    minHz = 70,
    maxHz = 1000,
    minClarity = 0.6,
  }: TrackerOptions) {
    this.#sampleRate = sampleRate;
    this.window = window;
    this.hop = hop;
    this.#minHz = minHz;
    this.#maxHz = maxHz;
    this.#minClarity = minClarity;
    this.#ring = new Float64Array(window);
  }

  /** Take in a block, and say the pitch as of the latest look: none until the window has filled, and where the last look found none. */
  push(block: ArrayLike<number>): PitchEstimate | undefined {
    for (let i = 0; i < block.length; i++) {
      this.#ring[this.#total % this.window] = block[i]!;
      this.#total++;
      if (++this.#sinceLook >= this.hop) {
        this.#sinceLook = 0;
        if (this.#total >= this.window) this.#look();
      }
    }
    return this.#latest;
  }

  #look(): void {
    const window = new Float64Array(this.window);
    const start = this.#total % this.window;
    for (let i = 0; i < this.window; i++) window[i] = this.#ring[(start + i) % this.window]!;
    this.#latest = estimatePitch(window, this.#sampleRate, {
      minHz: this.#minHz,
      maxHz: this.#maxHz,
      minClarity: this.#minClarity,
    });
  }
}
