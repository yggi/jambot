/**
 * Licences: how far a layer below may move what the layer above sets.
 *
 * The layer above gives a default and a licence, the width of the hole it
 * leaves; the layer below nudges within it and never selects outright. The
 * same shape recurs at four levels, and `licenceOf` gives all four from
 * the style: the performer's feel at the note (`performer.ts`, T17), the
 * tempo, which the players nudge by a ratio of the style's, the key,
 * which they nudge around the circle of fifths from the song's home, and
 * the melodic scale the lead walks over the key (#209).
 *
 * The genre sets the range and the players' entropy sets how much of it is
 * used (#176): presets never set entropy (`style.ts`). So the feel reads
 * swing and articulation, the genre's, and entropy; the tempo's reach reads
 * entropy alone; the key's reach reads the harmony alone, `harm`; the
 * melodic scales read the harmony and the swing, which open the pentatonic
 * and the blues.
 */

import { diatonicMode, fifthsIndex, mod, relative, wrap } from '@jambot/theory';
import { type Key, MELODIC_SCALES, type MelodicScale, keyHelix } from './key.ts';
import { AXES, type Style } from './style.ts';

/** How far a tempo nudge reaches either way from the style's tempo at entropy 1, in octaves. */
export const TEMPO_REACH = 1 / 3;

/** One nudge of the tempo, in octaves: 2^(1/24), about 3 %; eight reach the widest licence's edge. */
export const TEMPO_STEP = 1 / 24;

/** The tempo's reach at entropy 0: two steps, so the metrum's nudge is never dead. */
const TEMPO_REACH_LEAST = 2 * TEMPO_STEP;

/** What a style leaves its players and performers. */
export interface Licence {
  /**
   * How loosely a note is played, 0 to 1: the width of the performer's
   * draw on velocity and length (`performer.ts`, T17). Exactly 0, every
   * note as the base sets it, at swing 0, entropy 0 and articulation 1.
   */
  readonly feel: number;
  /** How far the tempo may be nudged from the style's, in octaves each way (`tempoLicence`). */
  readonly tempo: { readonly low: number; readonly high: number };
  /** How many fifths from the home key the players may take the key: at least one. */
  readonly keyReach: number;
  /** The melodic scales the lead may walk (#209): the plain one always, more as the harmony grows. */
  readonly melodic: readonly MelodicScale[];
}

/**
 * What opens each melodic scale beyond the plain one (#209).
 * The pentatonic leaves out the key's two semitones, so no note leans on a
 * neighbour to resolve and the line floats open over the chords: the
 * harmony opens it, from `harm` 1/3. The blues adds the blue note, bent
 * against the beat: the swing opens it, from `swing` 1/4, and with it the
 * pentatonic the blues holds. So a band that swings reaches the blues at
 * any harmony, as Funk does.
 */
export const MELODIC_OPENS = { pentatonic: 1 / 3, blues: 1 / 4 } as const;

/** The melodic scales a style reaches, in `MELODIC_SCALES`' order: its harmony and its swing alone. */
function melodicReach({ harm, swing }: Style): MelodicScale[] {
  const blues = swing >= MELODIC_OPENS.blues;
  const pentatonic = blues || harm >= MELODIC_OPENS.pentatonic;
  return MELODIC_SCALES.filter((scale) =>
    scale === 'blues' ? blues : scale === 'pentatonic' ? pentatonic : true,
  );
}

/**
 * Where harmony and swing meet, as their product, enough for a scale to be
 * the default: rich chords under a laid-back swing float the pentatonic
 * (Lo-fi hip hop, 0.34), and both at full swing the blues (Swing jazz, 1).
 */
export const MELODIC_DEFAULT_FROM = { pentatonic: 1 / 4, blues: 2 / 3 } as const;

/**
 * The melodic scale a style plays where the players wish for none: the
 * blues or the pentatonic where harmony and swing meet enough
 * (`MELODIC_DEFAULT_FROM`), else the plain one. A default needs swing, so
 * it is always within the reach.
 */
export function melodicDefault({ harm, swing }: Style): MelodicScale {
  const meet = harm * swing;
  return meet >= MELODIC_DEFAULT_FROM.blues
    ? 'blues'
    : meet >= MELODIC_DEFAULT_FROM.pentatonic
      ? 'pentatonic'
      : 'plain';
}

/**
 * A wished melodic scale held within the style's reach: itself where the
 * style reaches it, else none, so the style's own default plays
 * (`melodicDefault`). Not the widest scale it reaches: a style's default is
 * a scale it chose, which a wish pulled to the plain one would override.
 */
export function melodicWithin(scale: MelodicScale | null, style: Style): MelodicScale | null {
  return scale !== null && melodicReach(style).includes(scale) ? scale : null;
}

/**
 * How many fifths the harmony reaches from the home key: `harm` 0 none, so
 * only the relative keys, 1 six, every key. The band's own drift reads it
 * as it is (#169); the players' licence gives them at least a fifth.
 */
export function harmonicReach(style: Style): number {
  return Math.round(6 * style.harm);
}

/**
 * The feel: swing weighs most, then entropy, then legato. The weights sum
 * to 1, so it stays within 0 and 1 over the axes; at any one entropy the
 * presets run from Techno, straight and staccato, to Swing jazz.
 */
function feelOf(style: Style): number {
  return 0.5 * style.swing + 0.3 * style.entropy + 0.2 * (1 - style.artic);
}

/** The licence a style leaves: the feel, the tempo's, the key's and the melodic scale's. */
export function licenceOf(style: Style): Licence {
  return {
    feel: feelOf(style),
    tempo: tempoLicence(style),
    keyReach: Math.max(1, harmonicReach(style)),
    melodic: melodicReach(style),
  };
}

/**
 * How far the tempo may be nudged from the style's, in octaves each way:
 * the reach rises with entropy, from two steps at 0 to `TEMPO_REACH` at 1,
 * and goes no further than the tempo axis goes, so the tempo played is
 * always the style's times 2 to the nudge exactly.
 */
export function tempoLicence(style: Style): { low: number; high: number } {
  const reach = TEMPO_REACH_LEAST + style.entropy * (TEMPO_REACH - TEMPO_REACH_LEAST);
  return {
    low: Math.max(-reach, Math.log2(AXES.bpm.min / style.bpm)),
    high: Math.min(reach, Math.log2(AXES.bpm.max / style.bpm)),
  };
}

/** A tempo nudge held within the style's licence. */
export function tempoNudgeWithin(nudge: number, style: Style): number {
  const { low, high } = tempoLicence(style);
  return Math.max(low, Math.min(high, nudge));
}

/** The tempo played: the style's, nudged by a ratio within its licence. */
export function nudgedTempo(style: Style, nudge: number): number {
  return style.bpm * 2 ** tempoNudgeWithin(nudge, style);
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
