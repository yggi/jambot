/**
 * The band: the machine at bar rate.
 *
 * It reads the seed, the bar and the style where the bar starts. At each
 * section boundary it advances the form and then holds that section for the
 * section's eight bars, so the section is all it carries: the form's "section
 * before" is the band's "section now" one boundary later. Each bar, its parts
 * play side by side; for now, that is the drums.
 */

import type { BarEnv } from './bar.ts';
import { drums } from './drums.ts';
import type { NoteEvent } from './events.ts';
import { SECTION_BARS, type Section, barEnergy, form } from './form.ts';
import type { Machine } from './machine.ts';
import type { Style } from './style.ts';

export interface BandEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The style where the bar starts. */
  readonly style: Style;
}

/** One bar as the band plays it: where it stands in the form, and its events. */
export interface BandBar {
  readonly bar: number;
  readonly section: Section;
  readonly barInSection: number;
  readonly barEnergy: number;
  readonly events: readonly NoteEvent[];
}

export const band: Machine<BandEnv, Section | null, null, BandBar> = {
  initial: null,
  advance({ seed, bar, style }, held) {
    const index = Math.floor(bar / SECTION_BARS);
    const barInSection = bar % SECTION_BARS;
    const current = held?.index ?? -1;
    let section: Section;
    if (barInSection === 0) {
      if (index !== current + 1)
        throw new Error(
          `band: bar ${bar} starts section ${index}, but the band is in section ${current}`,
        );
      section = form.advance({ seed, index, style }, held, null).output;
    } else {
      if (!held || index !== current)
        throw new Error(
          `band: bar ${bar} is inside section ${index}, but the band is in section ${held ? current : 'none'}`,
        );
      section = held;
    }
    const env: BarEnv = {
      seed,
      bar,
      section,
      barInSection,
      style,
      barEnergy: barEnergy(style.energy, section.type, barInSection),
    };
    return {
      carried: section,
      output: { bar, section, barInSection, barEnergy: env.barEnergy, events: drums(env) },
    };
  },
};
