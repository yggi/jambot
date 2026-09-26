/**
 * Note names: a letter, an accidental and an optional octave.
 *
 * The natural letters are the C ionian set, so even note names come from the
 * primitive. The spelling is kept (letter and alteration), because E♭ and D♯
 * are the same pitch class but not the same name. Octaves follow C4 = 60, as
 * in the prototype and the sister projects.
 */

import { mod } from './helix.ts';
import { diatonicMode } from './modes.ts';

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

export interface Note {
  letter: Letter;
  /** Semitones added to the natural letter: −2 to +2 as read, beyond that only when spelled from a tonic that has an accidental (see `spell`). */
  alteration: number;
  pitchClass: number;
  octave?: number;
  /** The MIDI note number, present when the octave is. */
  midi?: number;
}

const ACCIDENTAL_SIGNS: Record<string, number> = {
  '': 0,
  '♮': 0,
  '#': 1,
  '♯': 1,
  '##': 2,
  '♯♯': 2,
  x: 2,
  '𝄪': 2,
  b: -1,
  '♭': -1,
  bb: -2,
  '♭♭': -2,
  '𝄫': -2,
};

const ACCIDENTAL_WORDS: Record<string, number> = {
  natural: 0,
  sharp: 1,
  'double sharp': 2,
  flat: -1,
  'double flat': -2,
};

/**
 * Accidental signs are case-sensitive (x is a double sharp, b a flat);
 * accidental words are not.
 */
export function parseNote(text: string): Note | undefined {
  const match = /^([A-Ga-g])(.*?)\s*(-?\d)?$/u.exec(text.trim());
  if (!match) return undefined;
  const [, letterText, accidental, octaveText] = match;
  const words = /^[\s-]+(.+)$/.exec(accidental!);
  const alteration = words
    ? ACCIDENTAL_WORDS[words[1]!.toLowerCase().replace(/[\s-]+/g, ' ')]
    : ACCIDENTAL_SIGNS[accidental!];
  if (alteration === undefined) return undefined;
  const letter = letterText!.toUpperCase() as Letter;
  const natural = diatonicMode('ionian').heights[LETTERS.indexOf(letter)]!;
  const note: Note = { letter, alteration, pitchClass: mod(natural + alteration, 12) };
  if (octaveText !== undefined) {
    const octave = Number(octaveText);
    const midi = 12 * (octave + 1) + natural + alteration;
    if (midi < 0 || midi > 127) return undefined;
    note.octave = octave;
    note.midi = midi;
  }
  return note;
}
