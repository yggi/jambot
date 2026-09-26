/**
 * Keys: a scale on a tonic, the keys next to it, and the scale a chord
 * implies in it.
 *
 * Two keys are next to each other in two ways, and music has a name for
 * each: the **relative** key keeps the notes and moves the tonic (C major and
 * A minor), the **parallel** key keeps the tonic and changes the notes
 * (C major and C minor). A key change is one of these, so nothing jumps.
 *
 * A chord implies the scale that changes the fewest notes of the key while
 * holding the chord as stacked thirds: the key itself for a diatonic chord,
 * a parallel mode for a borrowed one, the key it points to for a dominant.
 *
 * A key's tonic is spelled with the fewest accidentals in the key, and the
 * fewest over its parallel scales on a tie.
 */

import { generator } from './even.ts';
import {
  type Helix,
  compose,
  degreeBelow,
  heightOf,
  lift,
  mod,
  positions,
  shift,
  wrap,
} from './helix.ts';
import { DIATONIC_MODE_NAMES, diatonicMode, mode } from './modes.ts';
import { qualityOf, splitChord } from './chords.ts';
import { LETTERS, type Note } from './notes.ts';
import { spell } from './spelling.ts';

/** The scale moved so that its degree 0 stands on the key's: C major to C minor. */
export function parallel(key: Helix, scale: Helix): Helix {
  return shift(scale, key.heights[0]! - scale.heights[0]!);
}

/**
 * The scale moved to share the most positions with the key: C major to A
 * minor. Ties go to the tonic fewest steps along the key's generator away (the
 * fifth, for a diatonic key), then to the key's own tonic, then to the lowest
 * position, as the prototype's pivotRoot chooses. The new tonic stands at the
 * height of its position nearest the key's tonic.
 */
export function relative(key: Helix, scale: Helix): Helix {
  const { cycle } = key;
  const tonic = key.heights[0]!;
  const taken = new Set(positions(key));
  const k = key.heights.length;
  const step = coprime(k, cycle) ? generator(k, cycle) : 1;
  let best = wrap(tonic, cycle);
  let bestScore = -Infinity;
  for (let position = 0; position < cycle; position++) {
    const moved = parallel({ cycle, heights: [position] }, scale);
    const shared = positions(moved).filter((x) => taken.has(x)).length;
    const steps = stepsAlong(position - tonic, step, cycle);
    const score =
      shared * 4 * cycle * cycle - steps * 2 - (position === wrap(tonic, cycle) ? 0 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = position;
    }
  }
  return parallel({ cycle, heights: [lift(best, cycle, tonic)] }, scale);
}

/**
 * The scale a chord implies in a key, entered at the chord's root. The chord
 * is a stack of heights, split at the octave into its helix and its tensions
 * (`splitChord`, #38).
 *
 * The helix implies the candidate that changes the fewest of the key's notes
 * and holds the helix's tones as its degrees 0, 2, 4, …. The candidates,
 * nearest first:
 *
 * - the key itself and its parallel diatonic modes;
 * - the key of each major or minor degree a fifth below the chord's root:
 *   ionian for a major target, harmonic minor for a minor one. Only a
 *   dominant fits there, so V7/ii is A phrygian dominant in C;
 *
 * with a tie going to the parallel mode, which keeps the tonic. Where none
 * holds the helix, harmonic and then melodic minor on the tonic are tried
 * (III+ in minor).
 *
 * Then each tension sets its own degree (P7): the degree nearest to it that
 * the helix doesn't sound, so a ninth sets degree 1, and V9/ii keeps its
 * natural 9 in A mixolydian ♭13. A ninth has a scale exactly where its
 * seventh has one. Otherwise the chord implies no scale, and the line has
 * to state one.
 */
export function chordScale(key: Helix, stack: readonly number[]): Helix | undefined {
  const chord = splitChord(stack, key.cycle);
  if (!chord) return undefined;
  let scale = helixScale(key, chord.helix.heights);
  for (const tension of chord.tensions)
    scale = scale && withTension(scale, chord.helix.heights.length, tension);
  return scale;
}

/** The scale a chord's helix implies: the search `chordScale` describes. */
function helixScale(key: Helix, chord: readonly number[]): Helix | undefined {
  const tonic = key.heights[0]!;
  const nearest: Helix[] = [
    key,
    ...DIATONIC_MODE_NAMES.map((name) => parallel(key, diatonicMode(name))),
    ...targetKeys(key, chord),
  ];
  const changed = (scale: Helix) =>
    positions(key).filter((x) => !positions(scale).includes(x)).length;
  const ranked = nearest
    .map((scale, order) => ({ scale, order, changed: changed(scale) }))
    .sort((a, b) => a.changed - b.changed || a.order - b.order)
    .map(({ scale }) => scale);
  const fallback = [MINOR_FORMS.harmonic, MINOR_FORMS.melodic].map((scale) => shift(scale, tonic));
  for (const scale of [...ranked, ...fallback]) {
    const entered = enterAt(scale, chord);
    if (entered) return entered;
  }
  return undefined;
}

