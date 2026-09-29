import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, keyHelix } from '@jambot/engine';
import { DIATONIC_MODE_NAMES, diatonicMode, positions, shift } from '@jambot/theory';
import {
  keyName,
  MODE_NAMES,
  MODE_NUMERALS,
  scaleNoteNames,
  scaleMarks,
  scaleSteps,
  TONIC_NAMES,
} from './noteNames.ts';

describe('scaleNoteNames', () => {
  it('names A aeolian ascending from its tonic: A B C D E F G', () => {
    expect(scaleNoteNames([0, 2, 4, 5, 7, 9, 11], 9)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('names C ionian ascending from its tonic, already first: C D E F G A B', () => {
    expect(scaleNoteNames([0, 2, 4, 5, 7, 9, 11], 0)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('is a permutation of the scale it names, starting at the tonic, for every tonic in it', () => {
    const cIonian = [0, 2, 4, 5, 7, 9, 11];
    for (const tonic of cIonian) {
      const names = scaleNoteNames(cIonian, tonic);
      expect(names[0]).toBe(TONIC_NAMES[tonic]);
      expect(new Set(names)).toEqual(new Set(cIonian.map((pc) => TONIC_NAMES[pc])));
    }
  });
});

describe('keyName', () => {
  it('reads ionian as major and aeolian as minor, the other modes by their own name', () => {
    expect(Object.entries(MODE_NAMES).filter(([mode, name]) => mode !== name)).toEqual([
      ['ionian', 'major'],
      ['aeolian', 'minor'],
    ]);
    expect(Object.keys(MODE_NAMES)).toEqual([...DIATONIC_MODE_NAMES]);
    expect(keyName({ tonic: 0, mode: 'ionian' })).toBe('C major');
    expect(keyName({ tonic: 9, mode: 'aeolian' })).toBe('A minor');
    expect(keyName({ tonic: 3, mode: 'dorian' })).toBe('E♭ dorian');
  });

  it('names every key, mode and tonic, uniquely', () => {
    const names = new Set<string>();
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++) names.add(keyName({ tonic, mode }));
    expect(names.size).toBe(48);
  });
});

describe('scaleSteps', () => {
  const STEPS = {
    ionian: [2, 2, 1, 2, 2, 2, 1],
    dorian: [2, 1, 2, 2, 2, 1, 2],
    mixolydian: [2, 2, 1, 2, 2, 1, 2],
    aeolian: [2, 1, 2, 2, 1, 2, 2],
  } as const;

  it('gives each mode its pattern of semitones from the tonic, on every tonic, closing the octave', () => {
    for (const mode of COMPOSER_MODES) {
      for (let tonic = 0; tonic < 12; tonic++) {
        const steps = scaleSteps(positions(keyHelix({ tonic, mode })), tonic);
        expect(steps, `${mode} on ${tonic}`).toEqual(STEPS[mode]);
      }
    }
  });
});

describe('scaleMarks', () => {
  it('puts 8 marks on 12 steps, from the tonic to its octave, for every mode and tonic', () => {
    for (const mode of COMPOSER_MODES) {
      for (let tonic = 0; tonic < 12; tonic++) {
        const marks = scaleMarks(positions(keyHelix({ tonic, mode })), tonic);
        expect(marks).toHaveLength(8);
        expect(marks[0]).toBe(0);
        expect(marks[7]).toBe(12);
      }
    }
    expect(scaleMarks([9, 11, 0, 2, 4, 5, 7], 9)).toEqual([0, 2, 3, 5, 7, 8, 10, 12]);
  });
});

describe('MODE_NUMERALS', () => {
  it('numbers the seven modes by the degree of the major scale they start on, each once', () => {
    expect(DIATONIC_MODE_NAMES.map((m) => MODE_NUMERALS[m]).sort()).toEqual(
      ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].sort(),
    );
    const cMajor = [0, 2, 4, 5, 7, 9, 11];
    for (const mode of DIATONIC_MODE_NAMES) {
      const degree = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].indexOf(MODE_NUMERALS[mode]);
      expect(positions(shift(diatonicMode(mode), cMajor[degree]!)).sort((a, b) => a - b)).toEqual(
        cMajor,
      );
    }
  });
});
