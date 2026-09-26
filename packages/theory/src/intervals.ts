/**
 * Intervals, generic and specific (Clough and Myerson's terms).
 *
 * A generic interval counts degrees (a second is 1, a fifth 4). A specific
 * interval counts height: the perfect fifth is 7 semitones. In the diatonic
 * set each generic interval comes in one size or two sizes a semitone apart (a
 * second is 1 or 2 semitones). That is a property of maximally even sets, so
 * the sizes come from the primitive. A specific interval (m2, perfect fifth)
 * names one of those sizes.
 */

import { even } from './even.ts';
import { type Helix, heightOf } from './helix.ts';
import { normalizeWords } from './words.ts';

export interface Interval {
  /** Degrees spanned: 0 is a unison, 7 an octave. */
  generic: number;
  /** Heights spanned: one size for a specific interval, every size for a generic one. */
  specific: number[];
}

/** The sizes in height of a generic interval on a helix, sorted. */
export function sizes(helix: Helix, generic: number): number[] {
  const found = new Set(
    helix.heights.map((_, d) => heightOf(helix, d + generic) - heightOf(helix, d)),
  );
  return [...found].sort((a, b) => a - b);
}

const diatonic = even(7, 12);

interface NamedInterval extends Interval {
  symbols: readonly string[];
  words: readonly string[];
}

const named = (
  generic: number,
  height: number,
  symbols: string[],
  words: string[],
): NamedInterval => ({ generic, specific: [height], symbols, words });

/** The specific intervals up to the octave, by their short symbol. */
export const INTERVALS: Record<string, NamedInterval> = {
  P1: named(0, 0, ['P1'], ['unison', 'perfect unison']),
  m2: named(1, 1, ['m2'], ['minor second', 'semitone', 'half step', 'half tone']),
  M2: named(1, 2, ['M2'], ['major second', 'whole step', 'whole tone', 'tone']),
  m3: named(2, 3, ['m3'], ['minor third']),
  M3: named(2, 4, ['M3'], ['major third']),
  P4: named(3, 5, ['P4'], ['perfect fourth']),
  A4: named(3, 6, ['A4', 'TT'], ['augmented fourth', 'tritone']),
  d5: named(4, 6, ['d5'], ['diminished fifth']),
  P5: named(4, 7, ['P5'], ['perfect fifth']),
  m6: named(5, 8, ['m6'], ['minor sixth']),
  M6: named(5, 9, ['M6'], ['major sixth']),
  m7: named(6, 10, ['m7'], ['minor seventh']),
  M7: named(6, 11, ['M7'], ['major seventh']),
  P8: named(7, 12, ['P8'], ['octave', 'perfect octave']),
};

/** The generic intervals by their words. */
export const GENERIC_INTERVALS: Record<string, number> = {
  second: 1,
  third: 2,
  fourth: 3,
  fifth: 4,
  sixth: 5,
  seventh: 6,
};

/** Symbols are case-sensitive (m2 is not M2); words are not. */
export function parseInterval(text: string): Interval | undefined {
  const trimmed = text.trim();
  const word = normalizeWords(trimmed);
  for (const named of Object.values(INTERVALS)) {
    if (named.symbols.includes(trimmed) || named.words.includes(word))
      return { generic: named.generic, specific: named.specific };
  }
  const generic = GENERIC_INTERVALS[word];
  return generic === undefined ? undefined : { generic, specific: sizes(diatonic, generic) };
}

/**
 * The degrees named by their function. A degree is a generic interval above
 * the tonic, so it takes that interval's sizes; only the seventh has a name for
 * each size, the leading tone a semitone below the octave and the subtonic a
 * whole tone below.
 */
export const DEGREE_NAMES: Record<string, Interval> = {
  tonic: { generic: 0, specific: sizes(diatonic, 0) },
  supertonic: { generic: 1, specific: sizes(diatonic, 1) },
  mediant: { generic: 2, specific: sizes(diatonic, 2) },
  subdominant: { generic: 3, specific: sizes(diatonic, 3) },
  dominant: { generic: 4, specific: sizes(diatonic, 4) },
  submediant: { generic: 5, specific: sizes(diatonic, 5) },
  'leading tone': { generic: 6, specific: [11] },
  'leading note': { generic: 6, specific: [11] },
  subtonic: { generic: 6, specific: [10] },
};

export function parseDegreeName(text: string): Interval | undefined {
  return DEGREE_NAMES[normalizeWords(text)];
}

/**
 * The n-th partial of the harmonic series, in semitones above the
 * fundamental, on the nearest semitone: 1 is the fundamental, 2 the octave, 3
 * the twelfth. Partials 1 to 5 are a major triad; the 7th is 31 cents from
 * the nearest semitone.
 */
export function partial(n: number): number {
  return Math.round(12 * Math.log2(n));
}
