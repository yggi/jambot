/**
 * Chords: stacks of every other degree of a scale, and the named qualities.
 *
 * `stack` builds chords from the primitive: stacking every other degree of a
 * diatonic mode gives its triads and sevenths, and every mode has the same
 * set of them (3 major, 3 minor and 1 diminished triad). The named qualities
 * are interval sets; the tests show that the diatonic ones are exactly those
 * stacks.
 */

import { degree } from './degrees.ts';
import { normalizeWords } from './intervals.ts';

/** Semitones above the chord's lowest degree: every other degree of `set`, `size` of them. */
export function stack(set: readonly number[], d: number, size: number, n = 12): number[] {
  const bottom = degree(set, d, n);
  return Array.from({ length: size }, (_, i) => degree(set, d + 2 * i, n) - bottom);
}

export interface ChordQuality {
  /** Semitones above the root, starting with 0. */
  intervals: readonly number[];
  /** Case-sensitive, as written after a root: `m7` is not `M7`. */
  symbols: readonly string[];
  /** Case-insensitive; hyphens read as spaces. */
  words: readonly string[];
}

const quality = (intervals: number[], symbols: string[], words: string[]): ChordQuality => ({
  intervals,
  symbols,
  words,
});

export const CHORD_QUALITIES: Record<string, ChordQuality> = {
  major: quality([0, 4, 7], ['', 'maj', 'M'], ['major', 'major triad']),
  minor: quality([0, 3, 7], ['m', 'min', '-'], ['minor', 'minor triad']),
  diminished: quality([0, 3, 6], ['dim', '°', 'o'], ['diminished', 'diminished triad']),
  augmented: quality([0, 4, 8], ['aug', '+'], ['augmented', 'augmented triad']),
  sus2: quality([0, 2, 7], ['sus2'], ['suspended second']),
  sus4: quality([0, 5, 7], ['sus4', 'sus'], ['suspended fourth', 'suspended']),
  '5': quality([0, 7], ['5'], ['power chord', 'power']),
  '6': quality([0, 4, 7, 9], ['6', 'maj6'], ['sixth', 'major sixth']),
  m6: quality([0, 3, 7, 9], ['m6', 'min6', '-6'], ['minor sixth']),
  '7': quality([0, 4, 7, 10], ['7', 'dom7'], ['seventh', 'dominant seventh', 'dominant']),
  maj7: quality([0, 4, 7, 11], ['maj7', 'M7', 'Δ', 'Δ7', 'ma7'], ['major seventh']),
  m7: quality([0, 3, 7, 10], ['m7', 'min7', '-7'], ['minor seventh']),
  mMaj7: quality([0, 3, 7, 11], ['mMaj7', 'm(maj7)', 'mM7', 'minMaj7'], ['minor major seventh']),
  m7b5: quality(
    [0, 3, 6, 10],
    ['m7b5', 'm7♭5', 'ø', 'ø7', 'min7b5', '-7b5'],
    ['half diminished', 'half diminished seventh'],
  ),
  dim7: quality([0, 3, 6, 9], ['dim7', '°7', 'o7'], ['diminished seventh']),
  '9': quality([0, 4, 7, 10, 14], ['9', 'dom9'], ['ninth', 'dominant ninth']),
  maj9: quality([0, 4, 7, 11, 14], ['maj9', 'M9', 'Δ9'], ['major ninth']),
  m9: quality([0, 3, 7, 10, 14], ['m9', 'min9', '-9'], ['minor ninth']),
  add9: quality([0, 4, 7, 14], ['add9'], ['add nine', 'added ninth']),
};

/** The quality named by a symbol or words, if any. */
export function parseChordQuality(text: string): string | undefined {
  const trimmed = text.trim();
  const words = normalizeWords(trimmed);
  for (const [name, named] of Object.entries(CHORD_QUALITIES)) {
    if (named.symbols.includes(trimmed)) return name;
  }
  for (const [name, named] of Object.entries(CHORD_QUALITIES)) {
    if (named.words.includes(words)) return name;
  }
  return undefined;
}

/** The name of the quality with exactly these intervals, if any. */
export function qualityOf(intervals: readonly number[]): string | undefined {
  const wanted = intervals.join();
  return Object.entries(CHORD_QUALITIES).find(
    ([, named]) => named.intervals.join() === wanted,
  )?.[0];
}
