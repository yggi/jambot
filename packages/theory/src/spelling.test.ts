import { describe, expect, it } from 'vitest';
import { CHORD_QUALITIES } from './chords.ts';
import { type Note, parseNote } from './notes.ts';
import { read } from './read.ts';
import { SCALES } from './scales.ts';
import { genericsOf, spell } from './spelling.ts';

const note = (text: string) => parseNote(text)!;
const range = (n: number) => [...Array(n).keys()];

/** Spelled notes as text, ♯ and ♭ as quintenzirkel writes them. */
const text = (notes: readonly Note[]) =>
  notes
    .map(
      (n) => n.letter + (n.alteration > 0 ? '♯'.repeat(n.alteration) : '♭'.repeat(-n.alteration)),
    )
    .join(' ');

const chord = (root: string, quality: string) =>
  text(spell(note(root), CHORD_QUALITIES[quality]!.stack));
const scale = (tonic: string, name: string) =>
  text(spell(note(tonic), SCALES[name]!.helix.heights));

describe('spell', () => {
  it("spells by degree, not by pitch class: quintenzirkel's golden spellings", () => {
    // tests/theory-spelling.js in quintenzirkel, every case.
    expect(chord('C', 'major')).toBe('C E G');
    expect(chord('C', 'minor')).toBe('C E♭ G');
    expect(chord('A', 'major')).toBe('A C♯ E');
    expect(chord('D♭', 'major')).toBe('D♭ F A♭');
    expect(chord('F♯', 'major')).toBe('F♯ A♯ C♯');
    expect(chord('C', 'diminished')).toBe('C E♭ G♭');
    expect(chord('C', 'augmented')).toBe('C E G♯');
    expect(chord('C', '7')).toBe('C E G B♭');
    expect(scale('C', 'lydian')).toBe('C D E F♯ G A B');
    expect(scale('C', 'aeolian')).toBe('C D E♭ F G A♭ B♭');
    expect(scale('C', 'blues')).toBe('C E♭ F G♭ G B♭');
    expect(scale('E♭', 'harmonic minor')).toBe('E♭ F G♭ A♭ B♭ C♭ D');
    expect(text(spell(note('C'), [0, 12]))).toBe('C C');
    expect(chord('C', 'harmonics')).toBe('C C G C E');
    expect(chord('E♭', 'harmonics')).toBe('E♭ E♭ B♭ E♭ G');
  });

  it('gives a 7-note scale one letter per degree, however many accidentals that takes', () => {
    for (const [name, { helix }] of Object.entries(SCALES)) {
      if (helix.heights.length !== 7) continue;
      for (const tonic of ['C', 'E♭', 'F♯', 'B', 'G♭']) {
        const letters = spell(note(tonic), helix.heights).map((n) => n.letter);
        expect(new Set(letters).size, `${tonic} ${name}`).toBe(7);
      }
    }
    expect(scale('C', 'ultralocrian')).toBe('C D♭ E♭ F♭ G♭ A♭ B♭♭');
    expect(scale('C', 'lydian #2')).toBe('C D♯ E F♯ G A B');
  });

  it('spells a stack of thirds in thirds', () => {
    expect(chord('C', 'dim7')).toBe('C E♭ G♭ B♭♭');
    expect(chord('E♭', 'dim7')).toBe('E♭ G♭ B♭♭ D♭♭');
    expect(chord('C', 'maj9')).toBe('C E G B D');
    expect(chord('C', 'm7b5')).toBe('C E♭ G♭ B♭');
    expect(chord('C', 'mMaj7')).toBe('C E♭ G B');
  });

  it('spells anything else in thirds over its chord: third and fifth as 3 and 5, the rest as 9 11 13 7', () => {
    expect(chord('C', '6')).toBe('C E G A');
    expect(chord('C', 'sus4')).toBe('C F G');
    expect(chord('C', 'add9')).toBe('C E G D');
    expect(scale('C', 'major pentatonic')).toBe('C D E G A');
    expect(scale('C', 'half whole diminished')).toBe('C D♭ E♭ E F♯ G A B♭');
    expect(scale('C', 'diminished')).toBe('C D E♭ F G♭ A♭ A B');
    // Over 7♯5: 9 ♯11 ♯5 ♭7. Over maj7: ♯9 and ♭13.
    expect(scale('C', 'whole tone')).toBe('C D E F♯ G♯ B♭');
    expect(scale('C', 'augmented')).toBe('C D♯ E G A♭ B');
  });

  it('uses each letter once where the notes fit, except for the blue notes', () => {
    // A tension whose letter is taken is a blue note: ♭3 beside the major
    // third, ♭5 beside the fifth. Only the two blues scales need one.
    const repeating: string[] = [];
    for (const [name, { helix }] of Object.entries(SCALES)) {
      if (helix.heights.length > 7) continue;
      for (const tonic of ['C', 'E♭', 'F♯', 'A']) {
        const letters = spell(note(tonic), helix.heights).map((n) => n.letter);
        if (new Set(letters).size < letters.length) repeating.push(name);
      }
    }
    expect([...new Set(repeating)].sort()).toEqual(['blues', 'major blues']);
    expect(scale('C', 'blues')).toBe('C E♭ F G♭ G B♭');
    expect(scale('C', 'major blues')).toBe('C D E♭ E G A');
    expect(scale('C', 'chromatic')).toBe('C D♭ D E♭ E F G♭ G A♭ A B♭ B');
  });

  it('reads the tritone as ♯4 beside a fifth and no fourth, and 8 as ♯5 beside a third and no fifth', () => {
    // quintenzirkel's two exceptions (spellDegree in src/0-base/theory/circle.js).
    expect(genericsOf([0, 6])).toEqual([0, 4]);
    expect(genericsOf([0, 6, 7])).toEqual([0, 3, 4]);
    expect(genericsOf([0, 5, 6, 7])).toEqual([0, 3, 4, 4]);
    expect(genericsOf([0, 8])).toEqual([0, 5]);
    expect(genericsOf([0, 4, 8])).toEqual([0, 2, 4]);
    expect(genericsOf([0, 4, 7, 8])).toEqual([0, 2, 4, 5]);
  });

  it('measures from the first height, and counts octaves above it', () => {
    const gMajor = SCALES['ionian']!.helix.heights.map((x) => x + 7);
    expect(text(spell(note('G'), gMajor))).toBe('G A B C D E F♯');
    expect(genericsOf([0, 12, 19, 24, 28])).toEqual([0, 7, 11, 14, 16]);
    expect(genericsOf([5, 17])).toEqual([0, 7]);
  });

  it('needs more than a double accidental only on a tonic that has one already', () => {
    const tonics = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap((l) => [l + 'b', l, l + '#']);
    const beyond: string[] = [];
    for (const tonic of tonics) {
      const stacks = [
        ...Object.values(SCALES).map((s) => s.helix.heights),
        ...Object.values(CHORD_QUALITIES).map((q) => q.stack),
      ];
      for (const heights of stacks)
        if (spell(note(tonic), heights).some((n) => Math.abs(n.alteration) > 2)) beyond.push(tonic);
    }
    expect(beyond).toHaveLength(13);
    expect(new Set(beyond)).toEqual(new Set(['Cb', 'Fb', 'E#', 'B#']));
    expect(chord('C♭', 'dim7')).toBe('C♭ E♭♭ G♭♭ B♭♭♭');
  });

  it('spells every set of up to 7 notes on C with at most a double accidental, its letters in order', () => {
    // One letter per degree fits a 7-note set only when each degree is an
    // interval of its own number, at most doubly altered: the cluster
    // C D♭ D E♭ E F G♭ would reach G♭♭♭, and 307 sets would go beyond a double
    // accidental. The generics never fall below those of a lower note.
    let sets = 0;
    for (let mask = 0; mask < 1 << 11; mask++) {
      const heights = [
        0,
        ...range(11)
          .filter((i) => mask & (1 << i))
          .map((i) => i + 1),
      ];
      if (heights.length > 7) continue;
      sets++;
      const notes = spell(note('C'), heights);
      expect(
        Math.max(...notes.map((n) => Math.abs(n.alteration))),
        text(notes),
      ).toBeLessThanOrEqual(2);
      const generics = genericsOf(heights);
      generics.forEach(
        (g, i) => i > 0 && expect(g, text(notes)).toBeGreaterThanOrEqual(generics[i - 1]!),
      );
    }
    expect(sets).toBe(1486);
    expect(text(spell(note('C'), [0, 1, 2, 3, 4, 5, 6]))).toBe('C D♭ D E♭ E F G♭');
  });

  it('spells the pitch classes the heights stand on', () => {
    for (const [name, { helix }] of Object.entries(SCALES)) {
      for (const tonic of ['C', 'D♭', 'F♯', 'A♭', 'B']) {
        const t = note(tonic);
        const notes = spell(t, helix.heights);
        notes.forEach((n, d) =>
          expect(n.pitchClass, `${tonic} ${name} ${d}`).toBe(
            (t.pitchClass + helix.heights[d]!) % 12,
          ),
        );
      }
    }
  });
});

