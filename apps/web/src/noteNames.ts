/**
 * How the screen names notes and keys: the twelve pitch classes as the
 * prototype spells them, for the wheel, where a pitch class stands alone;
 * and in a key, its notes and its name spelled as its signature has them
 * (the theory's `spelledTonic` and `spell`, as the engine's `keyName`), so
 * the page names one key one way. Then a scale's steps and marks.
 */

import { type Key, keyHelix } from '@jambot/engine';
import { type DiatonicModeName, type Note, mod, spell, spelledTonic } from '@jambot/theory';
import type { Spelled } from './pitch.ts';

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

/** A MIDI note as the tuner names it, with its octave, C4 = 60 as everywhere: 60 is C4, 69 is A4, 70 is B♭4. The notes below the keyboard's first go on counting. */
export function midiNoteName(midi: number): string {
  return `${TONIC_NAMES[mod(midi, 12)]!}${Math.floor(midi / 12) - 1}`;
}

/** A spelled note as the screen writes it: its letter, then ♯ or ♭ for each semitone it is altered. */
export function noteName({ letter, alteration }: Note): string {
  return letter + (alteration > 0 ? '♯' : '♭').repeat(Math.abs(alteration));
}

/**
 * A key's notes, named in ascending order from the tonic and spelled in the
 * key: G♯ minor is G♯ A♯ B C♯ D♯ E F♯, never with an A♭. A scale without its
 * tonic in it has no key to spell in, and reads as the wheel names it.
 */
export function scaleNoteNames(scale: readonly number[], tonic: number): readonly string[] {
  return scaleNotes(scale, tonic).map((note) => note.name);
}

/** A key's notes as `scaleNoteNames` spells them, each with its pitch class for its colour. */
export function scaleNotes(scale: readonly number[], tonic: number): readonly Spelled[] {
  if (!scale.includes(tonic))
    return scale.map((pitchClass) => ({ name: TONIC_NAMES[pitchClass]!, pitchClass }));
  const heights = scale
    .map((pitchClass) => tonic + mod(pitchClass - tonic, 12))
    .sort((a, b) => a - b);
  const helix = { cycle: 12, heights };
  return spell(spelledTonic(helix), heights).map(spelled);
}

/** A spelled note as the screen writes it, with its pitch class. */
export const spelled = (note: Note): Spelled => ({
  name: noteName(note),
  pitchClass: note.pitchClass,
});

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

/**
 * The modes as the scale selector writes them, where seven must fit a phone's
 * width: major and minor in full, the others by their first three letters,
 * never as Roman numerals, which the chords level writes for chords.
 */
export const MODE_SHORT_NAMES: Readonly<Record<DiatonicModeName, string>> = {
  lydian: 'lyd',
  ionian: 'major',
  mixolydian: 'mix',
  dorian: 'dor',
  aeolian: 'minor',
  phrygian: 'phr',
  locrian: 'loc',
};

/** A key in common terms, its tonic spelled in the key: "C major", "G♯ minor", "E♭ dorian". */
export function keyName(key: Key): string {
  return `${noteName(spelledTonic(keyHelix(key)))} ${MODE_NAMES[key.mode]}`;
}

/** The semitones from each note of a scale to the next, from the tonic round to its octave. */
export function scaleSteps(scale: readonly number[], tonic: number): readonly number[] {
  const from = [...scale].sort((a, b) => mod(a - tonic, 12) - mod(b - tonic, 12));
  return from.map((pitchClass, i) => mod(from[(i + 1) % from.length]! - pitchClass - 1, 12) + 1);
}

/** Where each note of a scale, and its octave, falls above the tonic, in semitones: a diatonic scale's 8 marks on 12 steps. */
export function scaleMarks(scale: readonly number[], tonic: number): readonly number[] {
  return [
    0,
    ...scaleSteps(scale, tonic).reduce<number[]>(
      (sum, step) => [...sum, (sum.at(-1) ?? 0) + step],
      [],
    ),
  ];
}
