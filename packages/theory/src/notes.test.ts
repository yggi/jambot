import { describe, expect, it } from 'vitest';
import { diatonicMode } from './modes.ts';
import { LETTERS, parseNote } from './notes.ts';

const ALTERATIONS: [string, number][] = [
  ['bb', -2],
  ['♭♭', -2],
  ['𝄫', -2],
  ['b', -1],
  ['♭', -1],
  ['', 0],
  ['♮', 0],
  ['#', 1],
  ['♯', 1],
  ['##', 2],
  ['x', 2],
  ['𝄪', 2],
];

describe('parseNote', () => {
  it('places the natural letters on the C ionian set', () => {
    expect(LETTERS.map((letter) => parseNote(letter)!.pitchClass)).toEqual(diatonicMode('ionian'));
  });

  it('reads every letter with every accidental, in ASCII and Unicode', () => {
    LETTERS.forEach((letter, i) => {
      const natural = diatonicMode('ionian')[i]!;
      for (const [sign, alteration] of ALTERATIONS) {
        for (const spelled of [letter + sign, letter.toLowerCase() + sign]) {
          const note = parseNote(spelled);
          expect(note, spelled).toMatchObject({ letter, alteration });
          expect(note!.pitchClass, spelled).toBe((natural + alteration + 12) % 12);
        }
      }
    });
  });

  it('reads accidentals as words', () => {
    expect(parseNote('F sharp')).toMatchObject({ letter: 'F', alteration: 1, pitchClass: 6 });
    expect(parseNote('B-flat')).toMatchObject({ letter: 'B', alteration: -1, pitchClass: 10 });
    expect(parseNote('E double flat')).toMatchObject({ alteration: -2, pitchClass: 2 });
    expect(parseNote('G double-sharp')).toMatchObject({ alteration: 2, pitchClass: 9 });
    expect(parseNote('C natural')).toMatchObject({ alteration: 0, pitchClass: 0 });
  });

  it('reads an octave as a MIDI note, with C4 = 60', () => {
    expect(parseNote('C4')!.midi).toBe(60);
    expect(parseNote('A4')!.midi).toBe(69);
    expect(parseNote('C-1')!.midi).toBe(0);
    expect(parseNote('G9')!.midi).toBe(127);
    // Spelling crosses the octave boundary: B♯3 is C4, and C♭4 is B3.
    expect(parseNote('B#3')!.midi).toBe(60);
    expect(parseNote('Cb4')!.midi).toBe(59);
    expect(parseNote('F sharp 2')).toMatchObject({ octave: 2, midi: 42 });
    expect(parseNote('C')!.midi).toBeUndefined();
  });

  it('rejects what is not a note', () => {
    for (const text of [
      '',
      'H',
      'Cbbb',
      'C###',
      'C#b',
      'Ab10',
      'G#9',
      'C-2',
      'major',
      'C sharp flat',
    ])
      expect(parseNote(text), text).toBeUndefined();
  });
});
