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
 * entropy alone; the key's reach and the melodic scales read the harmony
 * alone, `harm`.
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
 * The harmony each melodic scale is reached from: at a low `harm` the lead
 * keeps the plain major or minor, from a third the pentatonic, from two
 * thirds the blues (#209). So Techno, Funk and Ambient keep the plain scale,
 * Synth-pop and Deep house add the pentatonic, and the rest the blues too.
 */
export const MELODIC_FROM: Readonly<Record<MelodicScale, number>> = {
  plain: 0,
  pentatonic: 1 / 3,
  blues: 2 / 3,
};

/** The melodic scales a style's harmony reaches, in `MELODIC_SCALES`' order. */
function melodicReach(style: Style): MelodicScale[] {
  return MELODIC_SCALES.filter((scale) => style.harm >= MELODIC_FROM[scale]);
}

/**
 * The melodic scale a style plays where the players wish for none: the
 * narrowest it reaches, which is the plain one everywhere, so a scale other
 * than the key's own is the players' choice until defaults are set by ear.
 */
export function melodicDefault(style: Style): MelodicScale {
  return melodicReach(style)[0]!;
}

/**
 * A wished melodic scale held within the style's reach: itself where the
 * style reaches it, else the widest scale it does reach, as a tonic beyond
 * the key's reach is held at its edge (`intoReach`).
 */
export function melodicWithin(scale: MelodicScale, style: Style): MelodicScale {
  const reach = melodicReach(style);
  return reach.includes(scale) ? scale : reach.at(-1)!;
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
