/**
 * The band: the machine at bar rate.
 *
 * It reads the seed, the bar, the style where the bar starts and the key the
 * players wish for. It reads the style as the score writes it, on a grid of
 * 3 decimals (`writtenStyle`, C7), so a bar states exactly the style it was
 * composed from. Each bar it plays one bar and decides the next: its
 * section's plan (form, key and theme), advanced when the bar starts a
 * section and held for its eight bars, and its chords. So a part can lead
 * into the next bar's chords, and what it leads into is what plays. A
 * section is planned, and a bar's chords coloured, from the style and the
 * wish where the bar before starts; bar 0 decides itself.
 *
 * It carries the plan's state, the bar it decided, the harmonic history of
 * the bars it decided (`history.ts`), which a section's plan reads to move
 * the key itself (#169), and what its parts carry.
 * The parts play side by side from the same bar: the drums, the bass, the
 * comp and the lead. What they write, the band plays through the
 * performance (`performer.ts`, T4).
 *
 * Since what it decides reads only the seed, the bar, the style and the
 * wish, the bars ahead can be decided before they play (`lookAhead`): as
 * long as nobody moves a control, the forecast is what plays.
 */

import type { BarEnv } from './bar.ts';
import { type BarChord, barChords } from './chords.ts';
import { bass } from './bass.ts';
import { comp } from './comp.ts';
import { type LeadCarried, lead } from './lead.ts';
import { drums } from './drums.ts';
import { cadence, finale } from './ending.ts';
import type { DoughNote, WrittenNote } from './events.ts';
import { SECTION_BARS, barEnergy } from './form.ts';
import { type HarmonicWeights, NO_HISTORY, foldBar } from './history.ts';
import type { KeyWish } from './key.ts';
import type { Machine } from './machine.ts';
import type { Offer } from './muse.ts';
import { perform } from './performer.ts';
import { type Plan, type PlanCarried, planner } from './plan.ts';
import { type Style, writtenStyle } from './style.ts';

export interface BandEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /** The key the players wish for, which a section boundary moves toward. */
  readonly wish: KeyWish;
  /** The motif the Muse offers, which the lead settles on (#79). */
  readonly offer: Offer | null;
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
  /** The lead's last note, its phrase and its themes' melodies. */
  readonly lead: LeadCarried;
}

export interface BandCarried {
  /** The section plan's carried state: the latest section planned, and the themes. */
  readonly plans: PlanCarried;
  /** The bar the band plays next, decided. */
  readonly next: DecidedBar | null;
  /** The harmonic history, up to and including the bar decided next. */
  readonly history: HarmonicWeights;
  readonly parts: PartsCarried;
}

/**
 * One bar as the band plays it: everything its parts read, the notes they
 * write, and each played by a performer, dough-shaped (#107, #129).
 */
export interface BandBar extends BarEnv {
  readonly written: readonly WrittenNote[];
  /** The written notes, each played by a performer. */
  readonly dough: readonly DoughNote[];
}

const INITIAL: BandCarried = {
  plans: planner.initial,
  next: null,
  history: NO_HISTORY,
  parts: { bass: bass.initial, comp: comp.initial, lead: lead.initial },
};

/**
 * Decide a bar from the style and wish where the bar composed now starts:
 * its plan, advanced at a section's first bar from the history so far, and
 * its chords, which the history then folds in.
 */
function decide(
  { seed, style, wish }: BandEnv,
  bar: number,
  plans: PlanCarried,
  history: HarmonicWeights,
): { plans: PlanCarried; decided: DecidedBar; history: HarmonicWeights } {
  const barInSection = bar % SECTION_BARS;
  const next =
    barInSection === 0
      ? planner.advance({ seed, index: bar / SECTION_BARS, style, wish, history }, plans, null)
          .carried
      : plans;
  const plan = next.before!;
  const { key, theme } = plan;
  const chords = barChords({ seed, barInSection, key, theme, harm: style.harm });
  return { plans: next, decided: { bar, plan, chords }, history: foldBar(history, chords) };
}

