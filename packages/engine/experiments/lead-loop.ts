/**
 * E42: the lead enters the loop (#424; the loop of `facet.ts` for the facet
 * `lead`, cells' motifs its seeds since #520, and the lines the layer
 * filed).
 *
 * E37's walks (`rhythm-radio.ts`), the radio tuned in at each preset at
 * entropy 0.3, the band learning from an empty layer with cells' rhythms and
 * bass lines and the lead lines, and a player (`PLAYER`) who answers one
 * section in four, in its second half, with a motif of `MOTIFS`, a new one
 * every four of those: the Muse files the player's line, and the lead's own
 * of that section where it played its own (the phrase the player answered;
 * seldom, since it plays a motif of cells' nearly everywhere),
 * and the composer plays, varies and rejects them as it does a bass line.
 * It counts the share of sections the run's most used lead line plays
 * (`mostUsedLead`: of the sections that play one, and of all, the lead's own
 * counting as one), the lines filed by source, the share of sections among a
 * run's 3 most used lead lines against the same walks with nothing learned
 * (lock-in, `lockIn`), the layer's weight over three hours with the drums,
 * the bass and the lead filing, and what an ask and a warm step cost.
 *
 * It runs under vitest: `E42_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/lead-loop.test.ts` prints the numbers.
 */

import { type LeadNote, type LearnedLayer, PROTOTYPE_PRESETS } from '../src/index.ts';
import { LEAD_REPOSITORY } from '../src/lead-lines.ts';
import { LINE_BENCHES } from '../src/bass-lines.ts';
import type { LeadPlayer } from './rhythm-radio.ts';

/** A motif as a lead line: its steps, and its degrees from the first note, none off the key. */
const line = (steps: readonly number[], degrees: readonly number[]): LeadNote[] =>
  steps.map((step, i) => ({ step, degree: degrees[i]!, alter: 0 }));

/** The player's motifs: eight bars of 4/4, from three notes to six, each a shape a hand plays. */
export const MOTIFS: readonly (readonly LeadNote[])[] = [
  line([0, 4, 8], [0, 2, 4]),
  line([0, 3, 6, 8], [0, 1, 2, -1]),
  line([0, 2, 4, 8, 12], [0, 2, 1, 4, 3]),
  line([0, 6, 8, 14], [0, -2, -1, 0]),
  line([2, 4, 6, 10], [0, 1, 0, -3]),
  line([0, 4, 6, 8, 10, 12], [0, 1, 2, 3, 4, 2]),
  line([0, 8, 10], [0, 4, 3]),
  line([0, 3, 4, 7, 12], [0, 0, 2, 2, 1]),
];

/** The player: one section in four (the second of each four), the motif turning every four of those, by the run's seed. */
export const PLAYS: LeadPlayer = {
  repository: LEAD_REPOSITORY,
  plays: (seed, section) =>
    section % 4 === 1 ? MOTIFS[(seed + Math.floor(section / 16)) % MOTIFS.length]! : null,
};

/** The sections a run's most used lead line plays, pooled over the runs, and its share: of the sections that play one, and of all, the lead's own (`-`) counting as one. */
export function mostUsedLead(runs: readonly { readonly leads: readonly string[] }[]): {
  readonly sections: number;
  readonly playing: number;
  readonly mostUsed: number;
  readonly share: number;
  readonly mostUsedOfAll: number;
  readonly shareOfAll: number;
} {
  let sections = 0;
  let playing = 0;
  let mostUsed = 0;
  let mostUsedOfAll = 0;
  for (const { leads } of runs) {
    const counts = new Map<string, number>();
    for (const id of leads) counts.set(id, (counts.get(id) ?? 0) + 1);
    sections += leads.length;
    playing += leads.filter((id) => id !== '-').length;
    mostUsed += Math.max(0, ...[...counts].filter(([id]) => id !== '-').map(([, n]) => n));
    mostUsedOfAll += Math.max(0, ...counts.values());
  }
  return {
    sections,
    playing,
    mostUsed,
    share: mostUsed / playing,
    mostUsedOfAll,
    shareOfAll: mostUsedOfAll / sections,
  };
}

/** Lock-in on the lead lines (cells decision 048, as `lockIn` measures it for rhythms): the runs with their lead lines as their rhythms. */
export const asLeads = <R extends { readonly leads: readonly string[] }>(runs: readonly R[]) =>
  runs.map((r) => ({ ...r, kept: r.leads }));

/** A layer's lead lines, by source where one is given. */
export const leadsFiled = (layer: LearnedLayer, source?: string) =>
  layer.filed.filter(
    (f) =>
      f.fragment.association.some((p) => p.facet === 'lead') &&
      (source === undefined || f.meta['source'] === source),
  );

/** What an ask of the lead lines costs with a layer, and each warm step over its lines, in ms on this machine. */
export function cost(layer: LearnedLayer) {
  const now = () => performance.now();
  const steps: number[] = [];
  const it = LEAD_REPOSITORY.warm!(LINE_BENCHES, layer)[Symbol.iterator]();
  for (let at = now(); !it.next().done; at = now()) steps.push(now() - at);
  const asks: number[] = [];
  for (const preset of PROTOTYPE_PRESETS)
    for (const bench of LINE_BENCHES)
      for (let k = 0; k < 4; k++) {
        const at = now();
        LEAD_REPOSITORY.query({ ...preset.style, sync: preset.style.sync + k / 100 }, bench, layer);
        asks.push(now() - at);
      }
  const sorted = asks.toSorted((a, b) => a - b);
  return {
    lines: leadsFiled(layer).length,
    steps: steps.length,
    longestStep: Math.max(0, ...steps),
    askP95: sorted[Math.floor(asks.length * 0.95)]!,
    longestAsk: Math.max(...asks),
  };
}
