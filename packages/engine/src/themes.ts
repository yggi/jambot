/**
 * Themes: the harmony a section plays, as degrees of its key.
 *
 * A theme is eight bars of chord slots. Each slot is a degree of the key,
 * or a secondary dominant toward a degree, and starts on step 0 or on the
 * bar's half, step 8. There are three kinds: A for the grooves and drops, B
 * for contrast (the bridge and the breakdown), and a fresh one for each
 * build.
 *
 * Low harmony vamps: one or two chords from the mode's vamps, four bars or
 * two each. Higher up the theme is a progression of four bars, walked
 * through the mode's transition table, with more motion by fifths, a
 * cadence to the dominant in the fourth bar, and at the top secondary
 * dominants and a ii–V. The second four bars repeat the first, and entropy
 * may change the last. These are the prototype's tables for its four modes,
 * and the generator's for phrygian, lydian and locrian (#516), each leaning
 * on its mode's colour: phrygian's and locrian's ♭II, lydian's major II.
 */

import { compose, heightOf, wrap } from '@jambot/theory';
import type { SectionType } from './form.ts';
import { type ComposerMode, type Key, keyHelix } from './key.ts';
import { chance, draw, pick } from './random.ts';

export const THEME_KINDS = ['A', 'B', 'build'] as const;
export type ThemeKind = (typeof THEME_KINDS)[number];

/** A chord slot: a degree of the key, or a secondary dominant toward one. */
export type Slot =
  | { readonly step: number; readonly degree: number }
  | { readonly step: number; readonly dominantOf: number };

export interface Theme {
  readonly kind: ThemeKind;
  /** The section it was built for. */
  readonly index: number;
  readonly mode: ComposerMode;
  /** The harmony it was built for. */
  readonly harm: number;
  /** Which of the mode's vamps it plays, if it is a vamp. */
  readonly vamp: number | null;
  /** Eight bars of slots, each bar's first on step 0. */
  readonly bars: readonly (readonly Slot[])[];
}

/** Which theme a kind of section plays. */
export function themeKind(type: SectionType): ThemeKind {
  if (type === 'bridge' || type === 'breakdown') return 'B';
  return type === 'build' ? 'build' : 'A';
}

/** How often each degree follows each, per mode: the prototype's TRANS. */
const TRANSITIONS: Record<ComposerMode, Record<number, Record<number, number>>> = {
  aeolian: {
    0: { 5: 3, 3: 3, 6: 2, 4: 1, 2: 1 },
    1: { 4: 3, 6: 1 },
    2: { 5: 2, 6: 2, 3: 2, 0: 1 },
    3: { 0: 2, 4: 2, 6: 2, 5: 1 },
    4: { 0: 4, 5: 1 },
    5: { 6: 3, 2: 2, 3: 2, 4: 1 },
    6: { 0: 3, 2: 3, 5: 1 },
  },
  dorian: {
    0: { 3: 4, 6: 2, 4: 1, 2: 1 },
    1: { 0: 2, 3: 1 },
    2: { 3: 2, 0: 1 },
    3: { 0: 4, 6: 1 },
    4: { 0: 2, 3: 1 },
    5: { 0: 1, 3: 1 },
    6: { 0: 3, 3: 1 },
  },
  ionian: {
    0: { 3: 3, 4: 3, 5: 3, 1: 1 },
    1: { 4: 4, 6: 1 },
    2: { 5: 3, 3: 2 },
    3: { 4: 3, 0: 2, 1: 2 },
    4: { 0: 4, 5: 2 },
    5: { 3: 3, 1: 2, 4: 1 },
    6: { 0: 3 },
  },
  mixolydian: {
    0: { 6: 4, 3: 3, 4: 1 },
    1: { 0: 1, 6: 1 },
    2: { 3: 1 },
    3: { 0: 3, 6: 1 },
    4: { 0: 2 },
    5: { 6: 1, 3: 1 },
    6: { 0: 3, 3: 2 },
  },
  phrygian: {
    0: { 1: 3, 6: 2, 3: 2, 5: 1 },
    1: { 0: 4, 6: 1 },
    2: { 1: 2, 3: 2, 0: 1 },
    3: { 1: 2, 0: 2, 6: 1 },
    4: { 1: 1, 0: 1 },
    5: { 1: 2, 6: 2, 3: 1 },
    6: { 0: 3, 1: 2 },
  },
  lydian: {
    0: { 1: 4, 4: 2, 5: 2, 6: 1 },
    1: { 0: 4, 4: 1 },
    2: { 1: 2, 5: 2 },
    3: { 0: 1, 1: 1 },
    4: { 0: 3, 1: 2 },
    5: { 1: 2, 4: 2 },
    6: { 0: 2, 1: 1 },
  },
  locrian: {
    0: { 1: 4, 4: 2, 6: 2 },
    1: { 0: 4, 6: 1 },
    2: { 1: 2, 6: 1 },
    3: { 1: 2, 0: 1 },
    4: { 1: 2, 0: 2 },
    5: { 1: 2, 4: 2 },
    6: { 0: 3, 1: 2 },
  },
};

/**
 * The degree a progression's fourth bar cadences to: the dominant, but
 * mixolydian's ♭VII (the prototype's), and phrygian's and locrian's ♭II,
 * a semitone above the tonic, which falls onto it (#516).
 */
const CADENCE: Record<ComposerMode, number> = {
  aeolian: 4,
  dorian: 4,
  ionian: 4,
  mixolydian: 6,
  phrygian: 1,
  lydian: 4,
  locrian: 1,
};