/**
 * The scale with a tension set on its own degree: the nearest degree the
 * chord's `sounded` tones (degrees 0, 2, 4, …) leave free, ties going down.
 * A tension already in the scale changes nothing; one that would leave the
 * degrees out of order gives no scale.
 */
function withTension(scale: Helix, sounded: number, tension: number): Helix | undefined {
  const { cycle, heights } = scale;
  const k = heights.length;
  if (positions(scale).includes(wrap(tension, cycle))) return scale;
  const free = (d: number) => !(mod(d, k) % 2 === 0 && mod(d, k) / 2 < sounded);
  const below = degreeBelow(scale, tension);
  let d = below;
  while (!free(d)) d--;
  let up = below + 1;
  while (!free(up)) up++;
  if (heightOf(scale, up) - tension < tension - heightOf(scale, d)) d = up;
  const set = [...heights];
  set[mod(d, k)] = tension - cycle * Math.floor(d / k);
  const rising = set.every((x, i) => i === 0 || x > set[i - 1]!) && set[k - 1]! - set[0]! < cycle;
  return rising ? { cycle, heights: set } : undefined;
}

/**
 * The key's tonic, spelled so the key has the fewest accidentals: D♭ major
 * (5 flats), not C♯ major (7 sharps). On a tie, which is 6 sharps against 6
 * flats or a natural tonic against an altered one, it takes the spelling
 * with the fewest accidentals over the tonic's parallel scales, the ones
 * `chordScale` borrows from: F♯ major, whose borrowed chords need no double
 * accidental where G♭ major's do, but E♭ minor, which raises to D♮ where D♯
 * minor raises to C𝄪. No named scale is left with a tie.
 */
export function spelledTonic(key: Helix): Note {
  const pitchClass = wrap(key.heights[0]!, 12);
  const candidates = LETTERS.flatMap((letter, i) =>
    [0, -1, 1]
      .filter((alteration) => wrap(NATURALS[i]! + alteration, 12) === pitchClass)
      .map((alteration): Note => ({ letter, alteration, pitchClass })),
  );
  const accidentals = (tonic: Note, heights: readonly number[]) =>
    spell(tonic, heights).reduce((sum, n) => sum + Math.abs(n.alteration), 0);
  const parallels = [
    ...DIATONIC_MODE_NAMES.map(diatonicMode),
    MINOR_FORMS.harmonic,
    MINOR_FORMS.melodic,
  ];
  const ranked = candidates.map((tonic) => ({
    tonic,
    inKey: accidentals(tonic, key.heights),
    around: parallels.reduce((sum, scale) => sum + accidentals(tonic, scale.heights), 0),
  }));
  ranked.sort((a, b) => a.inKey - b.inKey || a.around - b.around);
  return ranked[0]!.tonic;
}

/** Semitones from C to each natural letter. */
const NATURALS = diatonicMode('ionian').heights;

const MINOR_FORMS = {
  harmonic: { cycle: 12, heights: [0, 2, 3, 5, 7, 8, 11] },
  melodic: { cycle: 12, heights: [0, 2, 3, 5, 7, 9, 11] },
};

/** The scale entered at the chord's root, if it holds the chord as stacked thirds. */
function enterAt(scale: Helix, chord: readonly number[]): Helix | undefined {
  const root = wrap(chord[0]!, scale.cycle);
  const d = scale.heights.findIndex((x) => wrap(x, scale.cycle) === root);
  if (d < 0) return undefined;
  const entered = mode(scale, d);
  const fits = chord.every(
    (x, i) => wrap(heightOf(entered, 2 * i), scale.cycle) === wrap(x, scale.cycle),
  );
  return fits ? shift(entered, chord[0]! - entered.heights[0]!) : undefined;
}

/**
 * The keys of the major or minor degrees a fifth below the chord's root. Only
 * a dominant (a major triad, a 7 or a 9) is stacked thirds on their fifth
 * degree, so only a dominant is ever entered in one.
 */
function targetKeys(key: Helix, chord: readonly number[]): Helix[] {
  if (key.heights.length !== 7 || key.cycle !== 12) return [];
  const targets: Helix[] = [];
  for (let d = 0; d < 7; d++) {
    const heights = compose({ cycle: 7, heights: [d, d + 2, d + 4] }, key).heights;
    if (wrap(chord[0]! - heights[0]!, 12) !== 7) continue;
    const quality = qualityOf(heights.map((x) => x - heights[0]!));
    if (quality === 'major') targets.push(shift(diatonicMode('ionian'), heights[0]!));
    if (quality === 'minor') targets.push(shift(MINOR_FORMS.harmonic, heights[0]!));
  }
  return targets;
}

function coprime(a: number, b: number): boolean {
  return b === 0 ? a === 1 : coprime(b, a % b);
}

/** How many steps of `step` round the cycle reach `distance`, the shorter way. */
function stepsAlong(distance: number, step: number, cycle: number): number {
  for (let s = 0; s <= cycle; s++) {
    if (wrap(s * step - distance, cycle) === 0 || wrap(-s * step - distance, cycle) === 0) return s;
  }
  return cycle;
}
