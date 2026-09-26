/**
 * The band: the machine at bar rate.
 *
 * It reads the seed, the bar, the style where the bar starts and the key the
 * players wish for. At each section boundary it advances the section plan
 * (form, key and theme) and then holds that plan for the section's eight
 * bars, so the plan's carried state is all it carries: the plan's "section
 * before" is the band's "section now" one boundary later. Each bar, its parts
 * play side by side; for now, that is the drums.
 */

import type { BarEnv } from './bar.ts';
import { drums } from './drums.ts';
import type { NoteEvent } from './events.ts';
import { SECTION_BARS, type Section, barEnergy } from './form.ts';
import type { Key, KeyWish } from './key.ts';
import type { Machine } from './machine.ts';
import { type PlanCarried, planner } from './plan.ts';
import type { Style } from './style.ts';
import type { Slot } from './themes.ts';

export interface BandEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /** The key the players wish for, which a section boundary moves toward. */
  readonly wish: KeyWish;
}

/** One bar as the band plays it: where it stands in the form, its harmony and its events. */
export interface BandBar {
  readonly bar: number;
  readonly section: Section;
  readonly key: Key;
  /** The theme's chord slots for this bar. */
  readonly slots: readonly Slot[];
  readonly barInSection: number;
  readonly barEnergy: number;
  readonly events: readonly NoteEvent[];
}

export const band: Machine<BandEnv, PlanCarried, null, BandBar> = {
  initial: planner.initial,
  advance({ seed, bar, style, wish }, carried) {
    const index = Math.floor(bar / SECTION_BARS);
    const barInSection = bar % SECTION_BARS;
    const held = carried.before;
    const current = held?.section.index ?? -1;
    let planned = carried;
    if (barInSection === 0) {
      if (index !== current + 1)
        throw new Error(
          `band: bar ${bar} starts section ${index}, but the band is in section ${current}`,
        );
      planned = planner.advance({ seed, index, style, wish }, carried, null).carried;
    } else if (!held || index !== current)
      throw new Error(
        `band: bar ${bar} is inside section ${index}, but the band is in section ${held ? current : 'none'}`,
      );
    const { section, key, theme } = planned.before!;
    const env: BarEnv = {
      seed,
      bar,
      section,
      barInSection,
      style,
      barEnergy: barEnergy(style.energy, section.type, barInSection),
    };
    return {
      carried: planned,
      output: {
        bar,
        section,
        key,
        slots: theme.bars[barInSection]!,
        barInSection,
        barEnergy: env.barEnergy,
        events: drums(env),
      },
    };
  },
};
