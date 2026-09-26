/**
 * Chords: the named qualities, each a stack of heights above the root.
 *
 * A chord of a key is built by composition: every other degree of 7, shifted
 * to the chord's degree and composed with the key (see `compose`). Every
 * diatonic mode gives the same triads and sevenths that way (3 major, 3 minor
 * and 1 diminished triad), and the tests show that the diatonic qualities are
 * exactly those. A stack can span more than one turn, as a ninth does, so it
 * is not a helix. Split at the octave, it is one: a chord is the helix of its
 * tones below the octave, plus its tensions, the tones above it (#38).
 */

import type { Helix } from './helix.ts';
import { partial } from './intervals.ts';
import { normalizeWords, withoutKindWord } from './words.ts';

export interface ChordQuality {
  /** Heights above the root, starting with 0, in register. */
  stack: readonly number[];
  /** Case-sensitive, as written after a root: `m7` is not `M7`. */
  symbols: readonly string[];
  /** Case-insensitive; hyphens read as spaces. */
  words: readonly string[];
}

const quality = (stack: number[], symbols: string[], words: string[]): ChordQuality => ({
  stack,
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
  '7': quality([0, 4, 7, 10], ['7', 'dom7', 'Mm7'], ['seventh', 'dominant seventh', 'dominant']),
  maj7: quality([0, 4, 7, 11], ['maj7', 'M7', 'Δ', 'Δ7', 'ma7', 'MM7'], ['major seventh']),
  m7: quality([0, 3, 7, 10], ['m7', 'min7', '-7', 'mm7'], ['minor seventh']),
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
  harmonics: quality([1, 2, 3, 4, 5].map(partial), [], ['harmonics', 'harmonic series']),
};

/**
 * A chord: the helix of its tones within one turn of its root, and its
 * tensions, the tones from one turn above the root up (#38, P6). The helix
 * composes, shifts and mirrors; the tensions ride on it. Heights are in
 * register, as in the stack.
 */
export interface Chord {
  readonly helix: Helix;
  readonly tensions: readonly number[];
}

/**
 * A stack of heights split at one turn above its root: the helix below, the
 * tensions from there up. A stack that doesn't rise is no chord.
 */
export function splitChord(stack: readonly number[], cycle = 12): Chord | undefined {
  if (stack.length === 0 || stack.some((x, i) => i > 0 && x <= stack[i - 1]!)) return undefined;
  const turn = stack[0]! + cycle;
  return {
    helix: { cycle, heights: stack.filter((x) => x < turn) },
    tensions: stack.filter((x) => x >= turn),
  };
}

/** The chord's stack: its helix, then its tensions. `splitChord` undone. */
export function joinChord(chord: Chord): number[] {
  return [...chord.helix.heights, ...chord.tensions];
}

/**
 * The quality named by a symbol or words, if any. A symbol matches as written
 * first, then words, then a symbol in another case (`Sus4`, `MAJ7`). Every
 * symbol whose case carries meaning is listed in each of its cases, the
 * classical `Mm7` `mm7` `MM7` `mM7` among them, so the last step never reaches
 * one.
 */
export function parseChordQuality(text: string): string | undefined {
  const trimmed = text.trim();
  return (
    QUALITY_BY_SYMBOL.get(trimmed) ??
    QUALITY_BY_WORDS.get(withoutKindWord(normalizeWords(trimmed), 'chord')) ??
    QUALITY_BY_LOWER_SYMBOL.get(trimmed.toLowerCase())
  );
}

/** Each lookup maps to the first quality that claims the key, in table order. */
const QUALITY_BY_SYMBOL = new Map<string, string>();
const QUALITY_BY_WORDS = new Map<string, string>();
const QUALITY_BY_LOWER_SYMBOL = new Map<string, string>();
const claim = (map: Map<string, string>, key: string, name: string) => {
  if (!map.has(key)) map.set(key, name);
};
for (const [name, named] of Object.entries(CHORD_QUALITIES)) {
  for (const symbol of named.symbols) {
    claim(QUALITY_BY_SYMBOL, symbol, name);
    claim(QUALITY_BY_LOWER_SYMBOL, symbol.toLowerCase(), name);
  }
  for (const word of named.words) claim(QUALITY_BY_WORDS, normalizeWords(word), name);
}

/** The name of the quality with exactly this stack, if any. */
export function qualityOf(stack: readonly number[]): string | undefined {
  const wanted = stack.join();
  return Object.entries(CHORD_QUALITIES).find(([, named]) => named.stack.join() === wanted)?.[0];
}
