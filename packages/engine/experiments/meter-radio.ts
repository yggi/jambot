/**
 * E34: the composer asks the repository for its meter while the radio walks
 * (#375; #313; yggi/cells decision 043).
 *
 * The radio (`radio.ts`) is tuned in at each preset's point at entropy 0.3,
 * its energy the preset's, and walks on its own for `HOURS` hours of music,
 * each section's style glided to over `PRESET_GLIDE` from the section's
 * first step, as in E30. The band decides every bar from the style where
 * the bar before it starts, its meter asked for nowhere, so each section's
 * plan takes the meter the composer finds in cells' repository
 * (`METER_REPOSITORY`, `composedMeter`). A bar lasts its meter's beats at
 * the tempo it starts at (#367), so a section of 7/8 is shorter than one of
 * 4/4. Over every preset and `SEEDS` seeds it counts:
 *
 * - each change of meter (its meter, its swing level or its share): the bar
 *   it falls on, which must be a section's first; how many an hour; and how
 *   many go back, at the next section's start, to the meter just left;
 * - the meters played, and the share of time in each;
 * - the sections where the composer finds nothing within `MISS_DISTANCE`,
 *   and keeps the meter playing.
 *
 * Learning (#398): the same runs with the band given an empty learned layer,
 * so each meter the composer keeps is a use at the section's point and the
 * next section asks with what was learned (cells decision 048). It counts
 * the share of sections whose meter is among its run's 3 most used, against
 * the same walk with nothing learned (`lockIn`), and what the layer weighs
 * after the run's hours (`layerBytes`).
 *
 * Beside it: the share of the axes' space where the composer misses, on a
 * grid of the four unit axes (`missShare`); and the query's cost
 * (`queryCost`). It runs under vitest, as E31 does: `E34_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/meter-radio.test.ts` prints the numbers.
 */

import { beatsOf } from '@jambot/theory';
import {
  presetMode,
  type BandCarried,
  type BandEnv,
  MISS_DISTANCE,
  type MeterRepository,
  type StylePoint,
  type Plan,
  PRESETS,
  PRESET_GLIDE,
  RADIO,
  SECTION_BARS,
  STRAIGHT,
  type Style,
  type StyleTrack,
  band,
  clockOf,
  composedMeter,
  glideTo,
  holding,
  lookAhead,
  stylePoint,
  styleAt,
  walkRadio,
} from '../src/index.ts';
import { EMPTY_LAYER, type LearnedLayer, layerBytes } from '../src/layer.ts';
import { METER_REPOSITORY } from '../src/repository.ts';

export const HOURS = 3;
export const SEEDS = 5;
export const ENTROPY = 0.3;

const range = (n: number) => [...Array(n).keys()];

/** A section's meter as a change is counted: its meter, swing level and share. */
const meterKey = (plan: Plan) =>
  `${plan.meterFragment ?? '-'} ${plan.meter.cycle}:${plan.meter.heights.join(',')} ${plan.swing} ${plan.share ?? '-'}`;

/** One change of meter: the bar it falls on, the section, and from and to which fragment. */
export interface MeterChangeSeen {
  readonly bar: number;
  readonly section: number;
  readonly from: string;
  readonly to: string;
}

/** One run: the radio tuned in at a preset, for `HOURS` hours of music. */
export interface MeterRun {
  readonly preset: string;
  readonly seed: number;
  readonly bars: number;
  readonly sections: number;
  readonly changes: readonly MeterChangeSeen[];
  /** The sections where the composer found nothing, and kept the meter. */
  readonly missed: number;
  /** How far the style's point moves from one section's query to the next, on cells' distance. */
  readonly moves: readonly number[];
  /** Minutes in each fragment's meter. */
  readonly minutes: Readonly<Record<string, number>>;
  /** The fragment each section plays, by id (`-` for none). */
  readonly kept: readonly string[];
  /** What the band learned by the run's last section, where it was given a layer; null where it wasn't. */
  readonly layer: LearnedLayer | null;
}

