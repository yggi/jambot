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
 * It carries the plan's state, the bar it decided, and what its parts carry.
 * The parts play side by side from the same bar: the drums, the bass and
 * the comp.
 */

import type { BarEnv } from './bar.ts';
import { type BarChord, barChords } from './chords.ts';
import { bass } from './bass.ts';
import { comp } from './comp.ts';
import { drums } from './drums.ts';
import type { NoteEvent } from './events.ts';
import { SECTION_BARS, barEnergy } from './form.ts';
import type { KeyWish } from './key.ts';
import type { Machine } from './machine.ts';
import { type Plan, type PlanCarried, planner } from './plan.ts';
import type { Style } from './style.ts';

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

/** What each part carries from bar to bar. The drums carry nothing. */
export interface PartsCarried {
  /** The bass's last note. */
  readonly bass: number;
  /** The comp's last voicing. */
  readonly comp: readonly number[] | null;
}

export interface BandCarried {
  /** The section plan's carried state: the latest section planned, and the themes. */
  readonly plans: PlanCarried;
  /** The bar the band plays next, decided. */
  readonly next: DecidedBar | null;
  readonly parts: PartsCarried;
}

/** One bar as the band plays it: everything its parts read, and the events they play. */
export interface BandBar extends BarEnv {
  readonly events: readonly NoteEvent[];
}

const INITIAL: BandCarried = {
  plans: planner.initial,
  next: null,
  parts: { bass: bass.initial, comp: comp.initial },
};

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
  return { here, carried: { ...carried, plans: after.plans, next: after.decided } };
}

/**
 * The band past a bar it doesn't play, as when the clock has passed it: the
 * plan and the chords move on as if it had played. The parts don't play it,
 * so they carry on from where they were: what they carry is register, and
 * it resumes from the last note heard.
 */
export function passBar(env: BandEnv, carried: BandCarried): BandCarried {
  return step(env, carried).carried;
}

export const band: Machine<BandEnv, BandCarried, null, BandBar> = {
  initial: INITIAL,
  advance(env, carried) {
    const { here, carried: after } = step(env, carried);
    const barInSection = env.bar % SECTION_BARS;
    const bar: BarEnv = {
      seed: env.seed,
      bar: env.bar,
      plan: here.plan,
      barInSection,
      style: env.style,
      barEnergy: barEnergy(env.style.energy, here.plan.section.type, barInSection),
      chords: here.chords,
      next: after.next!.chords,
    };
    const bassline = bass.advance(bar, carried.parts.bass, null);
    const comping = comp.advance(bar, carried.parts.comp, null);
    return {
      carried: { ...after, parts: { bass: bassline.carried, comp: comping.carried } },
      output: { ...bar, events: [...drums(bar), ...bassline.output, ...comping.output] },
    };
  },
};
