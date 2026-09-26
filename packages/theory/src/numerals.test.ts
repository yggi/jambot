import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES } from './chords.ts';
import { shift } from './helix.ts';
import { DIATONIC_MODE_NAMES, type DiatonicModeName, diatonicMode } from './modes.ts';
import {
  type Numeral,
  type Target,
  chordOfNumeral,
  formatNumeral,
  numeralOf,
  parseNumeral,
} from './numerals.ts';

const range = (n: number) => [...Array(n).keys()];
const key = (tonic: number, name: DiatonicModeName) => shift(diatonicMode(name), tonic);
const A = 9,
  C = 0,
  D = 2,
  G = 7;
const accidentals = [-1, 0, 1] as const;
/** Every quality but the harmonic series, which is no chord. */
const qualities = Object.keys(CHORD_QUALITIES).filter((q) => q !== 'harmonics');
const targets: (Target | undefined)[] = [
  undefined,
  ...range(7).flatMap((degree) =>
    accidentals.flatMap((accidental) =>
      [false, true].map((minor) => ({ degree, accidental, minor })),
    ),
  ),
];

/** The chord a numeral means in a key, as a root and a quality. */
const means = (tonic: number, name: DiatonicModeName, text: string) =>
  chordOfNumeral(key(tonic, name), parseNumeral(text)!);