/**
 * The radio tuned in at a preset, the band deciding each bar with the
 * composer asking the repository, until `hours` hours of music are decided.
 */
export function meterRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  hours = HOURS,
  margins?: MeterRepository['margins'],
  layer?: LearnedLayer,
): MeterRun {
  // The repository with the margins asked for, keeping each query and what each section learned: the planner asks once a section, in order.
  const { miss } = margins ?? { miss: MISS_DISTANCE };
  const queries: { point: StylePoint; missed: boolean; learned?: LearnedLayer }[] = [];
  const repository: MeterRepository = {
    ...METER_REPOSITORY,
    ...(margins ? { margins } : {}),
    query(point, given) {
      const found = METER_REPOSITORY.query(point, given);
      queries.push({ point, missed: found[0]!.distance > miss });
      return found;
    },
    used(given, id, point) {
      const learned = METER_REPOSITORY.used!(given, id, point);
      queries.at(-1)!.learned = learned;
      return learned;
    },
  };
  let style: Style = { ...preset.style, entropy: ENTROPY };
  let track: StyleTrack = holding(style);
  let walked = 0;
  // The tempo each bar starts at, read as it is decided: a track holds only its latest glide.
  const bpms: number[] = [];
  const envAt = (bar: number, clock: ReturnType<typeof clockOf>): BandEnv => {
    const section = Math.floor(bar / SECTION_BARS);
    while (walked < section) {
      walked++;
      style = walkRadio(style, seed, walked, RADIO);
      track = glideTo(track, style, clock.barStart(walked * SECTION_BARS), PRESET_GLIDE);
    }
    const played = styleAt(track, clock.barStart(bar));
    bpms[bar] = played.bpm;
    return {
      seed,
      bar,
      style: played,
      wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
      swing: STRAIGHT,
      repository,
      layer,
      offer: null,
    };
  };
  // Enough bars for the hours at the fastest tempo and the shortest bar; cut at the hours below.
  const decided = lookAhead(band.initial as BandCarried, envAt, Math.ceil((hours * 60 * 180) / 2));
  const changes: MeterChangeSeen[] = [];
  const minutes: Record<string, number> = {};
  const kept: string[] = [];
  let minute = 0;
  let bars = 0;
  for (const [i, d] of decided.entries()) {
    if (minute >= hours * 60) break;
    bars++;
    const before = decided[i - 1];
    if (before && meterKey(before.plan) !== meterKey(d.plan))
      changes.push({
        bar: d.bar,
        section: Math.floor(d.bar / SECTION_BARS),
        from: before.plan.meterFragment ?? '-',
        to: d.plan.meterFragment ?? '-',
      });
    // A bar of `beats` beats at `bpm` beats a minute (#367).
    const length = beatsOf(d.plan.meter) / bpms[d.bar]!;
    const id = d.plan.meterFragment ?? '-';
    if (d.bar % SECTION_BARS === 0) kept.push(id);
    minutes[id] = (minutes[id] ?? 0) + length;
    minute += length;
  }
  const sections = Math.ceil(bars / SECTION_BARS);
  const asked = queries.slice(0, sections);
  const learned = asked.findLast((q) => q.learned)?.learned ?? layer ?? null;
  return {
    preset: preset.name,
    seed,
    bars,
    sections,
    changes,
    missed: asked.filter((q) => q.missed).length,
    moves: asked.slice(1).map((q, i) => pointMove(asked[i]!.point, q.point)),
    minutes,
    kept,
    layer: layer ? learned : null,
  };
}

/** Cells' distance between two points on the same axes (decision 041): the root of the mean squared difference. */
const pointMove = (a: StylePoint, b: StylePoint): number => {
  const axes = Object.keys(a);
  return Math.sqrt(axes.reduce((sum, axis) => sum + (a[axis]! - b[axis]!) ** 2, 0) / axes.length);
};