/**
 * The vamps each mode plays at low harmony: the prototype's VAMPS. On a
 * miss they are the generator's; where the composer finds vamps in the
 * repository (#425, `harmony-query.ts`), they are the order it draws them
 * in, so a seed vamp is drawn where `buildTheme` would draw it.
 */
export const VAMPS: Record<ComposerMode, readonly (readonly number[])[]> = {
  aeolian: [[0], [0, 6], [0, 3], [0, 5]],
  dorian: [[0, 3], [0], [0, 6]],
  ionian: [
    [0, 3],
    [0, 4],
    [0, 5],
  ],
  mixolydian: [
    [0, 6],
    [0, 3],
  ],
  phrygian: [[0, 1], [0], [0, 6]],
  lydian: [[0, 1], [0], [0, 4]],
  locrian: [
    [0, 1],
    [0, 6],
  ],
};

/** The harmony under which a theme is a vamp; from it up, a progression walked through the mode's table. */
export const VAMP_HARM = 0.33;

/** The harmony under which a vamp lays a chord per four bars; from it up to `VAMP_HARM`, two bars each, twice over. */
export const VAMP_WIDE = 0.15;

/** A vamp's place among a mode's (`VAMPS`), by its chords; -1 for none of them. */
export const vampIndex = (mode: ComposerMode, chords: readonly number[]): number =>
  VAMPS[mode].findIndex((v) => v.join(' ') === chords.join(' '));

/**
 * A vamp's eight bars at a harmony: under `VAMP_WIDE` its first chord for
 * four bars and its second for four (the first again for a vamp of one),
 * else each two bars, twice over.
 */
export function vampBars(chords: readonly number[], harm: number): Slot[][] {
  const bar = (degree: number): Slot[] => [{ step: 0, degree }];
  const each = harm < VAMP_WIDE ? 4 : 2;
  const first = [0, 1, 2, 3].map((b) => bar(chords[Math.floor(b / each) % chords.length]!));
  const second = each === 4 ? [0, 1, 2, 3].map(() => bar(chords[1 % chords.length]!)) : first;
  return [...first, ...second];
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** A transition row as weights over the seven degrees, flattened by entropy. */
const flattened = (row: Record<number, number>, entropy: number) =>
  [0, 1, 2, 3, 4, 5, 6].map((d) => Math.pow(row[d] ?? 0.0001, 1 - 0.7 * entropy) + entropy * 0.35);

/** The triad on a degree of a key, as heights. */
const triad = (key: Key, degree: number) =>
  compose({ cycle: 7, heights: [degree, degree + 2, degree + 4] }, keyHelix(key)).heights;

export interface ThemeEnv {
  readonly seed: number;
  /** The section it is built for, whose index keys its draws. */
  readonly index: number;
  readonly kind: ThemeKind;
  readonly key: Key;
  readonly harm: number;
  readonly entropy: number;
  /** The A theme in play, which a B vamp moves away from. */
  readonly a: Theme | null;
}

export function buildTheme({ seed, index, kind, key, harm, entropy, a }: ThemeEnv): Theme {
  let n = 0;
  const next = () => draw(seed, 'theme', index, n++);
  const { mode } = key;
  const bar = (degree: number): Slot[] => [{ step: 0, degree }];

  if (harm < VAMP_HARM) {
    const vamps = VAMPS[mode];
    let vamp = Math.floor(next() * vamps.length);
    if (kind !== 'A' && a?.mode === mode && a.vamp === vamp) vamp = (vamp + 1) % vamps.length;
    return { kind, index, mode, harm, vamp, bars: vampBars(vamps[vamp]!, harm) };
  }

  const table = TRANSITIONS[mode];
  let d = kind === 'B' ? (next() < 0.5 ? 5 : 3) : kind === 'build' ? 3 : 0;
  const byFifths = clamp01((harm - 0.4) * 1.6);
  const degrees = [d];
  for (let i = 1; i < 4; i++) {
    if (i === 3 && chance(next(), harm * (1 - entropy * 0.5))) d = CADENCE[mode];
    else if (chance(next(), byFifths)) {
      d = (d + 3) % 7;
      if (d === 6 && mode === 'ionian' && harm < 0.85) d = 4;
    } else {
      const weights = flattened(table[d] ?? { 0: 1 }, entropy);
      weights[d]! *= 0.2;
      d = pick(next(), weights);
    }
    if (d === degrees[i - 1]) d = (d + 3) % 7;
    degrees.push(d);
  }
  const first: Slot[][] = degrees.map(bar);

  // At the top of the harmony axis, a bar may lead into the next through its
  // secondary dominant on step 8, or the fourth bar become a ii–V.
  const split = clamp01((harm - 0.7) / 0.3) * 0.7;
  for (let b = 0; b < 4; b++) {
    const here = degrees[b]!;
    const target = b < 3 ? degrees[b + 1]! : 0;
    if (!chance(next(), split)) continue;
    if (b === 3 && here === 4) {
      first[b] = [
        { step: 0, degree: 1 },
        { step: 8, degree: 4 },
      ];
      continue;
    }
    const [root, , fifth] = triad(key, target);
    const diminished = fifth! - root! === 6;
    const alreadyItsDominant = wrap(root! + 7, 12) === wrap(heightOf(keyHelix(key), here), 12);
    if (target !== here && !diminished && !alreadyItsDominant)
      first[b] = [...first[b]!, { step: 8, dominantOf: target }];
  }

  const second = first.map((slots) => [...slots]);
  if (chance(next(), 0.25 + entropy * 0.5)) {
    const from = degrees[2]!;
    second[3] = bar(pick(next(), flattened(table[from] ?? { 0: 1 }, entropy)));
  }
  return { kind, index, mode, harm, vamp: null, bars: [...first, ...second] };
}
