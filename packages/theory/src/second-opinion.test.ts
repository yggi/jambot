/**
 * The primitive checked against tonal, which derives the same facts in
 * another way: from spelled notes, named modes and a scale dictionary. A
 * check of the primitive against itself would prove little.
 *
 * tonal is a dev dependency, for tests only. Lint keeps it out of the
 * package's own code.
 */

import { Chord, Mode, Note, RhythmPattern, Scale, ScaleType } from 'tonal';
import { describe, expect, it } from 'vitest';
import { even, isMaximallyEven, shift } from './even.ts';
import { lookup } from './lookup.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, modes } from './modes.ts';
import { SCALES } from './scales.ts';
import { normalizeWords } from './words.ts';

const range = (n: number) => [...Array(n).keys()];

/** Pitch classes of a chroma string such as "101011010101". */
const setOfChroma = (chroma: string) => range(12).filter((i) => chroma[i] === '1');

const pitchClasses = (notes: readonly string[]) =>
  [...new Set(notes.map((n) => Note.chroma(n)!))].sort((a, b) => a - b);

/** Every other degree of `set`, `size` of them, from degree `d`, as pitch classes. */
const stackedThirds = (set: readonly number[], d: number, size: number) =>
  range(size)
    .map((i) => set[(d + 2 * i) % set.length]!)
    .sort((a, b) => a - b);

describe('tonal as a second opinion', () => {
  it('has the diatonic modes as ours, and in the same order from bright to dark', () => {
    for (const name of DIATONIC_MODE_NAMES) {
      expect(setOfChroma(Mode.get(name).chroma)).toEqual(diatonicMode(name));
    }
    // tonal's `alt` counts accidentals against ionian: −1 for lydian's
    // sharp, +5 for locrian's flats.
    expect(DIATONIC_MODE_NAMES.map((name) => Mode.get(name).alt)).toEqual([-1, 0, 1, 2, 3, 4, 5]);
  });

  it('stacks the same triads and sevenths on every degree of every mode', () => {
    for (const name of DIATONIC_MODE_NAMES) {
      const mode = diatonicMode(name);
      const triads = Mode.triads(name, 'C');
      const sevenths = Mode.seventhChords(name, 'C');
      for (const d of range(7)) {
        expect(pitchClasses(Chord.get(triads[d]!).notes)).toEqual(stackedThirds(mode, d, 3));
        expect(pitchClasses(Chord.get(sevenths[d]!).notes)).toEqual(stackedThirds(mode, d, 4));
      }
    }
  });

  it('has the pentatonic modes as the rotations of 5 of 12', () => {
    const tonalModes = Scale.modeNames('C major pentatonic').map(([, name]) =>
      setOfChroma(Scale.get(`C ${name}`).chroma),
    );
    expect(tonalModes.map((set) => set.join()).sort()).toEqual(
      modes(5, 12)
        .map((set) => set.join())
        .sort(),
    );
  });

  it('agrees on which scales of its whole dictionary are maximally even', () => {
    const scales = ScaleType.all().map((type) => ({
      name: type.name,
      set: setOfChroma(type.chroma),
    }));
    expect(scales).toHaveLength(92);
    const evenScales = scales.filter(({ set }) => isMaximallyEven(set, 12));
    expect(evenScales.map(({ name }) => name).sort()).toEqual([
      'chromatic',
      'diminished',
      'dorian',
      'egyptian',
      'half-whole diminished',
      'locrian',
      'lydian',
      'major',
      'major pentatonic',
      'malkos raga',
      "messiaen's mode #3",
      "messiaen's mode #7",
      'minor',
      'minor pentatonic',
      'mixolydian',
      'phrygian',
      'ritusen',
      'whole tone',
    ]);
    // Each of them is a transposition of the primitive, and nothing else is.
    for (const { set } of scales) {
      const k = set.length;
      const fromPrimitive = range(12).some((t) => shift(even(k, 12), t, 12).join() === set.join());
      expect(fromPrimitive).toBe(isMaximallyEven(set, 12));
    }
  });

  it('gives the same Euclidean rhythm for every k of n, exactly and not up to a rotation', () => {
    // Strudel's Bjorklund form differs by a rotation for 46 of these (#8);
    // tonal's matches the prototype's form exactly.
    for (const n of range(17).slice(1)) {
      for (const k of range(n + 1).slice(1)) {
        const onsets = RhythmPattern.euclid(n, k).flatMap((beat, i) => (beat ? [i] : []));
        expect(onsets).toEqual(even(k, n));
      }
    }
  });

  it('means the same set by every scale name the two share', () => {
    const tonalByName = new Map<string, string>();
    for (const type of ScaleType.all())
      for (const name of [type.name, ...type.aliases])
        tonalByName.set(normalizeWords(name), setOfChroma(type.chroma).join());
    const shared = Object.entries(SCALES).flatMap(([name, scale]) =>
      [name, ...scale.aliases]
        .filter((alias) => tonalByName.has(normalizeWords(alias)))
        .map((alias) => [alias, scale.set.join()] as const),
    );
    expect(shared).toHaveLength(66);
    for (const [alias, set] of shared)
      expect(tonalByName.get(normalizeWords(alias)), alias).toBe(set);
  });

  it('reads every name tonal has for a scale we name, as that scale', () => {
    // Two of tonal's names are something else here: "dominant" is a degree
    // and a chord, and "half-diminished" is a chord.
    const elsewhere = ['dominant', 'half-diminished'];
    const ours = new Set(Object.values(SCALES).map((scale) => scale.set.join()));
    const read: string[] = [];
    for (const type of ScaleType.all()) {
      const set = setOfChroma(type.chroma);
      if (!ours.has(set.join())) continue;
      for (const name of [type.name, ...type.aliases].filter((n) => !elsewhere.includes(n))) {
        const reading = lookup(name, { kind: 'scale' });
        expect(reading.kind === 'scale' && reading.set, name).toEqual(set);
        read.push(name);
      }
    }
    expect(read.length).toBeGreaterThan(50);
  });
});
