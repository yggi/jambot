/**
 * E43: the harmony enters the loop (#425; the loop of `facet.ts` for the
 * facet `harmony`, cells' five seed vamps, yggi/cells#219).
 *
 * E37's walks (`rhythm-radio.ts`), the radio tuned in at each preset at
 * entropy 0.3, the band learning from an empty layer with cells' rhythms,
 * bass lines and harmonies, and a player (`PLAYER`) who plays a progression
 * over one section in four, the third of each four, a chord a bar, one of
 * `PROGRESSIONS`, a new one every 16 sections: the Muse files the player's
 * progression a section after its own ends, and the composer asks for each
 * theme it builds. It counts the share of sections the run's most used theme
 * plays (`mostUsedTheme`: a progression by its id, a theme the tables wrote
 * by the kind and section it was built for), the progressions filed, the
 * share of sections among a run's 3 most used themes against the same walks
 * with nothing learned (lock-in, `lockIn`), and what an ask costs.
 *
 * It runs under vitest: `E43_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/harmony-loop.test.ts` prints the numbers.
 */

import {
  HARMONY_REPOSITORY,
  type HarmonySlot,
  type LearnedLayer,
  PRESETS,
  VAMP_HARM,
  composedHarmony,
} from '../src/index.ts';
import { LINE_BENCHES } from '../src/bass-lines.ts';
import type { HarmonyPlayer } from './rhythm-radio.ts';

/** A progression of a chord a bar, four bars twice, as a theme's slots. */
const progression = (degrees: readonly number[]): HarmonySlot[][] =>
  [...degrees, ...degrees].map((degree) => [{ step: 0, degree }]);

/** The player's progressions: eight of four chords, each a shape a hand plays (I V vi IV and its kin, as degrees). */
export const PROGRESSIONS: readonly (readonly HarmonySlot[][])[] = [
  progression([0, 4, 5, 3]),
  progression([0, 5, 3, 4]),
  progression([5, 3, 0, 4]),
  progression([0, 3, 4, 0]),
  progression([1, 4, 0, 0]),
  progression([0, 6, 5, 6]),
  progression([0, 2, 5, 3]),
  progression([0, 3, 0, 4]),
];

/** The player: one section in four (the third of each four), the progression turning every 16 sections, by the run's seed. */
export const PLAYS: HarmonyPlayer = {
  repository: HARMONY_REPOSITORY,
  plays: (seed, section) =>
    section % 4 === 2
      ? PROGRESSIONS[(seed + Math.floor(section / 16)) % PROGRESSIONS.length]!
      : null,
};

/** The sections a run's most used theme plays, pooled over the runs, and its share of all. */
export function mostUsedTheme(runs: readonly { readonly themes: readonly string[] }[]): {
  readonly sections: number;
  readonly mostUsed: number;
  readonly share: number;
  readonly fromRepository: number;
} {
  let sections = 0;
  let mostUsed = 0;
  let fromRepository = 0;
  const tables = /^(A|B|build) \d+$/;
  for (const { themes } of runs) {
    const counts = new Map<string, number>();
    for (const id of themes) counts.set(id, (counts.get(id) ?? 0) + 1);
    sections += themes.length;
    mostUsed += Math.max(0, ...counts.values());
    fromRepository += themes.filter((id) => !tables.test(id)).length;
  }
  return { sections, mostUsed, share: mostUsed / sections, fromRepository };
}

/** Lock-in on the themes (cells decision 048, as `lockIn` measures it for rhythms): the runs with their themes as their rhythms. */
export const asThemes = <R extends { readonly themes: readonly string[] }>(runs: readonly R[]) =>
  runs.map((r) => ({ ...r, kept: r.themes }));

/** A layer's progressions, by source where one is given. */
export const progressionsFiled = (layer: LearnedLayer, source?: string) =>
  layer.filed.filter(
    (f) =>
      f.fragment.association.some((p) => p.facet === 'harmony') &&
      (source === undefined || f.meta['source'] === source),
  );

/** What an ask for a theme costs with a layer, at each preset and near it, on every bench, in ms on this machine. */
export function cost(layer: LearnedLayer) {
  const now = () => performance.now();
  // (warmed first, as the app warms it)
  const warming = HARMONY_REPOSITORY.warm!(LINE_BENCHES, layer)[Symbol.iterator]();
  while (!warming.next().done);
  const asks: number[] = [];
  for (const preset of PRESETS)
    for (const bench of LINE_BENCHES)
      for (let k = 0; k < 4; k++) {
        const style = { ...preset.style, sync: preset.style.sync + k / 100, entropy: 0.3 };
        const at = now();
        composedHarmony(HARMONY_REPOSITORY, style, bench, {
          at: { kind: 'B', index: 1, mode: 'aeolian', harm: Math.min(style.harm, VAMP_HARM) },
          draw: k / 4,
          a: 'tonic vamp',
          chosen: ['tonic vamp'],
          layer,
          pull: 0.1,
        });
        asks.push(now() - at);
      }
  const sorted = asks.toSorted((a, b) => a - b);
  return {
    progressions: progressionsFiled(layer).length,
    askP95: sorted[Math.floor(asks.length * 0.95)]!,
    longestAsk: Math.max(...asks),
  };
}
