/**
 * Intervals, generic and specific.
 *
 * A generic interval counts scale steps (a second is one step, a fifth four).
 * In the diatonic set each generic interval comes in one size or two sizes a
 * semitone apart (a second is 1 or 2 semitones). That is a property of
 * maximally even sets, so the sizes come from the primitive. A specific
 * interval (m2, perfect fifth) names one of those sizes.
 */

import { degree } from './degrees.ts';
import { even } from './even.ts';
import { normalizeWords } from './words.ts';

export interface Interval {
  /** Scale steps spanned: 0 is a unison, 7 an octave. */
  steps: number;
  /** One size for a specific interval, both sizes for a generic one. */
  semitones: number[];
}

/** The sizes in semitones of a generic interval of `steps` in the diatonic set. */
export function genericSizes(steps: number): number[] {
  const diatonic = even(7, 12);
  const sizes = new Set(diatonic.map((_, d) => degree(diatonic, d + steps) - degree(diatonic, d)));
  return [...sizes].sort((a, b) => a - b);
}

interface NamedInterval extends Interval {
  symbols: readonly string[];
  words: readonly string[];
}

const specific = (
  steps: number,
  semitones: number,
  symbols: string[],
  words: string[],
): NamedInterval => ({ steps, semitones: [semitones], symbols, words });

/** The specific intervals up to the octave, by their short symbol. */
export const INTERVALS: Record<string, NamedInterval> = {
  P1: specific(0, 0, ['P1'], ['unison', 'perfect unison']),
  m2: specific(1, 1, ['m2'], ['minor second', 'semitone', 'half step', 'half tone']),
  M2: specific(1, 2, ['M2'], ['major second', 'whole step', 'whole tone', 'tone']),
  m3: specific(2, 3, ['m3'], ['minor third']),
  M3: specific(2, 4, ['M3'], ['major third']),
  P4: specific(3, 5, ['P4'], ['perfect fourth']),
  A4: specific(3, 6, ['A4', 'TT'], ['augmented fourth', 'tritone']),
  d5: specific(4, 6, ['d5'], ['diminished fifth']),
  P5: specific(4, 7, ['P5'], ['perfect fifth']),
  m6: specific(5, 8, ['m6'], ['minor sixth']),
  M6: specific(5, 9, ['M6'], ['major sixth']),
  m7: specific(6, 10, ['m7'], ['minor seventh']),
  M7: specific(6, 11, ['M7'], ['major seventh']),
  P8: specific(7, 12, ['P8'], ['octave', 'perfect octave']),
};

const GENERIC_WORDS: Record<string, number> = {
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
      return { steps: named.steps, semitones: named.semitones };
  }
  const steps = GENERIC_WORDS[word];
  return steps === undefined ? undefined : { steps, semitones: genericSizes(steps) };
}

/**
 * The degrees named by their function. A degree is a generic interval above
 * the tonic, so it takes that interval's sizes; only the seventh has a name for
 * each size, the leading tone a semitone below the octave and the subtonic a
 * whole tone below.
 */
const DEGREE_NAMES: Record<string, Interval> = {
  tonic: { steps: 0, semitones: genericSizes(0) },
  supertonic: { steps: 1, semitones: genericSizes(1) },
  mediant: { steps: 2, semitones: genericSizes(2) },
  subdominant: { steps: 3, semitones: genericSizes(3) },
  dominant: { steps: 4, semitones: genericSizes(4) },
  submediant: { steps: 5, semitones: genericSizes(5) },
  'leading tone': { steps: 6, semitones: [11] },
  'leading note': { steps: 6, semitones: [11] },
  subtonic: { steps: 6, semitones: [10] },
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
