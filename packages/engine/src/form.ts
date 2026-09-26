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
import type { Style } from './style.ts';

export const SECTION_TYPES = ['intro', 'groove', 'bridge', 'build', 'drop', 'breakdown'] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const SECTION_BARS = 8;

export interface Section {
  readonly type: SectionType;
  /** Counted from the song's start. */
  readonly index: number;
}

export interface FormEnv {
  readonly seed: number;
  readonly index: number;
  /** The style where the section starts. */
  readonly style: Style;
}

/** Which kinds may follow each. */
const FOLLOWERS: Record<SectionType, readonly SectionType[]> = {
  intro: ['groove'],
  groove: ['groove', 'bridge', 'build'],
  bridge: ['groove', 'build', 'breakdown'],
  build: ['drop'],
  drop: ['drop', 'breakdown', 'groove'],
  breakdown: ['build', 'groove'],
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

/** The section chain. Section 0 is the intro; each later one follows the one before. */
export const form: Machine<FormEnv, Section | null, null, Section> = {
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

/** How far each kind of section moves the energy from the style's. */
const ENERGY_OFFSET: Record<SectionType, number> = {
  intro: -0.3,
  groove: 0,
  bridge: -0.1,
  build: 0,
  drop: 0.3,
  breakdown: -0.45,
};

/**
 * The energy a bar plays at: the style's energy shaped by its section, and
 * ramping up through a build from −0.15 to +0.30.
 */
export function barEnergy(energy: number, type: SectionType, barInSection: number): number {
  const offset =
    type === 'build' ? -0.15 + (0.45 * barInSection) / (SECTION_BARS - 1) : ENERGY_OFFSET[type];
  return Math.max(0, Math.min(1, energy + offset));
}
