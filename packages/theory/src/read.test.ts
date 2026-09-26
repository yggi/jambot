import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES } from './chords.ts';
import { even } from './even.ts';
import { shift } from './helix.ts';
import { DEGREE_NAMES, GENERIC_INTERVALS, INTERVALS } from './intervals.ts';
import { diatonicMode, mode } from './modes.ts';
import { LETTERS } from './notes.ts';
import { type Reading, nameOf, read, readings } from './read.ts';
import { RHYTHMS } from './rhythms.ts';
import { SCALES } from './scales.ts';

const range = (n: number) => [...Array(n).keys()];
const cMajor = diatonicMode('ionian');

describe('read', () => {
  it('resolves the kinds of names a musician uses', () => {
    expect(read('F#', { kind: 'note' })).toMatchObject({ kind: 'note', note: { pitchClass: 6 } });
    expect(read('C blues')).toMatchObject({
      kind: 'scale',
      tonic: { pitchClass: 0 },
      helix: { cycle: 12, heights: [0, 3, 5, 6, 7, 10] },
    });
    expect(read('G7', { kind: 'chord' })).toMatchObject({
      kind: 'chord',
      root: { pitchClass: 7 },
      stack: [0, 4, 7, 10],
    });
    expect(read('second')).toMatchObject({ kind: 'interval', generic: 1, specific: [1, 2] });
    expect(read('clave')).toEqual({
      kind: 'rhythm',
      helix: { cycle: 16, heights: [0, 3, 6, 10, 12] },
    });
    expect(read('E(5,16)')).toEqual({ kind: 'rhythm', helix: even(5, 16) });
    expect(read('Bbmaj7')).toMatchObject({ root: { pitchClass: 10 }, stack: [0, 4, 7, 11] });
    expect(read('F sharp minor seventh')).toMatchObject({
      root: { pitchClass: 6 },
      quality: 'm7',
    });
  });

  it('gives a kind in the context its own type', () => {
    expect(read('major', { kind: 'scale' }).helix).toEqual(cMajor);
    expect(read('G7', { kind: 'chord' }).stack).toEqual([0, 4, 7, 10]);
  });

  it('carries the tonic in the helix: D dorian is mode 1 of C major', () => {
    expect(read('D dorian', { kind: 'scale' }).helix).toEqual(mode(cMajor, 1));
    expect(read('G major', { kind: 'scale' }).helix).toEqual(shift(cMajor, 7));
    expect(read('Cb major', { kind: 'scale' }).helix).toEqual(shift(cMajor, 11));
  });

  it('lists every reading of an ambiguous name, and needs a kind to choose', () => {
    const kinds = (text: string) => readings(text).map((r) => r.kind);
    expect(kinds('C')).toEqual(['note', 'chord']);
    expect(kinds('E7')).toEqual(['note', 'chord']); // E in octave 7, or E dominant seventh
    expect(kinds('C major')).toEqual(['chord', 'scale']);
    expect(kinds('major')).toEqual(['chord', 'scale']);
    expect(kinds('diminished')).toEqual(['chord', 'scale']);
    expect(kinds('whole tone')).toEqual(['interval', 'scale']);
    expect(kinds('major seventh')).toEqual(['interval', 'chord']);
    expect(kinds('dominant')).toEqual(['degree', 'chord']);
    expect(kinds('suspended')).toEqual(['chord', 'scale']);
    expect(kinds('C major scale')).toEqual(['scale']);
    expect(() => read('C')).toThrow(/ambiguous.*note.*chord/);
    expect(read('C', { kind: 'chord' })).toMatchObject({ stack: [0, 4, 7] });
    expect(read('E7', { kind: 'note' })).toMatchObject({ note: { midi: 100 } });
  });

  it('resolves dia, the triad on the scale in context', () => {
    expect(read('dia', { scale: diatonicMode('dorian') })).toEqual({
      kind: 'chord',
      quality: 'minor',
      stack: [0, 3, 7],
    });
    expect(read('dia', { scale: mode(cMajor, 4) })).toMatchObject({ quality: 'major' });
    expect(readings('dia')).toEqual([]);
    expect(() => read('dia')).toThrow(/needs a scale/);
  });

  it('builds dia on every other degree of any scale, whatever its number of degrees', () => {
    // As play-aeiou's dia does: the triad of a key is not only a 7-note idea.
    const cases: [string, number[], string][] = [
      ['major pentatonic', [0, 4, 9], 'dia'],
      ['blues', [0, 5, 7], 'sus4'],
      ['whole tone', [0, 4, 8], 'augmented'],
      ['diminished', [0, 3, 6], 'diminished'],
      ['chromatic', [0, 2, 4], 'dia'],
    ];
    for (const [name, stack, quality] of cases)
      expect(read('dia', { scale: SCALES[name]!.helix }), name).toEqual({
        kind: 'chord',
        quality,
        stack,
      });
    for (const scale of Object.values(SCALES))
      expect(readings('dia', { scale: scale.helix })).toHaveLength(1);
  });

  it('reads the functional names of degrees', () => {
    expect(read('tonic')).toEqual({ kind: 'degree', generic: 0, specific: [0] });
    expect(read('leading tone')).toEqual({ kind: 'degree', generic: 6, specific: [11] });
  });

  it('reads a numbered mode of a scale, with a tonic', () => {
    expect(read('A harmonic minor 5')).toMatchObject({
      kind: 'scale',
      tonic: { pitchClass: 9 },
      name: 'phrygian dominant',
    });
  });

  it('says so when a name means nothing', () => {
    expect(readings('Hbm')).toEqual([]);
    expect(() => read('Hbm')).toThrow(/no reading/);
    expect(() => read('C blues', { kind: 'rhythm' })).toThrow(/no reading/);
  });
});

