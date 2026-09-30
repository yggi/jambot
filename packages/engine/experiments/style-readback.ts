/**
 * E22: the style read back from the notes it wrote (#15, step 2; F3 at the
 * style level).
 *
 * The composer turns a style into notes and `readStyle` turns notes into a
 * style. Compose a bar at style s, read s' back, and per axis measure two
 * things: whether s' rises with s (Kendall's tau-b over all the pairs of
 * bars), and how far it lies from s (the mean absolute distance, where the
 * reading is on the axis's own scale: `sync` and `artic`; `density` has none).
 * Exact isn't expected: the licence and the draws blur it, so the error is
 * the measurement, and an axis whose reading does not rise with it is a
 * finding against the composer or the reader (N3).
 *
 * Three runs of the band, each bar read against the style it was composed at:
 * the presets, held (8 points of the space); a sweep of one axis at a time
 * from 0 to 1 with the others at a middle style; and the tour, a new preset
 * every 8 bars with the style gliding to it over 8 (E10's glides).
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/style-readback.ts
 */

import { fileURLToPath } from 'node:url';
import {
  type Axis,
  PRESETS,
  PRESET_GLIDE,
  SECTION_BARS,
  type Style,
  type StyleTrack,
  band,
  barStart,
  glideTo,
  holding,
  readStyle,
  styleAt,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

/** The axes a reading has: the ones of the style space that notes can say. */
export const READ_AXES = [
  ['sync', 'sync'],
  ['artic', 'artic'],
  ['energy', 'density'],
] as const satisfies readonly (readonly [Axis, 'sync' | 'artic' | 'density'])[];

/** One composed bar: the style it was composed at, and what `readStyle` read. */
export interface Sample {
  readonly style: Style;
  readonly sync: number | undefined;
  readonly artic: number | undefined;
  readonly density: number;
}

/** The band's bars, each composed at `styleOf(bar)` and read back. */
export function samples(styleOf: (bar: number) => Style, seed: number, bars: number): Sample[] {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const style = styleOf(bar);
    const out = band.advance(
      { seed, bar, style, wish: { tonic: null, mode: 'aeolian', melodic: null }, offer: null },
      carried,
      null,
    );
    carried = out.carried;
    const read = readStyle(out.output.dough);
    return { style: out.output.style, sync: read.sync, artic: read.artic, density: read.density };
  });
}

/** Kendall's tau-b of two series: +1 when one rises with the other, 0 when unrelated. */
export function tau(xs: readonly number[], ys: readonly number[]): number {
  let concordant = 0;
  let discordant = 0;
  let tiedX = 0;
  let tiedY = 0;
  for (let i = 0; i < xs.length; i++)
    for (let j = i + 1; j < xs.length; j++) {
      const dx = Math.sign(xs[i]! - xs[j]!);
      const dy = Math.sign(ys[i]! - ys[j]!);
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) tiedX++;
      else if (dy === 0) tiedY++;
      else if (dx === dy) concordant++;
      else discordant++;
    }
  const denominator = Math.sqrt(
    (concordant + discordant + tiedX) * (concordant + discordant + tiedY),
  );
  return denominator === 0 ? 0 : (concordant - discordant) / denominator;
}

/** What is measured of one axis over a set of samples. */
export interface AxisReadback {
  readonly axis: Axis;
  /** Bars in which the axis was read. */
  readonly n: number;
  readonly tau: number;
  /** The mean reading. */
  readonly mean: number;
  /** The mean distance of the reading from the style's value; absent for `density`. */
  readonly distance: number | null;
}

export function readback(set: readonly Sample[]): AxisReadback[] {
  return READ_AXES.map(([axis, key]) => {
    const pairs = set.flatMap((s) => (s[key] === undefined ? [] : [[s.style[axis], s[key]!]]));
    const [xs, ys] = [pairs.map((p) => p[0]!), pairs.map((p) => p[1]!)];
    return {
      axis,
      n: pairs.length,
      tau: tau(xs, ys),
      mean: mean(ys),
      distance: key === 'density' ? null : mean(pairs.map(([x, y]) => Math.abs(x! - y!))),
    };
  });
}

/** Every axis in the middle of its range, entropy where the players leave it. */
export const MIDDLE: Style = {
  swing: 0.3,
  sync: 0.5,
  harm: 0.5,
  artic: 0.5,
  energy: 0.5,
  entropy: 0.3,
  bpm: 110,
};

export const SEEDS = [1, 2, 3, 4, 5];

/** The presets, each held for `bars` bars, over the seeds. */
export function presetSamples(bars: number): Sample[] {
  return PRESETS.flatMap((p) =>
    SEEDS.flatMap((seed) => samples(() => ({ ...p.style, entropy: 0.3 }), seed, bars)),
  );
}

/** One axis from 0 to 1 in eleven steps, the others in the middle, each held for `bars` bars. */
export function sweepSamples(axis: Axis, bars: number): Sample[] {
  return range(11).flatMap((i) =>
    SEEDS.flatMap((seed) => samples(() => ({ ...MIDDLE, [axis]: i / 10 }), seed, bars)),
  );
}

/** The tour: a new preset every section, the style gliding to it over `PRESET_GLIDE`. */
export function tourSamples(sections: number): Sample[] {
  return SEEDS.flatMap((seed) => {
    let track: StyleTrack = holding({ ...PRESETS[0]!.style, entropy: 0.3 });
    const tracks = range(sections).map((section) => {
      track = glideTo(
        track,
        { ...PRESETS[section % PRESETS.length]!.style },
        barStart(section * SECTION_BARS),
        PRESET_GLIDE,
      );
      return track;
    });
    return samples(
      (bar) => styleAt(tracks[Math.floor(bar / SECTION_BARS)]!, barStart(bar)),
      seed,
      sections * SECTION_BARS,
    );
  });
}

function main() {
  const show = (title: string, set: readonly Sample[]) => {
    console.log(`\n${title} (${set.length} bars)`);
    for (const r of readback(set))
      console.log(
        `  ${r.axis.padEnd(7)} n=${r.n} tau=${r.tau.toFixed(3)} mean=${r.mean.toFixed(3)} distance=${r.distance === null ? '-' : r.distance.toFixed(3)}`,
      );
  };
  show('presets held', presetSamples(16));
  for (const [axis] of READ_AXES) show(`sweep of ${axis}`, sweepSamples(axis, 16));
  show('tour', tourSamples(16));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
