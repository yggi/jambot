/**
 * E41: the bass enters the loop (#423; the loop of `facet.ts` for the facet
 * `bass`, cells' five bass seeds).
 *
 * **Held** (`heldBass`): each preset held at entropy `entropy`, its meter's
 * swing, cells' meters and rhythms and an empty learned layer, as `main`
 * plays a held preset (`layer.test.ts`), for `bars` bars a seed, with and
 * without cells' bass lines. It says which line each section plays, and how
 * far the bass moves from `main`'s, by section type: its notes a bar, and the
 * share of its notes on each interval above the chord in force's root
 * (`intervalShares`), set apart by total variation (`distanceOf`: half the
 * sum of the shares' differences, 0 the same, 1 nothing shared). It keeps
 * the drums' notes too, which must not move.
 *
 * **Walked** (`walkedBass`): E38's walks (`rhythm-radio.ts`), the radio
 * tuned in at each preset at entropy 0.3 for `hours` of music, the band
 * learning from an empty layer, now with the bass lines too: the share of
 * sections the run's most used bass line plays (`mostUsedLine`), the lines
 * the Muse and the composer filed, the layer's weight, the share of sections
 * among a run's 3 most used lines against the same walks with nothing
 * learned (lock-in), and what the drums did beside it (E39's most used
 * groove, `mostUsedGroove`).
 *
 * It runs under vitest: `E41_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/bass-loop.test.ts` prints the numbers.
 */

import { wrap } from '@jambot/theory';
import {
  presetMode,
  BASS_REPOSITORY,
  type BandBar,
  type BandCarried,
  type BandEnv,
  EMPTY_LAYER,
  type LearnedLayer,
  type LineRepository,
  METER_REPOSITORY,
  PRESETS,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  band,
  chordAt,
  chordsOn,
  presetSwing,
} from '../src/index.ts';
import type { SectionType } from '../src/form.ts';

/** The bass's notes by section type: bars, notes, and notes on each interval above the chord's root. */
export interface BassCounts {
  readonly bars: number;
  readonly notes: number;
  readonly intervals: readonly number[];
}

/** One preset held: the line each section played, the bass by section type, and the drums' notes, bar by bar. */
export interface HeldBass {
  readonly preset: string;
  readonly seed: number;
  readonly lines: readonly string[];
  readonly bass: Readonly<Partial<Record<SectionType, BassCounts>>>;
  readonly drums: readonly string[];
  /** The bass's notes, each its bar, step and pitch (`bar:step:note`). */
  readonly notes: readonly string[];
}

/** A bar's notes of one part, as a line each: step, note, velocity and length. */
const notesOf = (bar: BandBar, part: string) =>
  bar.dough
    .filter((n) => n.part === part)
    .map((n) => `${bar.bar} ${n.step} ${n.note} ${n.velocity} ${n.length}`);

/** A preset held for `bars` bars at `entropy`, with cells' bass lines where `lines` is given. */
export function heldBass(
  preset: (typeof PRESETS)[number],
  seed: number,
  entropy: number,
  bars: number,
  lines?: LineRepository,
): HeldBass {
  let carried = band.initial as BandCarried;
  const style = { ...preset.style, entropy };
  const swing = presetSwing(preset)!;
  const kept: string[] = [];
  const counts: Partial<Record<SectionType, { bars: number; notes: number; intervals: number[] }>> =
    {};
  const drums: string[] = [];
  const notes: string[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const env: BandEnv = {
      seed,
      bar,
      style,
      wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
      swing,
      repository: METER_REPOSITORY,
      rhythms: RHYTHM_REPOSITORY,
      layer: EMPTY_LAYER,
      offer: null,
      ...(lines ? { bassLines: lines } : {}),
    };
    const { carried: after, output } = band.advance(env, carried, null);
    if (bar % SECTION_BARS === 0) kept.push(after.plans.bassFragment ?? '-');
    carried = after;
    const c = (counts[output.plan.section.type] ??= {
      bars: 0,
      notes: 0,
      intervals: Array(12).fill(0) as number[],
    });
    c.bars++;
    const chords = chordsOn(output.chords, output.meter);
    for (const n of output.written.filter((w) => w.part === 'bass')) {
      notes.push(`${bar}:${n.step}:${n.note}`);
      c.notes++;
      c.intervals[wrap(n.note - chordAt(chords, n.step).chord.helix.heights[0]!, 12)]!++;
    }
    drums.push(...notesOf(output, 'drums'));
  }
  return { preset: preset.name, seed, lines: kept, bass: counts, drums, notes };
}

