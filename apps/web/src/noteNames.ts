/**
 * How the screen names notes and keys: the twelve pitch classes as the
 * prototype spells them, a key in common terms, and a scale's notes and steps.
 */

import type { Key } from '@jambot/engine';
import { type DiatonicModeName, mod } from '@jambot/theory';

/** The twelve pitch classes' names, C = 0, spelled as the prototype spells them. */
export const TONIC_NAMES = [
  'C',
  'C♯',
  'D',
  'E♭',
  'E',
  'F',
  'F♯',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
] as const;

/** A key's notes, named in ascending order from the tonic, for a plain-text readout. */
export function scaleNoteNames(scale: readonly number[], tonic: number): readonly string[] {
  const from = scale.indexOf(tonic);
  const ordered = from < 0 ? scale : [...scale.slice(from), ...scale.slice(0, from)];
  return ordered.map((pitchClass) => TONIC_NAMES[pitchClass]!);
}

/** The modes by their common names: the two everyone knows are major and minor. */
export const MODE_NAMES: Readonly<Record<DiatonicModeName, string>> = {
  lydian: 'lydian',
  ionian: 'major',
  mixolydian: 'mixolydian',
  dorian: 'dorian',
  aeolian: 'minor',
  phrygian: 'phrygian',
  locrian: 'locrian',
};

/** The modes that keep their full name on screen; the rest are shown as numerals, the degree of the major scale they start on. */
export const MODE_NUMERALS: Readonly<Record<DiatonicModeName, string>> = {
  ionian: 'I',
  dorian: 'II',
  phrygian: 'III',
  lydian: 'IV',
  mixolydian: 'V',
  aeolian: 'VI',
  locrian: 'VII',
};

/** A key in common terms: "C major", "A minor", "E♭ dorian". */
export function keyName(key: Key): string {
  return `${TONIC_NAMES[key.tonic]} ${MODE_NAMES[key.mode]}`;
}

/** The semitones from each note of a scale to the next, from the tonic round to its octave. */
export function scaleSteps(scale: readonly number[], tonic: number): readonly number[] {
  const from = [...scale].sort((a, b) => mod(a - tonic, 12) - mod(b - tonic, 12));
  return from.map((pitchClass, i) => mod(from[(i + 1) % from.length]! - pitchClass - 1, 12) + 1);
}

/** Where each note of a scale, and its octave, falls above the tonic, in semitones: 8 marks on 12 steps. */
export function scaleMarks(scale: readonly number[], tonic: number): readonly number[] {
  return [
    0,
    ...scaleSteps(scale, tonic).reduce<number[]>(
      (sum, step) => [...sum, (sum.at(-1) ?? 0) + step],
      [],
    ),
  ];
}
