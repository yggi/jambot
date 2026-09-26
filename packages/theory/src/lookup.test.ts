import { describe, expect, it } from 'vitest';
import { even } from './even.ts';
import { lookup, readings } from './lookup.ts';
import { diatonicMode } from './modes.ts';

describe('lookup', () => {
  it('resolves the kinds of names a musician uses', () => {
    expect(lookup('F#', { kind: 'note' })).toMatchObject({ kind: 'note', note: { pitchClass: 6 } });
    expect(lookup('C blues')).toMatchObject({
      kind: 'scale',
      tonic: { pitchClass: 0 },
      set: [0, 3, 5, 6, 7, 10],
    });
    expect(lookup('G7', { kind: 'chord' })).toMatchObject({
      kind: 'chord',
      root: { pitchClass: 7 },
      intervals: [0, 4, 7, 10],
    });
    expect(lookup('second')).toMatchObject({ kind: 'interval', steps: 1, semitones: [1, 2] });
    expect(lookup('clave')).toMatchObject({ kind: 'rhythm', steps: 16, onsets: [0, 3, 6, 10, 12] });
    expect(lookup('D dorian')).toMatchObject({
      tonic: { pitchClass: 2 },
      set: diatonicMode('dorian'),
    });
    expect(lookup('E(5,16)')).toMatchObject({ kind: 'rhythm', onsets: even(5, 16) });
    expect(lookup('Bbmaj7')).toMatchObject({ root: { pitchClass: 10 }, intervals: [0, 4, 7, 11] });
    expect(lookup('F sharp minor seventh')).toMatchObject({
      root: { pitchClass: 6 },
      quality: 'm7',
    });
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
    expect(() => lookup('C')).toThrow(/ambiguous.*note.*chord/);
    expect(lookup('C', { kind: 'chord' })).toMatchObject({ intervals: [0, 4, 7] });
    expect(lookup('E7', { kind: 'note' })).toMatchObject({ note: { midi: 100 } });
  });

  it('resolves dia, a stack of every other degree, from the scale in context', () => {
    expect(lookup('dia', { scale: diatonicMode('dorian') })).toMatchObject({
      kind: 'chord',
      intervals: [0, 3, 7],
    });
    expect(readings('dia')).toEqual([]);
    expect(() => lookup('dia')).toThrow(/needs a scale/);
  });

  it('reads the functional names of degrees', () => {
    expect(lookup('tonic')).toEqual({ kind: 'degree', steps: 0, semitones: [0] });
    expect(lookup('leading tone')).toEqual({ kind: 'degree', steps: 6, semitones: [11] });
  });

  it('reads a numbered mode of a scale, with a tonic', () => {
    expect(lookup('A harmonic minor 5')).toMatchObject({
      kind: 'scale',
      tonic: { pitchClass: 9 },
      name: 'phrygian dominant',
    });
  });

  it('says so when a name means nothing', () => {
    expect(readings('Hbm')).toEqual([]);
    expect(() => lookup('Hbm')).toThrow(/no reading/);
    expect(() => lookup('C blues', { kind: 'rhythm' })).toThrow(/no reading/);
  });
});
