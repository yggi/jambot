/**
 * The section plan: the machine at section rate.
 *
 * At each section boundary it reads the seed, the section's index, the style
 * where the section starts, and the key the players wish for. It advances
 * the form, moves the key one step toward the wish (`nextKey`), picks the
 * melodic scale the lead walks (the wish's where the style reaches it, else
 * the style's default, #209), and picks the section's theme. The band holds
 * the plan for the section's eight bars, so a new key, scale or theme
 * arrives only at a boundary.
 *
 * Where the players wish for no tonic and the mode playing, the band may move
 * the key itself (#169): the harmony's reach (`harmonicReach`) gives how far,
 * the entropy how readily, and its harmonic history (`history.ts`) where to,
 * leaning toward the key the history weighs most. It returns the same way:
 * after a move the key it left still weighs most, so it leans back.
 *
 * Themes return: an A theme for the grooves and drops, a B theme for the
 * contrast. A returning theme is built anew when the mode has changed, when
 * the harmony has moved more than 0.2 from the one it was built for, or at
 * random, the more often the higher the entropy (at most three times in
 * ten). A build is always built afresh.
 */

import { fifthsIndex, mod } from '@jambot/theory';
import { type Section, form } from './form.ts';
import { type HarmonicWeights, keyWeight } from './history.ts';
import { INITIAL_KEY, type Key, type KeyWish, type MelodicScale, nextKey } from './key.ts';
import { harmonicReach, licenceOf, melodicDefault } from './licence.ts';
import type { Machine } from './machine.ts';
import { chance, draw, pick } from './random.ts';
import type { Style } from './style.ts';
import { type Theme, buildTheme, themeKind } from './themes.ts';

export interface PlanEnv {
  readonly seed: number;
  readonly index: number;
  /** The style where the section starts. */
  readonly style: Style;
  /** The key the players wish for: a mode, and a tonic or none; and a melodic scale or none. */
  readonly wish: KeyWish;
  /** What the band's harmony has sounded lately, which its own moves lean toward. */
  readonly history: HarmonicWeights;
}

/** What a section plays: where it stands in the form, its key, the lead's melodic scale over it, and its theme. */
export interface Plan {
  readonly section: Section;
  readonly key: Key;
  readonly melodic: MelodicScale;
  readonly theme: Theme;
}

export interface PlanCarried {
  /** The plan of the section before. */
  readonly before: Plan | null;
  /** The themes that return. */
  readonly themes: { readonly A: Theme | null; readonly B: Theme | null };
}

/** How far the harmony may move from a returning theme's before it is built anew. */
export const THEME_REACH = 0.2;

/** How likely the band is to move the key itself at a section boundary, at entropy 1. */
export const KEY_JUMP = 0.6;

/**
 * How sharply the band leans toward the key its history weighs most: each
 * candidate is picked in proportion to its weight to this power.
 */
const LEAN = 4;

/**
 * Where the band would move the key itself from `key` at section `index`, or
 * null to stay: with a chance of `KEY_JUMP` times the entropy, to a key in
 * the same mode within the harmony's reach, each picked by how much its scale
 * weighs in the history.
 */
export function bandWish(
  { seed, index, style, history }: Pick<PlanEnv, 'seed' | 'index' | 'style' | 'history'>,
  key: Key,
): Pick<KeyWish, 'tonic' | 'mode'> | null {
  const reach = harmonicReach(style);
  if (reach === 0 || !chance(draw(seed, 'keyJump', index), style.entropy * KEY_JUMP)) return null;
  // In one mode, keys lie as many fifths apart as their tonics do on the wheel.
  const home = fifthsIndex(key.tonic);
  const candidates = [...Array(12).keys()]
    .filter((tonic) => {
      const apart = Math.abs(mod(fifthsIndex(tonic) - home + 6, 12) - 6);
      return apart > 0 && apart <= reach;
    })
    .map((tonic) => ({ tonic, mode: key.mode }));
  const weights = candidates.map((c) => keyWeight(history, c));
  const most = Math.max(...weights);
  const leaning = most > 0 ? weights.map((w) => (w / most) ** LEAN) : weights.map(() => 1);
  return candidates[pick(draw(seed, 'keyJump', index, 1), leaning)]!;
}

export const planner: Machine<PlanEnv, PlanCarried, null, Plan> = {
  initial: { before: null, themes: { A: null, B: null } },
  advance(env, { before, themes }) {
    const { seed, index, style, wish } = env;
    const section = form.advance({ seed, index, style }, before?.section ?? null, null).output;
    const from = before?.key ?? INITIAL_KEY;
    // The players' wish wins: a tonic, or a mode other than the one playing.
    const own =
      before && wish.tonic === null && wish.mode === from.mode ? bandWish(env, from) : null;
    const key = nextKey(from, own ?? wish);
    const melodic =
      wish.melodic !== null && licenceOf(style).melodic.includes(wish.melodic)
        ? wish.melodic
        : melodicDefault(style);
    const kind = themeKind(section.type);
    const held = kind === 'build' ? null : themes[kind];
    const theme =
      held &&
      held.mode === key.mode &&
      Math.abs(held.harm - style.harm) <= THEME_REACH &&
      !chance(draw(seed, 'themeRenewal', index), style.entropy * 0.3)
        ? held
        : buildTheme({
            seed,
            index,
            kind,
            key,
            harm: style.harm,
            entropy: style.entropy,
            a: themes.A,
          });
    const plan = { section, key, melodic, theme };
    return {
      carried: { before: plan, themes: kind === 'build' ? themes : { ...themes, [kind]: theme } },
      output: plan,
    };
  },
};
