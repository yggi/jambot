/**
 * Spelling: the letter and accidental of each note, from a spelled tonic.
 *
 * A note's letter is its generic interval above the tonic, counted in
 * letters, and its accidental is whatever the specific interval leaves over.
 * So E♭ harmonic minor has a C♭ and not a B: its sixth degree is a sixth
 * above E♭. Spelling is choosing a generic for each height:
 *
 * - a stack of thirds takes a third per note: C E♭ G♭ B♭♭;
 * - a 7-note scale takes one letter per degree, whatever accidentals that
 *   costs;
 * - anything else takes the usual interval of each size, with
 *   quintenzirkel's two exceptions: the tritone is a ♯4 beside a fifth and no
 *   fourth, and 8 semitones are a ♯5 beside a third and no fifth.
 *
 * quintenzirkel spells the same way (`spellDegree`), and tonal agrees except
 * on a few scales, where the tests name the convention.
 */

import { mod } from './helix.ts';
import { diatonicMode } from './modes.ts';
import { LETTERS, type Note } from './notes.ts';

/** The usual generic interval of each size in semitones: m2, M2, m3, M3, P4, d5, P5, m6, … */
const USUAL_GENERIC = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];

/** Semitones from C to each natural letter: the C ionian set, as in `parseNote`. */
const NATURALS = diatonicMode('ionian').heights;

/** The generic interval of each height above the first, counted in letters (a third is 2). */
export function genericsOf(heights: readonly number[]): number[] {
  const above = heights.map((x) => x - heights[0]!);
  const gaps = above.slice(1).map((x, i) => x - above[i]!);
  if (gaps.length > 0 && gaps.every((gap) => gap === 3 || gap === 4))
    return above.map((_, i) => 2 * i);
  if (above.length === 7 && above[6]! < 12) return above.map((_, d) => d);
  const classes = new Set(above.map((x) => mod(x, 12)));
  return above.map((x) => {
    const size = mod(x, 12);
    let generic = USUAL_GENERIC[size]!;
    if (size === 6 && classes.has(7) && !classes.has(5)) generic = 3;
    if (size === 8 && classes.has(4) && !classes.has(7)) generic = 4;
    return generic + 7 * Math.floor(x / 12);
  });
}

/**
 * The notes at these heights, spelled from `tonic`, which stands at the first
 * height. The generics default to `genericsOf(heights)`. A tonic with an
 * accidental can take more than a double one: C♭ ultralocrian has a B♭♭♭.
 */
export function spell(
  tonic: Note,
  heights: readonly number[],
  generics: readonly number[] = genericsOf(heights),
): Note[] {
  const first = LETTERS.indexOf(tonic.letter);
  return heights.map((height, i) => {
    const letter = first + generics[i]!;
    const pitchClass = mod(tonic.pitchClass + height - heights[0]!, 12);
    const natural = NATURALS[mod(letter, 7)]!;
    let alteration = mod(pitchClass - natural, 12);
    if (alteration > 6) alteration -= 12;
    return { letter: LETTERS[mod(letter, 7)]!, alteration, pitchClass };
  });
}