describe('keys by name', () => {
  it('reads every tonic spelling with every scale name, with a space or a colon', () => {
    const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const accidentals = ['bb', 'b', '', '#', '##'];
    for (const letter of letters) {
      for (const accidental of accidentals) {
        const tonic = letter + accidental;
        for (const [name, { helix }] of Object.entries(SCALES)) {
          const spaced = read(`${tonic} ${name}`, { kind: 'scale' });
          expect(read(`${tonic}:${name}`, { kind: 'scale' }), `${tonic}:${name}`).toEqual(spaced);
          expect(spaced.helix.heights[0], `${tonic} ${name}`).toBe(note(tonic).pitchClass);
          expect(spaced.helix.heights.map((x) => x - spaced.helix.heights[0]!)).toEqual(
            helix.heights,
          );
        }
      }
    }
  });

  it("reads the prototype's keys, including the enharmonic ones it drops", () => {
    // parseKey in the prototype accepts only C C# D Eb E F F# G Ab A Bb B (#12).
    for (const key of ['Db:major', 'D#:minor', 'Gb:major', 'A#:minor', 'A:aeolian', 'Eb:dorian'])
      expect(read(key, { kind: 'scale' }).kind, key).toBe('scale');
    expect(read('Db:major', { kind: 'scale' }).helix.heights).toEqual([1, 3, 5, 6, 8, 10, 12]);
  });
});
