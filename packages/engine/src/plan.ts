/**
 * The section plan: the machine at section rate.
 *
 * At each section boundary it reads the seed, the section's index, the style
 * where the section starts, and the key the players wish for. It advances
 * the form, moves the key one step toward the wish (`nextKey`), and picks
 * the section's theme. The band holds the plan for the section's eight bars,
 * so a new key or theme arrives only at a boundary.
 *
 * Themes return: an A theme for the grooves and drops, a B theme for the
 * contrast. A returning theme is built anew when the mode has changed, when
 * the harmony has moved more than 0.2 from the one it was built for, or at
 * random, the more often the higher the entropy (at most three times in
 * ten). A build is always built afresh.
 */

import { type Section, form } from './form.ts';
import { INITIAL_KEY, type Key, type KeyWish, nextKey } from './key.ts';
import type { Machine } from './machine.ts';
import { chance, draw } from './random.ts';
import type { Style } from './style.ts';
import { type Theme, buildTheme, themeKind } from './themes.ts';

export interface PlanEnv {
  readonly seed: number;
  readonly index: number;
  /** The style where the section starts. */
  readonly style: Style;
  /** The key the players wish for: a mode, and a tonic or none. */
  readonly wish: KeyWish;
}

/** What a section plays: where it stands in the form, its key and its theme. */
export interface Plan {
  readonly section: Section;
  readonly key: Key;
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

export const planner: Machine<PlanEnv, PlanCarried, null, Plan> = {
  initial: { before: null, themes: { A: null, B: null } },
  advance({ seed, index, style, wish }, { before, themes }) {
    const section = form.advance({ seed, index, style }, before?.section ?? null, null).output;
    const key = nextKey(before?.key ?? INITIAL_KEY, wish);
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
    const plan = { section, key, theme };
    return {
      carried: { before: plan, themes: kind === 'build' ? themes : { ...themes, [kind]: theme } },
      output: plan,
    };
  },
};
