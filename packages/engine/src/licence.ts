/**
 * Licences: how far a layer below may move what the layer above sets.
 *
 * The layer above gives a default and a licence, the width of the hole it
 * leaves; the layer below nudges within it and never selects outright. The
 * performer's licence on a note's velocity and length (`performer.ts`, T17)
 * is this shape at the note. Here it is at the tempo and the key: the style
 * sets the tempo, and the players nudge it by a ratio; the song has a home
 * key, and the players nudge it around the circle of fifths.
 *
 * Every style gives the same licence today: a third of an octave of tempo
 * either way, and every key. It is meant to come from the style, so a style
 * can leave its players more room or less (a gradient from tight synth-pop
 * to free jazz); which axes should narrow or widen it is open (#171), and
 * then `tempoLicence` and the key's reach take the style.
 */

import { diatonicMode, fifthsIndex, mod, relative, wrap } from '@jambot/theory';
import { type Key, keyHelix } from './key.ts';
import { AXES } from './style.ts';

/** How far a tempo nudge reaches either way from the style's tempo, in octaves. */
export const TEMPO_REACH = 1 / 3;

/** One nudge of the tempo, in octaves: 2^(1/24), about 3 %; eight reach the licence's edge. */
export const TEMPO_STEP = 1 / 24;

/** How many fifths from the home key the players may take the key: 6 reaches every key. */
export const KEY_REACH = 6;

/**
 * How far the tempo may be nudged from `base`, in octaves each way: the
 * style's reach, and no further than the tempo axis goes, so the tempo
 * played is always `base` times 2 to the nudge exactly.
 */
export function tempoLicence(base: number): { low: number; high: number } {
  return {
    low: Math.max(-TEMPO_REACH, Math.log2(AXES.bpm.min / base)),
    high: Math.min(TEMPO_REACH, Math.log2(AXES.bpm.max / base)),
  };
}

/** A tempo nudge held within its licence. */
export function tempoNudgeWithin(nudge: number, base: number): number {
  const { low, high } = tempoLicence(base);
  return Math.max(low, Math.min(high, nudge));
}

/** The tempo played: the style's, `base`, nudged by a ratio within its licence. */
export function nudgedTempo(base: number, nudge: number): number {
  return base * 2 ** tempoNudgeWithin(nudge, base);
}

/** A key's signature: its relative major's place on the circle of fifths, C = 0. */
function signature(key: Key): number {
  const major = relative(keyHelix(key), diatonicMode('ionian'));
  return fifthsIndex(wrap(major.heights[0]!, 12));
}

/**
 * How many fifths key `a`'s signature lies from key `b`'s, −6 to 5: sharpwards
 * positive. Keys with the same notes, such as A aeolian and C ionian, lie 0
 * apart, whatever their tonic.
 */
export function fifthsApart(a: Key, b: Key): number {
  return mod(signature(a) - signature(b) + 6, 12) - 6;
}

/**
 * A key within `reach` fifths of `home`: the key itself when it is, else the
 * nearest one that is, in the same mode, its tonic moved back toward home a
 * fifth at a time.
 */
export function intoReach(key: Key, home: Key, reach: number): Key {
  const apart = fifthsApart(key, home);
  const excess = Math.abs(apart) - reach;
  if (excess <= 0) return key;
  return { tonic: mod(key.tonic - Math.sign(apart) * 7 * excess, 12), mode: key.mode };
}