/** Every preset, `seeds` seeds each, each run its own seed as E30's are; learning from `layer` where one is given. */
export const meterRuns = (
  seeds = SEEDS,
  hours = HOURS,
  margins?: MeterRepository['margins'],
  layer?: LearnedLayer,
): MeterRun[] =>
  PRESETS.flatMap((preset, p) =>
    range(seeds).map((seed) => meterRun(preset, p * seeds + seed + 1, hours, margins, layer)),
  );

/** E34's runs with the band learning from an empty layer (#398). */
export const learningRuns = (seeds = SEEDS, hours = HOURS): MeterRun[] =>
  meterRuns(seeds, hours, undefined, EMPTY_LAYER);

/** How many of a run's sections play one of its 3 most used meters. */
export function inTopThree(run: MeterRun): number {
  const counts = new Map<string, number>();
  for (const id of run.kept) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.values()]
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((a, b) => a + b, 0);
}

/**
 * Lock-in (cells decision 048, point 6, as amended): how many points
 * learning adds to the share of sections whose meter is among its run's 3
 * most used, over the same walks with nothing learned. Pooled over every
 * section of every run, with the standard error of the runs' differences
 * (each run paired with its walk unlearned), its spread over √runs.
 */
export function lockIn(
  unlearned: readonly MeterRun[],
  learned: readonly MeterRun[],
): {
  readonly before: number;
  readonly after: number;
  readonly added: number;
  readonly error: number;
} {
  const pooled = (runs: readonly MeterRun[]) =>
    runs.reduce((n, r) => n + inTopThree(r), 0) / runs.reduce((n, r) => n + r.kept.length, 0);
  const share = (r: MeterRun) => inTopThree(r) / r.kept.length;
  const differences = learned.map((r, i) => (share(r) - share(unlearned[i]!)) * 100);
  const mean = differences.reduce((a, b) => a + b, 0) / differences.length;
  const spread = Math.sqrt(
    differences.reduce((a, d) => a + (d - mean) ** 2, 0) / (differences.length - 1),
  );
  const [before, after] = [pooled(unlearned), pooled(learned)];
  return {
    before,
    after,
    added: (after - before) * 100,
    error: spread / Math.sqrt(differences.length),
  };
}

/** What each learned run's layer weighs, in bytes of its JSON. */
export const learnedBytes = (runs: readonly MeterRun[]): number[] =>
  runs.map((r) => (r.layer ? layerBytes(r.layer) : 0));

/** The changes that go back, at the next section's start, to the meter just left. */
export const wentBack = (run: MeterRun): MeterChangeSeen[] =>
  run.changes.filter((c, i) => {
    const next = run.changes[i + 1];
    return next !== undefined && next.section === c.section + 1 && next.to === c.from;
  });

/** The distance from each point of a grid of the four unit axes, `steps` + 1 points an axis, to its nearest fragment. */
export function gridDistances(steps = 20): number[] {
  const at = (i: number) => i / steps;
  return range((steps + 1) ** 4).map((i) => {
    const [sync, harm, artic, energy] = [0, 1, 2, 3].map((axis) =>
      at(Math.floor(i / (steps + 1) ** axis) % (steps + 1)),
    );
    const point = stylePoint({ sync: sync!, harm: harm!, artic: artic!, energy: energy! });
    return METER_REPOSITORY.query(point)[0]!.distance;
  });
}

/** The share of the grid where the composer finds nothing. */
export const missShare = (distances: readonly number[], miss = MISS_DISTANCE): number =>
  distances.filter((d) => d > miss).length / distances.length;

/** What one query costs, in milliseconds, the mean over `count` styles: a section's worth of the composer's work. */
export function queryCost(now: () => number, count = 20_000): number {
  const styles = range(count).map((i) => ({
    ...PRESETS[i % PRESETS.length]!.style,
    sync: (i * 0.618) % 1,
    harm: (i * 0.414) % 1,
    entropy: ENTROPY,
  }));
  const start = now();
  let playing: string | null = null;
  for (const style of styles) playing = composedMeter(METER_REPOSITORY, style, playing)?.id ?? null;
  return (now() - start) / count;
}