describe('nameOf', () => {
  const SIGNS = ['bb', 'b', '', '#', '##'];
  const roots = LETTERS.flatMap((letter) => SIGNS.map((sign) => letter + sign));

  /** A name for every reading the tables hold, in the form the tables write it. */
  const names: string[] = [
    ...roots,
    ...roots.flatMap((root) => [`${root}4`, `${root}-1`]),
    ...Object.values(INTERVALS).flatMap((interval) => [...interval.symbols, ...interval.words]),
    ...Object.keys(GENERIC_INTERVALS),
    ...Object.keys(DEGREE_NAMES),
    ...Object.entries(CHORD_QUALITIES).flatMap(([name, quality]) => [
      name,
      ...quality.symbols.filter((symbol) => symbol !== ''),
      ...quality.words,
      ...roots.flatMap((root) => [
        ...quality.symbols.map((symbol) => root + symbol),
        ...quality.words.map((word) => `${root} ${word}`),
      ]),
    ]),
    ...Object.entries(SCALES).flatMap(([name, scale]) => [
      name,
      ...scale.aliases,
      ...roots.map((root) => `${root} ${name}`),
      ...scale.helix.heights.map((_, d) => `${name} ${d + 1}`),
    ]),
    ...Object.entries(RHYTHMS).flatMap(([name, rhythm]) => [name, ...rhythm.aliases]),
    ...range(17).flatMap((n) =>
      range(n + 1)
        .slice(1)
        .flatMap((k) => range(n).map((s) => `E(${k},${n},${s})`)),
    ),
  ];

  it('names every reading so that reading the name gives it back: read(nameOf(x)) is x', () => {
    let checked = 0;
    for (const text of names) {
      for (const reading of readings(text)) {
        const name = nameOf(reading);
        expect(read(name, { kind: reading.kind }), `${text} → ${name}`).toEqual(reading);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5000);
  });

  it('writes the short forms', () => {
    const named = (text: string, kind: Reading['kind']) => nameOf(read(text, { kind }));
    expect(named('F sharp minor seventh', 'chord')).toBe('F#m7');
    expect(named('C major', 'chord')).toBe('C');
    expect(named('major', 'chord')).toBe('maj');
    expect(named('C harmonics', 'chord')).toBe('C harmonics');
    expect(named('E flat natural minor', 'scale')).toBe('Eb aeolian');
    expect(named('perfect fifth', 'interval')).toBe('P5');
    expect(named('5th', 'interval')).toBe('fifth');
    expect(named('leading note', 'degree')).toBe('leading tone');
    expect(named('bossa nova', 'rhythm')).toBe('bossa clave');
    expect(named('E(4,16)', 'rhythm')).toBe('four on the floor');
    expect(named('E(3,8,2)', 'rhythm')).toBe('E(3,8,2)');
    expect(named('B♭3', 'note')).toBe('Bb3');
  });

  it('refuses a reading that has no name', () => {
    expect(() => nameOf({ kind: 'rhythm', helix: { cycle: 16, heights: [0, 1, 5] } })).toThrow(
      /no name/,
    );
  });
});
