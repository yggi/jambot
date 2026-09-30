/**
 * Frequency and pitch: equal temperament against a reference, and how far a
 * sound is from the nearest note.
 *
 * A note is a MIDI note number, with A4 = 69 at a reference of 440 Hz unless
 * told otherwise (415, 432 and 466.16 are the baroque, the "verdi" and the
 * classical-pitch choices). Twelve notes an octave make a semitone the ratio
 * 2^(1/12), and a cent is a hundredth of one, so the same 12 · log2 that
 * places a partial on the nearest semitone (`partial`) reads a sound's
 * distance from it.
 */

/** The MIDI note number of A4, the note the reference frequency belongs to. */
export const A4_MIDI = 69;

/** The usual reference frequency of A4, in Hz. */
export const A4_HZ = 440;

/** A frequency read as the nearest note and the distance from it. */
export interface Pitch {
  /** The nearest note's MIDI number. It is not held to 0 to 127: a sound may lie below or above the notes MIDI can send. */
  midi: number;
  /** How far the sound is from that note, sharp positive, from −50 up to and including 50. */
  cents: number;
  /** The nearest note's own frequency, in Hz. */
  hz: number;
  /** How far the sound is from it, in Hz: sharp positive, so `hz + offsetHz` is the sound. */
  offsetHz: number;
}

/**
 * The frequency of a note, in Hz. The note may be fractional, so a note and
 * some cents is `frequencyOf(midi + cents / 100)`.
 */
export function frequencyOf(midi: number, reference: number = A4_HZ): number {
  return reference * 2 ** ((midi - A4_MIDI) / 12);
}

/**
 * The nearest note to a frequency, and the distance from it in cents and Hz.
 * Half-way between two notes it may take either. A sound that is not a
 * frequency (silence read as zero, a negative or non-finite number) has no
 * pitch, and so does a reference that is not one.
 */
export function pitchOf(hz: number, reference: number = A4_HZ): Pitch | undefined {
  if (!(hz > 0) || !Number.isFinite(hz) || !(reference > 0) || !Number.isFinite(reference))
    return undefined;
  const height = A4_MIDI + 12 * Math.log2(hz / reference);
  const midi = Math.round(height) + 0; // + 0 turns a −0 into 0
  const nearest = frequencyOf(midi, reference);
  return { midi, cents: 100 * (height - midi), hz: nearest, offsetHz: hz - nearest };
}
