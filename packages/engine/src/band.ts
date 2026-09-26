/**
 * The band: the machine at bar rate.
 *
 * It reads the seed, the bar, the style where the bar starts and the key the
 * players wish for. Each bar it plays one bar and decides the next: its
 * section's plan (form, key and theme), advanced when the bar starts a
 * section and held for its eight bars, and its chords. So a part can lead
 * into the next bar's chords, and what it leads into is what plays. A
 * section is planned, and a bar's chords coloured, from the style and the
 * wish where the bar before starts; bar 0 decides itself.
 *
 * It carries the plan's state and the bar it decided. Its parts play side by
 * side from the same bar; for now, that is the drums.
 */

import type { BarEnv } from './bar.ts';
import { type BarChord, barChords } from './chords.ts';
import { drums } from './drums.ts';
import type { NoteEvent } from './events.ts';
import { SECTION_BARS, type Section, barEnergy } from './form.ts';
import type { Key, KeyWish } from './key.ts';
import type { Machine } from './machine.ts';
import { type Plan, type PlanCarried, planner } from './plan.ts';
import type { Style } from './style.ts';
import type { Theme } from './themes.ts';

export interface BandEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /** The key the players wish for, which a section boundary moves toward. */
  readonly wish: KeyWish;
}

/** A bar as decided the bar before: its section's plan and its chords. */
export interface DecidedBar {
  readonly bar: number;
  readonly plan: Plan;
  readonly chords: readonly BarChord[];
}

export interface BandCarried {
  /** The section plan's carried state: the latest section planned, and the themes. */
  readonly plans: PlanCarried;
  /** The bar the band plays next, decided. */
  readonly next: DecidedBar | null;
}

/** One bar as the band plays it: where it stands in the form, its harmony and its events. */
export interface BandBar {
  readonly bar: number;
  readonly section: Section;
  readonly key: Key;
  readonly theme: Theme;
  /** The bar's chords, from its theme's slots. */
  readonly chords: readonly BarChord[];
  readonly barInSection: number;
  readonly barEnergy: number;
  readonly events: readonly NoteEvent[];
}

const INITIAL: BandCarried = { plans: planner.initial, next: null };

/**
 * Decide a bar from the style and wish where the bar composed now starts:
 * its plan, advanced at a section's first bar, and its chords.
 */
function decide(
  { seed, style, wish }: BandEnv,
  bar: number,
  plans: PlanCarried,
): { plans: PlanCarried; decided: DecidedBar } {
  const barInSection = bar % SECTION_BARS;
  const next =
    barInSection === 0
      ? planner.advance({ seed, index: bar / SECTION_BARS, style, wish }, plans, null).carried
      : plans;
  const plan = next.before!;
  const { key, theme } = plan;
  const chords = barChords({ seed, barInSection, key, theme, harm: style.harm });
  return { plans: next, decided: { bar, plan, chords } };
}

/** The bar to play now, and the carried state with the bar after it decided. */
function step(env: BandEnv, carried: BandCarried): { here: DecidedBar; carried: BandCarried } {
  let { plans } = carried;
  let here = carried.next;
  if (!here) {
    if (env.bar !== 0) throw new Error(`band: bar ${env.bar}, but the song starts at bar 0`);
    ({ plans, decided: here } = decide(env, 0, plans));
  } else if (here.bar !== env.bar)
    throw new Error(`band: bar ${env.bar}, but the band decided bar ${here.bar} next`);
  const after = decide(env, env.bar + 1, plans);
  return { here, carried: { plans: after.plans, next: after.decided } };
}

/**
 * The band past a bar it doesn't play, as when the clock has passed it: the
 * plan and the chords move on as if it had played.
 */
export function passBar(env: BandEnv, carried: BandCarried): BandCarried {
  return step(env, carried).carried;
}

export const band: Machine<BandEnv, BandCarried, null, BandBar> = {
  initial: INITIAL,
  advance(env, carried) {
    const { here, carried: after } = step(env, carried);
    const { section, key, theme } = here.plan;
    const barInSection = env.bar % SECTION_BARS;
    const bar: BarEnv = {
      seed: env.seed,
      bar: env.bar,
      plan: here.plan,
      barInSection,
      style: env.style,
      barEnergy: barEnergy(env.style.energy, section.type, barInSection),
      chords: here.chords,
      next: after.next!.chords,
    };
    return {
      carried: after,
      output: {
        bar: env.bar,
        section,
        key,
        theme,
        chords: here.chords,
        barInSection,
        barEnergy: bar.barEnergy,
        events: drums(bar),
      },
    };
  },
};
