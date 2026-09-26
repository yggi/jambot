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
import { even, isEven } from './even.ts';
import { heightOf, positions, shift } from './helix.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, modes } from './modes.ts';
import { read } from './read.ts';
import { SCALES } from './scales.ts';
import { spell } from './spelling.ts';
import { chordScale } from './keys.ts';
import { CHORD_QUALITIES } from './chords.ts';
import { parseNote } from './notes.ts';
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

const onTwelve = (heights: number[]) => ({ cycle: 12, heights });

describe('tonal as a second opinion', () => {
  it('has the diatonic modes as ours, and in the same order from bright to dark', () => {
    for (const name of DIATONIC_MODE_NAMES) {
      expect(setOfChroma(Mode.get(name).chroma)).toEqual(diatonicMode(name).heights);
    }
    // tonal's `alt` counts accidentals against ionian: −1 for lydian's
    // sharp, +5 for locrian's flats.
    expect(DIATONIC_MODE_NAMES.map((name) => Mode.get(name).alt)).toEqual([-1, 0, 1, 2, 3, 4, 5]);
  });

  it('stacks the same triads and sevenths on every degree of every mode', () => {
    for (const name of DIATONIC_MODE_NAMES) {
      const mode = diatonicMode(name).heights;
      const triads = Mode.triads(name, 'C');
      const sevenths = Mode.seventhChords(name, 'C');
      for (const d of range(7)) {
        expect(pitchClasses(Chord.get(triads[d]!).notes)).toEqual(stackedThirds(mode, d, 3));
        expect(pitchClasses(Chord.get(sevenths[d]!).notes)).toEqual(stackedThirds(mode, d, 4));
      }
    }
  });

  it('has the pentatonic modes as the modes of 5 of 12', () => {
    const tonalModes = Scale.modeNames('C major pentatonic').map(([, name]) =>
      setOfChroma(Scale.get(`C ${name}`).chroma),
    );
    expect(tonalModes.map((set) => set.join()).sort()).toEqual(
      modes(even(5, 12))
        .map((m) => shift(m, -heightOf(m, 0)).heights.join())
        .sort(),
    );
  });

  it('agrees on which scales of its whole dictionary are maximally even', () => {
    const scales = ScaleType.all().map((type) => ({
      name: type.name,
      set: setOfChroma(type.chroma),
    }));
    expect(scales).toHaveLength(92);
    const evenScales = scales.filter(({ set }) => isEven(onTwelve(set)));
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
      const fromPrimitive = range(12).some(
        (t) => positions(shift(even(k, 12), t)).join() === set.join(),
      );
      expect(fromPrimitive).toBe(isEven(onTwelve(set)));
    }
  });

  it('gives the same Euclidean rhythm for every k of n, exactly and not up to a rotation', () => {
    // Strudel's Bjorklund form differs by a rotation for 46 of these (#8);
    // tonal's matches the prototype's form exactly.
    for (const n of range(17).slice(1)) {
      for (const k of range(n + 1).slice(1)) {
        const onsets = RhythmPattern.euclid(n, k).flatMap((beat, i) => (beat ? [i] : []));
        expect(onsets).toEqual(even(k, n).heights);
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
        .map((alias) => [alias, scale.helix.heights.join()] as const),
    );
    expect(shared).toHaveLength(66);
    for (const [alias, set] of shared)
      expect(tonalByName.get(normalizeWords(alias)), alias).toBe(set);
  });

  it('reads every name tonal has for a scale we name, as that scale', () => {
    // Two of tonal's names are something else here: "dominant" is a degree
    // and a chord, and "half-diminished" is a chord.
    const elsewhere = ['dominant', 'half-diminished'];
    const ours = new Set(Object.values(SCALES).map((scale) => scale.helix.heights.join()));
    const readNames: string[] = [];
    for (const type of ScaleType.all()) {
      const set = setOfChroma(type.chroma);
      if (!ours.has(set.join())) continue;
      for (const name of [type.name, ...type.aliases].filter((n) => !elsewhere.includes(n))) {
        expect(read(name, { kind: 'scale' }).helix.heights, name).toEqual(set);
        readNames.push(name);
      }
    }
    expect(readNames.length).toBeGreaterThan(50);
  });

  describe('spelling', () => {
    const tonics = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap((l) => [l + 'b', l, l + '#']);
    const tonalSpelling = (notes: string[]) =>
      notes.map((n) => {
        const { letter, alt } = Note.get(n);
        return `${letter}${alt}`;
      });
    const ours = (tonic: string, heights: readonly number[]) =>
      spell(parseNote(tonic)!, heights).map((n) => `${n.letter}${n.alteration}`);

    /** tonal's name for each scale both know, where tonal spells it by another convention. */
    const conventions: Record<string, string> = {
      // tonal spells the altered scale as jazz alterations (♭9 ♯9 3 ♯11 ♭13 ♭7), with no 4th
      // and two letters D; here a 7-note scale takes one letter per degree (super locrian).
      altered: 'b9, #9 and #11 over one letter per degree',
      // Not 7 notes: here each height takes its usual interval (quintenzirkel's rule),
      // tonal one letter per note.
      'whole tone': 'tonal: C D E F# G# A#; here C D E Gb G# Bb',
      augmented: 'tonal: C D# E G G# B; here C Eb E G Ab B',
    };

    it("agrees with tonal's spelling of every scale both know, from 21 tonics, except where the conventions differ", () => {
      const tonalByName = new Map(
        ScaleType.all().flatMap((type) =>
          [type.name, ...type.aliases].map((n) => [normalizeWords(n), type.name] as const),
        ),
      );
      const differ = new Set<string>();
      let agreed = 0;
      for (const [name, { helix }] of Object.entries(SCALES)) {
        const tonalName = tonalByName.get(normalizeWords(name));
        if (!tonalName) continue;
        for (const tonic of tonics) {
          const theirs = tonalSpelling(Scale.get(`${tonic} ${tonalName}`).notes);
          if (theirs.join() === ours(tonic, helix.heights).join()) agreed++;
          else differ.add(name);
        }
      }
      expect([...differ].sort()).toEqual(Object.keys(conventions).sort());
      expect(agreed).toBe(525);
    });

    it("agrees with tonal's spelling of every chord symbol both read, from 21 roots", () => {
      let agreed = 0;
      for (const [name, quality] of Object.entries(CHORD_QUALITIES)) {
        for (const symbol of quality.symbols) {
          for (const root of tonics) {
            const theirs = Chord.get(root + symbol);
            if (theirs.empty) continue;
            expect(ours(root, quality.stack), `${root}${symbol} (${name})`).toEqual(
              tonalSpelling(theirs.notes),
            );
            agreed++;
          }
        }
      }
      expect(agreed).toBe(840);
    });
  });

  it("finds every implied chord scale among tonal's chord scales for that chord", () => {
    // tonal's Chord.chordScales lists the scales that hold a chord, by its
    // quality alone. Whatever the key, the implied scale must be one of them.
    const symbols: Record<string, string> = {
      major: '',
      minor: 'm',
      diminished: 'dim',
      augmented: 'aug',
      '7': '7',
      maj7: 'maj7',
      m7: 'm7',
      m7b5: 'm7b5',
      '9': '9',
      maj9: 'maj9',
      m9: 'm9',
    };
    let checked = 0;
    for (const mode of ['aeolian', 'dorian', 'ionian', 'mixolydian'] as const) {
      for (let root = 0; root < 12; root++) {
        for (const [quality, symbol] of Object.entries(symbols)) {
          const chord = CHORD_QUALITIES[quality]!.stack.map((x) => x + root);
          const scale = chordScale(diatonicMode(mode), chord);
          if (!scale) continue;
          const fromRoot = scale.heights.map((x) => x - scale.heights[0]!).join();
          const theirs = Chord.chordScales('C' + symbol).map((name) =>
            setOfChroma(ScaleType.get(name).chroma).join(),
          );
          expect(theirs, `${mode}: ${root} ${quality} → ${fromRoot}`).toContain(fromRoot);
          checked++;
        }
      }
    }
    expect(checked).toBe(332);
  });
});
