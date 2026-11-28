/**
 * E48: the offer in every facet (#540, the owner's go of 2026-11-09: "more variation"). The planner alone, as a host
 * plans (its meter, rhythm, bass, lead and harmony repositories, a learned layer from empty), every preset held at its
 * point at entropy 0.3, 8 seeds of 32 sections. It counts, for each preset and member, the distinct fragments the
 * member plays over the run's sections: where every member takes the nearest, a preset opens with the same fragments
 * at every seed, and only the novelty ladder moves it on; where it draws among those as near as the nearest
 * (`OFFER`), the seeds open on different ones.
 */

import { NO_HISTORY } from '../src/history.ts';
import { EMPTY_LAYER } from '../src/layer.ts';
import { LEAD_REPOSITORY } from '../src/lead-lines.ts';
import { BASS_REPOSITORY } from '../src/bass-lines.ts';
import { presetMode } from '../src/mode-repository.ts';
import { type PlanCarried, type PlanEnv, planner } from '../src/plan.ts';
import { HARMONY_REPOSITORY } from '../src/progressions.ts';
import { METER_REPOSITORY } from '../src/repository.ts';
import { RHYTHM_REPOSITORY } from '../src/rhythms.ts';
import { PRESETS } from '../src/style.ts';

/** The seeds, the sections a run plans, and the entropy. */
export const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const SECTIONS = 32;
export const ENTROPY = 0.3;

/** The members whose fragments a run counts. */
export const MEMBERS = ['rhythm', 'bass', 'lead', 'harmony'] as const;
export type Member = (typeof MEMBERS)[number];

/** One preset's count: for each member, the distinct fragments it played over all seeds, and those it opened on. */
export interface OfferCount {
  readonly preset: string;
  /** Distinct fragments a member played over every section of every seed (variations the ladder made counted apart). */
  readonly played: Readonly<Record<Member, number>>;
  /** Distinct fragments a member opened a seed's first section on. */
  readonly opened: Readonly<Record<Member, number>>;
}

/** A section's fragment of each member, where it played one. */
const fragmentsOf = (
  plan: { readonly rhythmFragment?: string },
  carried: PlanCarried,
): Partial<Record<Member, string>> => ({
  ...(plan.rhythmFragment === undefined ? {} : { rhythm: plan.rhythmFragment }),
  ...(carried.bassFragment === null ? {} : { bass: carried.bassFragment }),
  ...(carried.leadFragment === null ? {} : { lead: carried.leadFragment }),
  ...(carried.progressionFragment === null ? {} : { harmony: carried.progressionFragment }),
});

/** E48 at one preset (see the module's comment). */
export function offerCount(preset: (typeof PRESETS)[number]): OfferCount {
  const played = Object.fromEntries(MEMBERS.map((m) => [m, new Set<string>()])) as Record<
    Member,
    Set<string>
  >;
  const opened = Object.fromEntries(MEMBERS.map((m) => [m, new Set<string>()])) as Record<
    Member,
    Set<string>
  >;
  const style = { ...preset.style, entropy: ENTROPY };
  for (const seed of SEEDS) {
    let carried: PlanCarried = planner.initial;
    for (let index = 0; index < SECTIONS; index++) {
      const env: PlanEnv = {
        seed,
        index,
        style,
        wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        history: NO_HISTORY,
        repository: METER_REPOSITORY,
        rhythms: RHYTHM_REPOSITORY,
        bassLines: BASS_REPOSITORY,
        leads: LEAD_REPOSITORY,
        harmonies: HARMONY_REPOSITORY,
        layer: EMPTY_LAYER,
      };
      const { output: plan, carried: next } = planner.advance(env, carried, null);
      carried = next;
      for (const [member, id] of Object.entries(fragmentsOf(plan, carried)) as [Member, string][]) {
        played[member].add(id);
        if (index === 0) opened[member].add(id);
      }
    }
  }
  const sizes = (sets: Record<Member, Set<string>>) =>
    Object.fromEntries(MEMBERS.map((m) => [m, sets[m].size])) as Record<Member, number>;
  return { preset: preset.name, played: sizes(played), opened: sizes(opened) };
}