/** Each preset held, `seeds` seeds of `bars` bars, with and without the bass lines. */
export function heldRuns(entropy: number, seeds = 2, bars = 32, lines = BASS_REPOSITORY) {
  return PRESETS.flatMap((preset) =>
    [...Array(seeds).keys()].map((seed) => ({
      main: heldBass(preset, seed, entropy, bars),
      loop: heldBass(preset, seed, entropy, bars, lines),
    })),
  );
}

/** The share of a count's notes on each interval above the chord's root. */
export const intervalShares = (c: BassCounts): number[] =>
  c.intervals.map((n) => (c.notes ? n / c.notes : 0));

/** Total variation between two counts' interval shares: 0 the same, 1 nothing shared. */
export const distanceOf = (a: BassCounts, b: BassCounts): number => {
  const x = intervalShares(a);
  const y = intervalShares(b);
  return x.reduce((sum, v, i) => sum + Math.abs(v - y[i]!), 0) / 2;
};

/** Counts summed over runs. */
export function summed(counts: readonly BassCounts[]): BassCounts {
  return {
    bars: counts.reduce((n, c) => n + c.bars, 0),
    notes: counts.reduce((n, c) => n + c.notes, 0),
    intervals: Array.from({ length: 12 }, (_, i) =>
      counts.reduce((n, c) => n + c.intervals[i]!, 0),
    ),
  };
}

/** How far each preset's bass moves at a held style: by section type, notes a bar before and after, and the interval shares' distance. */
export function movement(runs: ReturnType<typeof heldRuns>) {
  const out: Record<
    string,
    Partial<Record<SectionType, { before: number; after: number; distance: number }>>
  > = {};
  for (const preset of PRESETS) {
    const mine = runs.filter((r) => r.main.preset === preset.name);
    const types = [...new Set(mine.flatMap((r) => Object.keys(r.main.bass)))] as SectionType[];
    out[preset.name] = Object.fromEntries(
      types.map((type) => {
        const before = summed(mine.map((r) => r.main.bass[type]!).filter(Boolean));
        const after = summed(mine.map((r) => r.loop.bass[type]!).filter(Boolean));
        return [
          type,
          {
            before: Number((before.notes / before.bars).toFixed(2)),
            after: Number((after.notes / after.bars).toFixed(2)),
            distance: Number(distanceOf(before, after).toFixed(3)),
          },
        ];
      }),
    );
  }
  return out;
}

/** A learned layer's lines filed, by source. */
export const linesFiled = (layer: LearnedLayer, source?: string) =>
  layer.filed.filter(
    (f) =>
      f.fragment.association.some((p) => p.facet === 'bass') &&
      (source === undefined || f.meta['source'] === source),
  );

/**
 * How much of `main`'s bass a preset keeps, its seeds pooled: the share of
 * its notes that fall where `main`'s did (the same bar and step), and that
 * play the same note there too.
 */
export function kept(
  runs: ReturnType<typeof heldRuns>,
): Record<string, { onsets: number; notes: number }> {
  return Object.fromEntries(
    PRESETS.map(({ name }) => {
      const mine = runs.filter((r) => r.main.preset === name);
      let total = 0;
      let onsets = 0;
      let same = 0;
      for (const { main, loop } of mine) {
        const steps = new Set(main.notes.map((n) => n.split(':').slice(0, 2).join(':')));
        const notes = new Set(main.notes);
        total += loop.notes.length;
        onsets += loop.notes.filter((n) => steps.has(n.split(':').slice(0, 2).join(':'))).length;
        same += loop.notes.filter((n) => notes.has(n)).length;
      }
      return [
        name,
        { onsets: Number((onsets / total).toFixed(3)), notes: Number((same / total).toFixed(3)) },
      ];
    }),
  );
}

/** E41: the sections a run's most used bass line plays (its fragment, or `-` where the bass plays its own), pooled over the runs, and its share. */
export function mostUsedLine(runs: readonly { readonly lines: readonly string[] }[]): {
  readonly sections: number;
  readonly mostUsed: number;
  readonly share: number;
} {
  let sections = 0;
  let mostUsed = 0;
  for (const { lines } of runs) {
    const counts = new Map<string, number>();
    for (const id of lines) counts.set(id, (counts.get(id) ?? 0) + 1);
    sections += lines.length;
    mostUsed += Math.max(0, ...counts.values());
  }
  return { sections, mostUsed, share: mostUsed / sections };
}

/** Lock-in on the bass lines (cells decision 048, as `lockIn` measures it for rhythms): the runs with their lines as their rhythms. */
export const asLines = <R extends { readonly lines: readonly string[] }>(runs: readonly R[]) =>
  runs.map((r) => ({ ...r, kept: r.lines }));
