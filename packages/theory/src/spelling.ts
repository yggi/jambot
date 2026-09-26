/**
 * Spelling: the letter and accidental of each note, from a spelled tonic.
 *
 * A note's letter is its generic interval above the tonic, counted in
 * letters, and its accidental is whatever the specific interval leaves over.
 * So E♭ harmonic minor has a C♭ and not a B: its sixth degree is a sixth
 * above E♭. Spelling is choosing a generic for each height, and the rule is
 * to spell in thirds, as the notes sound over their chord:
 *
 * - a stack of thirds takes a third per note: C E♭ G♭ B♭♭;
 * - a 7-note scale takes one letter per degree, which is its thirds
 *   stacked: E♭ harmonic minor. A scale here is 7 notes in which each
 *   degree is an interval of its own number, at most doubly diminished or
 *   augmented; a cluster such as C D♭ D E♭ E F G♭ is not one, and one letter
 *   per degree would reach G♭♭♭;
 * - anything else finds the third and fifth of its chord from the root (a
 *   major third, else a minor one; a perfect fifth, else ♯5 over a major
 *   third, else ♭5), spells them as 3 and 5, and every other note from low
 *   to high as a 9, 11, 13 or 7. A note whose letter is taken by then takes
 *   the usual interval of its size, which makes the blue notes: ♭3 beside
 *   the major third, ♭5 beside the fifth. So the whole tone scale is
 *   C D E F♯ G♯ B♭ (9 ♯11 ♯5 ♭7 over 7♯5), and the blues is C E♭ F G♭ G B♭.
 *
 * This keeps quintenzirkel's spellings (`spellDegree`) and its two exceptions,
 * the ♯4 beside a fifth and no fourth and the ♯5 beside a third and no fifth.
 * tonal agrees except on three scales, which the tests name.
 */

import { mod } from './helix.ts';
import { diatonicMode } from './modes.ts';
import { LETTERS, type Note } from './notes.ts';

/** The usual generic interval of each size in semitones: m2, M2, m3, M3, P4, d5, P5, m6, … */
const USUAL_GENERIC = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];

/** The letter a note takes over the chord: 9 for 1–3 semitones, 11 for 4–6, 13 for 8–9, 7 for 10–11. */
const TENSION_GENERIC = [0, 1, 1, 1, 3, 3, 3, 4, 5, 5, 6, 6];

/** Semitones from C to each natural letter: the C ionian set, as in `parseNote`. */
const NATURALS = diatonicMode('ionian').heights;

/** The generic interval of each height above the first, counted in letters (a third is 2). */
export function genericsOf(heights: readonly number[]): number[] {
  const above = heights.map((x) => x - heights[0]!);
  const gaps = above.slice(1).map((x, i) => x - above[i]!);
  if (gaps.length > 0 && gaps.every((gap) => gap === 3 || gap === 4))
    return above.map((_, i) => 2 * i);
  if (above.length === 7 && above.every((x, d) => Math.abs(x - NATURALS[d]!) <= 2))
    return above.map((_, d) => d);
  const bySize = genericsOverChord(new Set(above.map((x) => mod(x, 12))));
  return above.map((x) => bySize.get(mod(x, 12))! + 7 * Math.floor(x / 12));
}

/** Each size's generic: the chord's third and fifth as 3 and 5, the rest as 9 11 13 or 7, or the usual interval where that letter is taken. */
function genericsOverChord(sizes: ReadonlySet<number>): Map<number, number> {
  const third = sizes.has(4) ? 4 : sizes.has(3) ? 3 : undefined;
  const fifth = sizes.has(7) ? 7 : third === 4 && sizes.has(8) ? 8 : sizes.has(6) ? 6 : undefined;
  const generics = new Map<number, number>([[0, 0]]);
  if (third !== undefined) generics.set(third, 2);
  if (fifth !== undefined) generics.set(fifth, 4);
  const taken = new Set<number>();
  for (const size of [...sizes].sort((a, b) => a - b)) {
    if (generics.has(size)) continue;
    let generic = TENSION_GENERIC[size]!;
    if (taken.has(generic)) generic = USUAL_GENERIC[size]!;
    generics.set(size, generic);
    taken.add(generic);
  }
  return generics;
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
