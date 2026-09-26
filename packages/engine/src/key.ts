/**
 * Keys: a tonic and a mode, and how the band moves between them.
 *
 * The composer's tables (`themes.ts`) cover four modes, the prototype's
 * minor, dorian, major and mixolydian, so the band plays in those. Where it
 * should go is a wish, held by whoever steers it: a mode, and a tonic or
 * none. The band takes the wish at the next section boundary. A wish with a
 * tonic is taken as it is; a wish for another mode alone pivots to the
 * relative key that keeps the most notes (`relative` in the theory, the
 * prototype's pivotRoot), so A minor → D dorian → C major share all seven.
 */

import { type Helix, diatonicMode, relative, shift, wrap } from '@jambot/theory';

export const COMPOSER_MODES = ['aeolian', 'dorian', 'ionian', 'mixolydian'] as const;
export type ComposerMode = (typeof COMPOSER_MODES)[number];

export interface Key {
  /** The tonic's pitch class, 0–11, C = 0. */
  readonly tonic: number;
  readonly mode: ComposerMode;
}

/** Where the band should go: a mode, and a tonic, or none to pivot. */
export interface KeyWish {
  readonly tonic: number | null;
  readonly mode: ComposerMode;
}

export const INITIAL_KEY: Key = { tonic: 9, mode: 'aeolian' };

/** The key as a helix: its mode, shifted to its tonic. */
export function keyHelix(key: Key): Helix {
  return shift(diatonicMode(key.mode), key.tonic);
}

/** The key a wish leads to from a key; the same key when the wish is met. */
export function nextKey(key: Key, wish: KeyWish): Key {
  if (wish.tonic !== null)
    return wish.tonic === key.tonic && wish.mode === key.mode
      ? key
      : { tonic: wish.tonic, mode: wish.mode };
  if (wish.mode === key.mode) return key;
  const pivot = relative(keyHelix(key), diatonicMode(wish.mode));
  return { tonic: wrap(pivot.heights[0]!, 12), mode: wish.mode };
}

/** The twelve tonics as the band names them, from C. */
export const TONIC_NAMES = [
  'C',
  'C♯',
  'D',
  'E♭',
  'E',
  'F',
  'F♯',
  'G',
  'A♭',
  'A',
  'B♭',
  'B',
] as const;

/** A key as people read it, such as "A aeolian". */
export function keyName(key: Key): string {
  return `${TONIC_NAMES[key.tonic]} ${key.mode}`;
}