describe('Roman numerals (U1)', () => {
  it('write and read back every numeral: degree, accidental, quality and target (U1)', () => {
    let count = 0;
    for (const degree of range(7))
      for (const accidental of accidentals)
        for (const quality of qualities)
          for (const of of targets) {
            const numeral: Numeral = { degree, accidental, quality, ...(of && { of }) };
            const text = formatNumeral(numeral);
            expect(parseNumeral(text), text).toEqual(numeral);
            count++;
          }
    expect(count).toBe(7 * 3 * 19 * 43);
  });

  it('read every numeral the prototype composer writes, and write each back as it was (U1, E8)', () => {
    // The 45 kinds E8 counts over 2,880 bars of the prototype.
    const written = [
      'i',
      'i7',
      'VII',
      'I',
      'IV',
      'viiø7',
      'V7',
      'iv',
      'iv7',
      'V',
      'IVmaj7',
      'VII7',
      'Imaj7',
      'IVmaj9',
      'VI',
      'IV7',
      'V9',
      'ii9',
      'Imaj9',
      'ii7',
      'IIImaj7',
      'VIImaj7',
      'vi',
      'iii7',
      'V9/V',
      'VImaj7',
      'V7/V',
      'III',
      'vi7',
      'v7',
      'V7/ii',
      'V9/ii',
      'vi9',
      'v',
      'viø7',
      'V9/I',
      'V7/v',
      'V7/VI',
      'vi°',
      'V9/IV',
      'V7/I',
      'vii°',
      'V9/vi',
      'V7/vi',
      'ii',
    ];
    for (const text of written) {
      const numeral = parseNumeral(text);
      expect(numeral, text).toBeDefined();
      expect(formatNumeral(numeral!), text).toBe(text);
    }
  });

  it('take the degree from the mode, and b and # alter the mode’s own degree, as music21 does (U1)', () => {
    // Roots and qualities checked with music21 10.5.0 (the music-theory skill).
    const cases: [number, DiatonicModeName, string, number, string][] = [
      [A, 'aeolian', 'i', A, 'minor'],
      [A, 'aeolian', 'VI', 5, 'major'],
      [A, 'aeolian', 'VII', G, 'major'],
      [A, 'aeolian', 'III', C, 'major'],
      [A, 'aeolian', 'bVI', 4, 'major'], // F♭
      [A, 'aeolian', 'V', 4, 'major'],
      [A, 'aeolian', 'v', 4, 'minor'],
      [G, 'mixolydian', 'VII', 5, 'major'],
      [G, 'mixolydian', 'bVII', 4, 'major'], // F♭
      [G, 'mixolydian', 'v', D, 'minor'],
      [D, 'dorian', 'IV', G, 'major'],
      [D, 'dorian', 'iii', 5, 'minor'],
      [D, 'dorian', 'bIII', 4, 'major'], // F♭
      [C, 'ionian', 'bVII', 10, 'major'],
      [C, 'ionian', 'V/V', D, 'major'],
      [C, 'ionian', 'V7/ii', A, '7'],
    ];
    for (const [tonic, name, text, root, quality] of cases)
      expect(means(tonic, name, text), `${text} in ${tonic} ${name}`).toEqual({ root, quality });
  });

  it('keep the leading tone of the mode: viiø7 in A minor stands on G, where music21 raises it (U1)', () => {
    // A convention, not an error: music21 raises the seventh degree of a
    // minor key for vii. U1 takes every degree from the mode, with no
    // exception.
    expect(means(A, 'aeolian', 'viiø7')).toEqual({ root: G, quality: 'm7b5' });
  });

  it('give extensions as fixed intervals, as chord symbols do (U1)', () => {
    expect(means(C, 'ionian', 'I7')).toEqual({ root: C, quality: '7' });
    expect(means(A, 'aeolian', 'Imaj7')).toEqual({ root: A, quality: 'maj7' });
    expect(means(A, 'aeolian', 'imaj7')).toEqual({ root: A, quality: 'mMaj7' });
    expect(means(A, 'aeolian', 'V9')).toEqual({ root: 4, quality: '9' });
    expect(means(C, 'ionian', 'ii9')).toEqual({ root: D, quality: 'm9' });
  });

  it('write every chord in every diatonic key as a numeral that reads back as that chord (U1)', () => {
    for (const tonic of range(12))
      for (const name of DIATONIC_MODE_NAMES)
        for (const root of range(12))
          for (const quality of qualities) {
            const k = key(tonic, name);
            const numeral = numeralOf(k, { root, quality });
            expect(numeral, `${root} ${quality} in ${tonic} ${name}`).toBeDefined();
            expect(chordOfNumeral(k, numeral!)).toEqual({ root, quality });
          }
  });

  it('write a root outside the key as the parallel major has it, and otherwise flat (U1)', () => {
    const write = (tonic: number, name: DiatonicModeName, root: number, quality = 'major') =>
      formatNumeral(numeralOf(key(tonic, name), { root, quality })!);
    expect(write(A, 'aeolian', 6)).toBe('#VI'); // F♯, the sixth of A major
    expect(write(A, 'aeolian', 1)).toBe('#III'); // C♯
    expect(write(A, 'aeolian', 10)).toBe('bII'); // B♭, the Neapolitan
    expect(write(C, 'ionian', 10)).toBe('bVII');
    expect(write(C, 'ionian', 3)).toBe('bIII');
    expect(write(C, 'ionian', 6, 'diminished')).toBe('bv°');
  });

  it('write a secondary against its target, reading it in the target’s major or minor key (U1)', () => {
    const cMajor = key(C, 'ionian');
    const ofii: Target = { degree: 1, accidental: 0, minor: true };
    expect(formatNumeral(numeralOf(cMajor, { root: A, quality: '7' }, ofii)!)).toBe('V7/ii');
    expect(means(A, 'aeolian', 'V7/v')).toEqual({ root: 11, quality: '7' }); // B7, of E minor
    expect(means(A, 'aeolian', 'V7/VI')).toEqual({ root: 0, quality: '7' }); // C7, of F major
  });

  it('refuse what is not a numeral, and write none for the harmonic series (U1)', () => {
    for (const text of [
      '',
      'VIII',
      'Vi',
      'iv5',
      'isus4',
      'iiadd9',
      'vimaj9',
      'Iø7',
      'I°',
      'i+',
      'V7/',
      'V/V7',
      'bbII',
      'x',
    ])
      expect(parseNumeral(text), text).toBeUndefined();
    expect(numeralOf(key(C, 'ionian'), { root: C, quality: 'harmonics' })).toBeUndefined();
  });
});
