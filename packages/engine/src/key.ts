/**
 * Keys: a tonic and a mode, and how the band moves between them.
 *
 * The composer plays the seven diatonic modes (#516, the owner: "jambot
 * should be able to play all 7 modes. they should all be fragments"): the
 * prototype's four, minor, dorian, major and mixolydian, whose tables
 * (`themes.ts`) are the prototype's, and phrygian, lydian and locrian, whose
 * tables are the generator's, written for #516. Where it
 * should go is a wish, held by whoever steers it: a mode, and a tonic or
 * none. The band takes the wish at the next section boundary. A wish with a
 * tonic is taken as it is; a wish for another mode alone pivots to the
 * relative key that keeps the most notes (`relative` in the theory, the
 * prototype's pivotRoot), so A minor → D dorian → C major share all seven.
 *
 * The lead walks a melodic scale over the key (#209): the key's own seven
 * degrees, its pentatonic, or its blues, minor or major as the mode is. The
 * harmony keeps the seven; the wish names the melodic scale beside the key,
 * and the style's licence says which it may be (`licence.ts`).
 */

import {
  type Helix,
  alteredHeight,
  diatonicMode,
  nameOf,
  relative,
  shift,
  spelledTonic,
  wrap,
} from '@jambot/theory';

export const COMPOSER_MODES = [
  'aeolian',
  'dorian',
  'ionian',
  'mixolydian',
  'phrygian',
  'lydian',
  'locrian',
] as const;
export type ComposerMode = (typeof COMPOSER_MODES)[number];

export interface Key {
  /** The tonic's pitch class, 0–11, C = 0. */
  readonly tonic: number;
  readonly mode: ComposerMode;
}

/**
 * The scale the lead walks over the key (#209): the key's own seven degrees,
 * or a subset of them with a blue note added. Named so, not "scale", since a
 * scale is also a set of pitch classes and the theory's `SCALES`.
 */
export const MELODIC_SCALES = ['plain', 'pentatonic', 'blues'] as const;
export type MelodicScale = (typeof MELODIC_SCALES)[number];

/**
 * Where the band should go: a mode, and a tonic, or none to pivot; and the
 * melodic scale its lead walks, or none for the style's default.
 */
export interface KeyWish {
  readonly tonic: number | null;
  readonly mode: ComposerMode;
  readonly melodic: MelodicScale | null;
}

/** A aeolian: its mode the one the repository finds at the opening style's point (`presetMode`, a test holds it). */
export const INITIAL_KEY: Key = { tonic: 9, mode: 'aeolian' };

/** The key as a helix: its mode, shifted to its tonic. */
export function keyHelix(key: Key): Helix {
  return shift(diatonicMode(key.mode), key.tonic);
}

/**
 * Each melodic scale as degrees of its parent, from 0, each with its
 * accidental, a semitone (U4's notation), in rising order. The pentatonic
 * leaves out the degrees a semitone from their neighbours, and the blues
 * adds a flat under a degree of it: ♭5 in minor, ♭3 in major.
 */
const MELODIC_DEGREES: Record<
  'minor' | 'major',
  Record<MelodicScale, readonly (readonly [number, number])[]>
> = {
  minor: {
    plain: [0, 1, 2, 3, 4, 5, 6].map((d) => [d, 0] as const),
    pentatonic: [
      [0, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [6, 0],
    ],
    blues: [
      [0, 0],
      [2, 0],
      [3, 0],
      [4, -1],
      [4, 0],
      [6, 0],
    ],
  },
  major: {
    plain: [0, 1, 2, 3, 4, 5, 6].map((d) => [d, 0] as const),
    pentatonic: [
      [0, 0],
      [1, 0],
      [2, 0],
      [4, 0],
      [5, 0],
    ],
    blues: [
      [0, 0],
      [1, 0],
      [2, -1],
      [2, 0],
      [4, 0],
      [5, 0],
    ],
  },
};

/**
 * The melodic scale over a key, as a helix on the key's heights: `plain` is
 * the key itself; the others are minor or major as the key's third is. A key
 * whose fifth is diminished (locrian, #516) has neither: the pentatonic and
 * the blues stand on a perfect fifth, so its lead walks the key's seven.
 */
export function melodicHelix(key: Key, scale: MelodicScale): Helix {
  const parent = keyHelix(key);
  if (scale === 'plain' || parent.heights[4]! - parent.heights[0]! !== 7) return parent;
  const side = parent.heights[2]! - parent.heights[0]! === 3 ? 'minor' : 'major';
  return {
    cycle: parent.cycle,
    heights: MELODIC_DEGREES[side][scale].map(([degree, accidental]) =>
      alteredHeight(parent, degree, accidental),
    ),
  };
}

/** The key a wish leads to from a key; the same key when the wish is met. */
export function nextKey(key: Key, wish: Pick<KeyWish, 'tonic' | 'mode'>): Key {
  if (wish.tonic !== null)
    return wish.tonic === key.tonic && wish.mode === key.mode
      ? key
      : { tonic: wish.tonic, mode: wish.mode };
  if (wish.mode === key.mode) return key;
  const pivot = relative(keyHelix(key), diatonicMode(wish.mode));
  return { tonic: wrap(pivot.heights[0]!, 12), mode: wish.mode };
}

/**
 * A wish once the band plays it: a tonic wished for lets go once met, so the
 * band moves on from there on its own (#169); any other wish stands as it is,
 * and so does the melodic scale, as the mode does.
 */
export function released(wish: KeyWish, key: Key): KeyWish {
  return wish.tonic === key.tonic && wish.mode === key.mode ? { ...wish, tonic: null } : wish;
}

/** A key as people read it, its tonic spelled in the key: "A aeolian", "Eb dorian". */
export function keyName(key: Key): string {
  const scale = keyHelix(key);
  return nameOf({ kind: 'scale', tonic: spelledTonic(scale), name: key.mode, helix: scale });
}
