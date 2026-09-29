// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { COMPOSER_MODES, keyHelix, keyName as engineKeyName } from '@jambot/engine';
import { DIATONIC_MODE_NAMES, diatonicMode, positions, shift } from '@jambot/theory';
import {
  keyName,
  MODE_NAMES,
  MODE_SHORT_NAMES,
  scaleNoteNames,
  scaleMarks,
  scaleSteps,
} from './noteNames.ts';

/** The engine's name with the screen's accidentals: `Eb` → `E♭`, `C#` → `C♯`. */
const onScreen = (name: string) => name.replace(/(?<=^[A-G])b/, '♭').replace('#', '♯');

describe('scaleNoteNames', () => {
  it('names A aeolian ascending from its tonic: A B C D E F G', () => {
    expect(scaleNoteNames([0, 2, 4, 5, 7, 9, 11], 9)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('names C ionian ascending from its tonic, already first: C D E F G A B', () => {
    expect(scaleNoteNames([0, 2, 4, 5, 7, 9, 11], 0)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  });

  it('spells a key’s notes in the key, as its signature has them: G♯ minor, D♭ major', () => {
    const scaleOf = (tonic: number, mode: 'aeolian' | 'ionian') =>
      positions(keyHelix({ tonic, mode }));
    expect(scaleNoteNames(scaleOf(8, 'aeolian'), 8)).toEqual([
      'G♯',
      'A♯',
      'B',
      'C♯',
      'D♯',
      'E',
      'F♯',
    ]);
    expect(scaleNoteNames(scaleOf(1, 'ionian'), 1)).toEqual([
      'D♭',
      'E♭',
      'F',
      'G♭',
      'A♭',
      'B♭',
      'C',
    ]);
  });

  it('names every mode on every tonic with each letter once, from the tonic', () => {
    for (const mode of DIATONIC_MODE_NAMES)
      for (let tonic = 0; tonic < 12; tonic++) {
        const names = scaleNoteNames(positions(shift(diatonicMode(mode), tonic)), tonic);
        expect(names.map((n) => n[0]).join(''), `${mode} on ${tonic}`).toBe(
          'ABCDEFGABCDEFG'.slice('ABCDEFG'.indexOf(names[0]![0]!)).slice(0, 7),
        );
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
    expect(keyName({ tonic: 8, mode: 'aeolian' })).toBe('G♯ minor');
    expect(keyName({ tonic: 1, mode: 'ionian' })).toBe('D♭ major');
  });

  it('spells every key’s tonic as the engine does, so the page names one key one way', () => {
    for (const mode of COMPOSER_MODES)
      for (let tonic = 0; tonic < 12; tonic++)
        expect(keyName({ tonic, mode }).split(' ')[0], `${mode} on ${tonic}`).toBe(
          onScreen(engineKeyName({ tonic, mode }).split(' ')[0]!),
        );
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

  it('puts a mark on each note and the octave of a scale of any size: a pentatonic has 6', () => {
    expect(scaleMarks([0, 2, 4, 7, 9], 0)).toEqual([0, 2, 4, 7, 9, 12]);
  });
});

describe('MODE_SHORT_NAMES', () => {
  it('names major and minor in full, and the other modes by their first three letters', () => {
    for (const mode of DIATONIC_MODE_NAMES)
      expect(MODE_SHORT_NAMES[mode]).toBe(
        mode === 'ionian' || mode === 'aeolian' ? MODE_NAMES[mode] : mode.slice(0, 3),
      );
  });

  it('gives each of the seven modes its own short name', () => {
    expect(new Set(DIATONIC_MODE_NAMES.map((m) => MODE_SHORT_NAMES[m])).size).toBe(7);
  });

  it('never reads as a chord numeral, which the chords level below writes in Roman numerals', () => {
    for (const mode of DIATONIC_MODE_NAMES) expect(MODE_SHORT_NAMES[mode]).not.toMatch(/^[ivIV]+$/);
  });
});
