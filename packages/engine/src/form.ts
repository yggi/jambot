/**
 * Form: which section follows which.
 *
 * A song is a chain of sections, eight bars each. Which section comes next
 * is a Markov chain over six kinds, weighted by the style's energy and
 * entropy: high energy builds and drops, low entropy stays in the groove.
 * An intro always leads into a groove, and a build always drops.
 *
 * The chain is a machine at section rate: it reads the seed, the section's
 * index and the style where the section starts, and carries the section
 * before. The band holds its output for the section's eight bars.
 */

import type { Machine } from './machine.ts';
import { draw, pick } from './random.ts';
import { kindOffset, songFormAt, songSections } from './section-kinds.ts';
import type { Style } from './style.ts';

/** The chain's six, then the three a song form adds (yggi/cells#814): a verse, a chorus and an outro. */
export const SECTION_TYPES = [
  'intro',
  'groove',
  'bridge',
  'build',
  'drop',
  'breakdown',
  'verse',
  'chorus',
  'outro',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_BARS = 8;

export interface Section {
  readonly type: SectionType;
  /** Counted from the session's first section. */
  readonly index: number;
  /** The song form it is a section of (#655), where the style found one: the form's id, which of its sections, of how many. */
  readonly song?: SongAt;
}

/** Where a section stands in its song form. */
export interface SongAt {
  readonly form: string;
  readonly at: number;
  readonly of: number;
}

export interface FormEnv {
  readonly seed: number;
  readonly index: number;
  /** The style where the section starts. */
  readonly style: Style;
  /**
   * The song form a song starting here is played on, where the station chose one (`rotation.ts`, #547 rung 5): a form
   * by id, or null for the chain. With none, the form cells finds at the style. Read only where a song starts.
   */
  readonly form?: string | null;
}

/** Which kinds may follow each. */
const FOLLOWERS: Record<SectionType, readonly SectionType[]> = {
  intro: ['groove'],
  groove: ['groove', 'bridge', 'build'],
  bridge: ['groove', 'build', 'breakdown'],
  build: ['drop'],
  drop: ['drop', 'breakdown', 'groove'],
  breakdown: ['build', 'groove'],
  // (a song form's own kinds, which the chain never chooses: where a song ends in one and no form is found, it goes on)
  verse: ['groove', 'bridge', 'build'],
  chorus: ['groove', 'bridge', 'build'],
  outro: ['intro'],
};

/** How strongly each kind is wanted next, by energy and entropy. An intro only starts a song. */
const appeal = (type: SectionType, energy: number, entropy: number): number => {
  switch (type) {
    case 'intro':
      return 0;
    case 'groove':
      return 0.3 * (1 - entropy) + 0.05;
    case 'bridge':
      return 0.35 + 0.2 * entropy;
    case 'build':
      return 0.1 + 0.45 * energy;
    case 'drop':
      return 0.3 * energy;
    case 'breakdown':
      return 0.35 - 0.15 * energy;
    case 'verse':
    case 'chorus':
    case 'outro':
      return 0;
  }
};

/**
 * The kinds that may follow a section, each with its weight. Where there are
 * several, the weights never all vanish.
 */
export function followers(
  type: SectionType,
  energy: number,
  entropy: number,
): [SectionType, number][] {
  return FOLLOWERS[type].map((next) => [next, appeal(next, energy, entropy)]);
}

/**
 * The section chain, the generator on a miss (#655): section 0 is the intro, and each later one follows the one before,
 * weighted by energy and entropy. It never chooses a song form's own kinds; where the section before is one, it goes on
 * from it as `FOLLOWERS` says.
 */
export const chain: Machine<FormEnv, Section | null, null, Section> = {
  initial: null,
  advance({ seed, index, style }, before) {
    let type: SectionType = 'intro';
    if (index > 0) {
      // A kind with one follower goes there whatever its weight: a build
      // drops even at no energy.
      const options = followers(before?.type ?? 'intro', style.energy, style.entropy);
      const weights = options.length === 1 ? [1] : options.map(([, w]) => w);
      type = options[pick(draw(seed, 'form', index), weights)]![0];
    }
    const section = { type, index };
    return { carried: section, output: section };
  },
};

/**
 * The sections, a song at a time (#655): a song plays the song form cells finds at the style where it starts, its
 * sections in order (`songFormAt`, the facet `song`, yggi/cells#815), and the next song starts where it ends, at a
 * section boundary, the form asked for again. Where no form lies within the composer's reach, the chain plays.
 */
export const form: Machine<FormEnv, Section | null, null, Section> = {
  initial: null,
  advance(env, before) {
    const song = before?.song;
    if (song && song.at + 1 < song.of) {
      const next = { ...song, at: song.at + 1 };
      const section = { type: songSections(song.form)[next.at]!, index: env.index, song: next };
      return { carried: section, output: section };
    }
    const found = env.form === undefined ? songFormAt(env.style) : env.form;
    if (!found) return chain.advance(env, before, null);
    const sections = songSections(found);
    const section = {
      type: sections[0]!,
      index: env.index,
      song: { form: found, at: 0, of: sections.length },
    };
    return { carried: section, output: section };
  },
};

/**
 * How far a section moves a bar's energy from its style's: its kind's offset, a build ramping from −0.15 to +0.30 over
 * its bars, as cells' section fragments say it (`section-kinds.ts`, #655). A section text writes it as cells' sum of
 * the song's and the kind's (yggi/cells decision 096).
 */
export const energyOffset = (type: SectionType, barInSection: number): number =>
  kindOffset(type, barInSection);

/**
 * The energy a bar plays at: the style's energy shaped by its section, and
 * ramping up through a build from −0.15 to +0.30.
 */
export function barEnergy(energy: number, type: SectionType, barInSection: number): number {
  return Math.max(0, Math.min(1, energy + energyOffset(type, barInSection)));
}