/** The environment as the band reads it: its style as the score writes it (C7). */
const read = (env: BandEnv): BandEnv => ({ ...env, style: writtenStyle(env.style) });

/** The bar to play now, and the carried state with the bar after it decided. */
function step(env: BandEnv, carried: BandCarried): { here: DecidedBar; carried: BandCarried } {
  let { plans, history } = carried;
  let here = carried.next;
  if (!here) {
    if (env.bar !== 0) throw new Error(`band: bar ${env.bar}, but the song starts at bar 0`);
    ({ plans, decided: here, history } = decide(env, 0, plans, history));
  } else if (here.bar !== env.bar)
    throw new Error(`band: bar ${env.bar}, but the band decided bar ${here.bar} next`);
  const after = decide(env, env.bar + 1, plans, history);
  return {
    here,
    carried: { ...carried, plans: after.plans, next: after.decided, history: after.history },
  };
}

/**
 * The band past a bar it doesn't play, as when the clock has passed it: the
 * plan and the chords move on as if it had played. The parts don't play it,
 * so they carry on from where they were: what they carry is register, and
 * it resumes from the last note heard.
 */
export function passBar(env: BandEnv, carried: BandCarried): BandCarried {
  return step(read(env), carried).carried;
}

/**
 * The next `count` bars as the band will decide them, from the bar it
 * decided next (bar 0 before the song starts): their plans and chords,
 * without the parts. It runs the band's own decisions forward, as passing
 * those bars does, reading the environment of each bar from `envAt`.
 */
export function lookAhead(
  carried: BandCarried,
  envAt: (bar: number) => BandEnv,
  count: number,
): DecidedBar[] {
  const bars: DecidedBar[] = [];
  for (let bar = carried.next?.bar ?? 0; bars.length < count; bar++) {
    const { here, carried: after } = step(read(envAt(bar)), carried);
    bars.push(here);
    carried = after;
  }
  return bars;
}

export const band: Machine<BandEnv, BandCarried, null, BandBar> = {
  initial: INITIAL,
  advance(given, carried) {
    const env = read(given);
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
      offer: env.offer,
    };
    const bassline = bass.advance(bar, carried.parts.bass, null);
    const comping = comp.advance(bar, carried.parts.comp, null);
    const melody = lead.advance(bar, carried.parts.lead, null);
    const parts = { bass: bassline.carried, comp: comping.carried, lead: melody.carried };
    const written = [...drums(bar), ...bassline.output, ...comping.output, ...melody.output];
    return { carried: { ...after, parts }, output: playBar(bar, written) };
  },
};

/**
 * The band's last bar: the one it plays instead of the next, which closes
 * the song on a cadence (`ending.ts`). It is decided as any bar is, so its
 * section and key are the plan's, and then its chords are the cadence in
 * that key. The band goes on from it as from any bar, its plan and history
 * moved on, so a forecast from the state it leaves still runs; the parts
 * carry what they did, as the song's end wrote nothing they lead from.
 */
export function finaleBar(
  given: BandEnv,
  carried: BandCarried,
): { carried: BandCarried; bar: BandBar } {
  const env = read(given);
  const { here, carried: after } = step(env, carried);
  const barInSection = env.bar % SECTION_BARS;
  const chords = cadence(here.plan.key);
  const bar: BarEnv = {
    seed: env.seed,
    bar: env.bar,
    plan: here.plan,
    barInSection,
    style: env.style,
    barEnergy: barEnergy(env.style.energy, here.plan.section.type, barInSection),
    chords,
    next: [chords[1]!],
    offer: env.offer,
  };
  return { carried: after, bar: playBar(bar, finale(bar, carried.parts)) };
}

/**
 * A bar's written notes as the band plays them: each through a performer.
 * It is where writing ends and playing starts, so a bar written elsewhere
 * (a host's) plays here exactly as the band that wrote it would play it.
 */
export function playBar(bar: BarEnv, written: readonly WrittenNote[]): BandBar {
  return { ...bar, written, dough: written.map((note) => perform(bar, note)) };
}
