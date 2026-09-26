/**
 * Named scales. Where a scale is maximally even it is taken from the
 * primitive (the modes of 7 of 12 and 5 of 12, 6, 8 and 12 of 12); the rest
 * are listed as sets and marked as not even.
 */

import { even, shift } from './even.ts';
import { normalizeWords } from './intervals.ts';
import { DIATONIC_MODE_NAMES, modes } from './modes.ts';

export interface NamedScale {
  /** Semitones above the tonic, starting with 0. */
  set: readonly number[];
  /** True when the set is maximally even, which the tests check. */
  even: boolean;
  aliases: readonly string[];
}

const DIATONIC_ALIASES: Record<string, string[]> = {
  ionian: ['major'],
  aeolian: ['minor', 'natural minor'],
};

const diatonic = Object.fromEntries(
  DIATONIC_MODE_NAMES.map((name, b) => [
    name,
    { set: modes(7, 12)[b]!, even: true, aliases: DIATONIC_ALIASES[name] ?? [] },
  ]),
);

const octatonic = even(8, 12);

export const SCALES: Record<string, NamedScale> = {
  ...diatonic,
  'major pentatonic': {
    set: modes(5, 12)[4]!,
    even: true,
    aliases: ['pentatonic', 'pentatonic major'],
  },
  'minor pentatonic': { set: modes(5, 12)[1]!, even: true, aliases: ['pentatonic minor'] },
  'whole tone': { set: even(6, 12), even: true, aliases: ['wholetone'] },
  chromatic: { set: even(12, 12), even: true, aliases: [] },
  diminished: {
    set: octatonic,
    even: true,
    aliases: ['octatonic', 'whole half', 'whole half diminished'],
  },
  'half whole diminished': {
    set: shift(octatonic, -2, 12),
    even: true,
    aliases: ['half whole', 'dominant diminished'],
  },
  blues: { set: [0, 3, 5, 6, 7, 10], even: false, aliases: ['blues scale', 'minor blues'] },
  'harmonic minor': { set: [0, 2, 3, 5, 7, 8, 11], even: false, aliases: [] },
  'melodic minor': { set: [0, 2, 3, 5, 7, 9, 11], even: false, aliases: ['jazz minor'] },
  augmented: { set: [0, 3, 4, 7, 8, 11], even: false, aliases: ['augmented scale'] },
};

/** The canonical name of a scale, from its name or an alias, in any case. */
export function parseScaleName(text: string): string | undefined {
  const words = normalizeWords(text);
  for (const [name, scale] of Object.entries(SCALES)) {
    if ([name, ...scale.aliases].some((alias) => normalizeWords(alias) === words)) return name;
  }
  return undefined;
}
