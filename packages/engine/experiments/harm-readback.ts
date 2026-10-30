/**
 * E25: the chords read back from the notes, and `harm` read from them
 * (#15, the critic's `harm` axis; F3 at the harmony level, N3).
 *
 * Two questions, in this order, since the second stands on the first:
 *
 * - Does `readChords` give back the chords that wrote the bar? Per preset, the
 *   share of bar halves whose read root, and root with quality, are the
 *   composer's (`barChords`, the chord at step 0 and step 8).
 * - Does `readHarm` rise with the `harm` axis, and how far does it lie from it?
 *   Kendall's tau-b and the mean distance, over the presets held and a sweep
 *   of the axis with the others in the middle, as E23 does.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/harm-readback.ts
 */

import { joinChord, qualityOf } from '@jambot/theory';
import { fileURLToPath } from 'node:url';
import {
  type ReadChord,
  PROTOTYPE_PRESETS,
  type MeterSwing,
  STRAIGHT,
  type Style,
  band,
  chordAt,
  readChords,
  readHarm,
  presetSwing,
} from '../src/index.ts';
import { MIDDLE, SEEDS, tau } from './style-readback.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

/** One composed bar: the chords that wrote it and what the notes read as. */
export interface HarmSample {
  readonly style: Style;
  readonly truth: readonly ReadChord[];
  readonly read: readonly (ReadChord | null)[];
  readonly harm: number | undefined;
}

/** The band's bars at a held style, in a meter's swing, each read with the chord the bar before it ended on. */
export function harmSamples(
  style: Style,
  seed: number,
  bars: number,
  swing: MeterSwing = STRAIGHT,
): HarmSample[] {
  let carried = band.initial;
  let before: ReadChord | undefined;
  return range(bars).map((bar) => {
    const out = band.advance(
      {
        seed,
        bar,
        style,
        swing,
        wish: { tonic: null, mode: 'aeolian', melodic: null },
        offer: null,
      },
      carried,
      null,
    );
    carried = out.carried;
    const truth = [0, 8].map((step) => {
      const { chord } = chordAt(out.output.chords, step);
      const heights = joinChord(chord);
      return {
        root: ((heights[0]! % 12) + 12) % 12,
        quality: qualityOf(heights.map((x) => x - heights[0]!))!,
      };
    });
    const read = readChords(out.output.dough);
    const reading = readHarm(out.output.dough, before);
    before = reading?.chords.at(-1) ?? before;
    return { style: out.output.style, truth, read, harm: reading?.harm };
  });
}

export interface ChordAccuracy {
  readonly preset: string;
  /** Bar halves whose root is the composer's. */
  readonly root: number;
  /** Bar halves whose root and quality are. */
  readonly chord: number;
  /** Bar halves with a chord read at all. */
  readonly read: number;
}

export function chordAccuracy(bars = 32): ChordAccuracy[] {
  return PROTOTYPE_PRESETS.map((preset) => {
    const halves = SEEDS.flatMap((seed) =>
      harmSamples({ ...preset.style, entropy: 0.3 }, seed, bars, presetSwing(preset)!).flatMap(
        (s) => s.truth.map((t, i) => ({ t, r: s.read[i]! })),
      ),
    );
    return {
      preset: preset.name,
      root: mean(halves.map(({ t, r }) => (r?.root === t.root ? 1 : 0))),
      chord: mean(
        halves.map(({ t, r }) => (r?.root === t.root && r.quality === t.quality ? 1 : 0)),
      ),
      read: mean(halves.map(({ r }) => (r ? 1 : 0))),
    };
  });
}

export interface HarmReadback {
  readonly n: number;
  readonly tau: number;
  readonly mean: number;
  readonly distance: number;
}

export function harmReadback(set: readonly HarmSample[]): HarmReadback {
  const read = set.filter((s) => s.harm !== undefined);
  return {
    n: read.length,
    tau: tau(
      read.map((s) => s.style.harm),
      read.map((s) => s.harm!),
    ),
    mean: mean(read.map((s) => s.harm!)),
    distance: mean(read.map((s) => Math.abs(s.style.harm - s.harm!))),
  };
}

export const harmPresets = (bars = 32) =>
  PROTOTYPE_PRESETS.flatMap((p) =>
    SEEDS.flatMap((seed) => harmSamples({ ...p.style, entropy: 0.3 }, seed, bars)),
  );

export const harmSweep = (bars = 32) =>
  range(11).flatMap((i) =>
    SEEDS.flatMap((seed) => harmSamples({ ...MIDDLE, harm: i / 10 }, seed, bars)),
  );

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('chords read back');
  for (const a of chordAccuracy())
    console.log(
      `  ${a.preset.padEnd(14)} root=${a.root.toFixed(2)} chord=${a.chord.toFixed(2)} read=${a.read.toFixed(2)}`,
    );
  const show = (title: string, set: readonly HarmSample[]) => {
    const r = harmReadback(set);
    console.log(
      `${title}: n=${r.n} tau=${r.tau.toFixed(3)} mean=${r.mean.toFixed(3)} distance=${r.distance.toFixed(3)}`,
    );
  };
  show('harm, presets held', harmPresets());
  show('harm, sweep', harmSweep());
  for (const i of [0, 2, 4, 6, 8, 10]) {
    const set = SEEDS.flatMap((seed) => harmSamples({ ...MIDDLE, harm: i / 10 }, seed, 32));
    console.log(
      `  at ${i / 10}: read ${mean(set.filter((s) => s.harm !== undefined).map((s) => s.harm!)).toFixed(3)}`,
    );
  }
}
