/**
 * The correction of a pitch toward a scale (#298): what ratio to move the
 * sound by so that the note heard becomes the nearest note of the scale, and
 * how fast. The retune time is the musical control: none is a hard snap, the
 * robot voice; a few hundred milliseconds lets the wander and the vibrato
 * through and pulls the average. A pitch that is lost is held for a moment
 * and then released, so a breath does not jerk the sound.
 */

/** The notes of C major, as pitch classes. */
export const MAJOR: readonly number[] = [0, 2, 4, 5, 7, 9, 11];

/** The note of a scale nearest to `note` (fractional, MIDI numbers, C = 0 mod 12): the higher where two are as near. */
export function nearestNote(note: number, scale: readonly number[]): number {
  const octave = Math.floor(note / 12) * 12;
  let best = Number.NaN;
  for (const base of [octave - 12, octave, octave + 12])
    for (const degree of scale) {
      const candidate = base + degree;
      if (
        Number.isNaN(best) ||
        Math.abs(candidate - note) < Math.abs(best - note) - 1e-9 ||
        (Math.abs(Math.abs(candidate - note) - Math.abs(best - note)) <= 1e-9 && candidate > best)
      )
        best = candidate;
    }
  return best;
}

export interface CorrectorOptions {
  /** The pitch classes to snap to, 0 to 11 from C. */
  scale: readonly number[];
  /** The time constant of the glide toward a snap, in seconds: 0 is at once. */
  retuneSeconds: number;
  /** How long a correction is held when the pitch is lost, in seconds: 0.15 by default. */
  holdSeconds?: number;
  /** The most it moves a sound, in cents either way: 300 by default. */
  limitCents?: number;
  /** The A4 of the notes, in Hz: 440 by default. */
  reference?: number;
}

export class Corrector {
  scale: readonly number[];
  retuneSeconds: number;
  holdSeconds: number;
  limitCents: number;
  reference: number;
  /** How far the sound is being moved now, in cents. */
  offset = 0;
  #lost = 0;

  constructor({
    scale,
    retuneSeconds,
    holdSeconds = 0.15,
    limitCents = 300,
    reference = 440,
  }: CorrectorOptions) {
    this.scale = scale;
    this.retuneSeconds = retuneSeconds;
    this.holdSeconds = holdSeconds;
    this.limitCents = limitCents;
    this.reference = reference;
  }

  /**
   * The ratio to move the sound by for the next `seconds` of it, given the
   * pitch heard (Hz, or undefined where there is none).
   */
  next(hz: number | undefined, seconds: number): number {
    if (hz !== undefined && hz > 0) {
      this.#lost = 0;
      const note = 69 + 12 * Math.log2(hz / this.reference);
      const want = Math.max(
        -this.limitCents,
        Math.min(this.limitCents, (nearestNote(note, this.scale) - note) * 100),
      );
      this.offset = this.#glide(want, seconds, this.retuneSeconds);
    } else {
      this.#lost += seconds;
      // Held, and then let go toward none over a tenth of a second.
      if (this.#lost > this.holdSeconds) this.offset = this.#glide(0, seconds, 0.1);
    }
    return 2 ** (this.offset / 1200);
  }

  #glide(to: number, seconds: number, tau: number): number {
    return tau <= 0 ? to : this.offset + (to - this.offset) * (1 - Math.exp(-seconds / tau));
  }
}
