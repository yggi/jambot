/**
 * E24: does Techno land where techno lands? (#15, step 3)
 *
 * The round trip the critic is calibrated on: the band composes at each
 * preset's point, `readStyle` reads the bars, `genreOf` turns the reading
 * into probabilities over the presets. Per preset, over 5 seeds of 32 bars:
 *
 * - `bar`: the share of single bars whose most likely preset is the one that
 *   wrote them;
 * - `section`: the same over the mean reading of 8 bars, a section, which is
 *   what a licence or a reranking would read;
 * - `p`: the mean probability on the right preset, per bar;
 * - `confused`: the preset most often taken for it, when it is not itself.
 *
 * Two sets of landmarks: the presets' points (`PRESET_LANDMARKS`), and where
 * each preset's bars actually read (`readLandmarks`, the mean reading over
 * other seeds than the ones measured, so no bar is read against itself).
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/genre-calibration.ts
 */

import { fileURLToPath } from 'node:url';
import {
  type Landmark,
  PRESETS,
  PRESET_LANDMARKS,
  bpmUnit,
  holding,
  SECTION_BARS,
  energyOf,
  genreOf,
  readingAxes,
} from '../src/index.ts';
import { SEEDS, type TimingSample, timingSamples } from './style-readback.ts';

const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** The seeds the landmarks are read from, apart from the measured ones. */
const LANDMARK_SEEDS = [11, 12, 13, 14, 15];

const axesOf = (s: Pick<TimingSample, 'density' | 'sync' | 'artic' | 'bpm' | 'swing' | 'harm'>) =>
  readingAxes(s);

/** The mean reading of some bars: the mean of each axis over the bars that have it. */
function meanReading(part: readonly TimingSample[]) {
  const at = (key: 'sync' | 'artic' | 'bpm' | 'swing' | 'harm') =>
    part.flatMap((s) => (s[key] === undefined ? [] : [s[key]!]));
  const [sync, artic, bpm, swing, harm] = (['sync', 'artic', 'bpm', 'swing', 'harm'] as const).map(
    (k) => mean(at(k)),
  );
  return { density: mean(part.map((s) => s.density)), sync, artic, bpm, swing, harm };
}

const landmarkOf = (read: ReturnType<typeof meanReading>): Landmark['at'] => ({
  energy: energyOf(read.density),
  sync: read.sync!,
  artic: read.artic!,
  swing: read.swing!,
  bpm: bpmUnit(read.bpm!),
  harm: read.harm,
});

/** Where each preset's bars read: its landmark for the critic. */
export function readLandmarks(bars = 32): Landmark[] {
  return PRESETS.map((preset) => {
    const style = { ...preset.style, entropy: 0.3 };
    const read = meanReading(
      LANDMARK_SEEDS.flatMap((seed) => timingSamples(holding(style), seed, bars)),
    );
    return { name: preset.name, at: landmarkOf(read) };
  });
}

export interface Calibration {
  readonly preset: string;
  readonly bar: number;
  readonly section: number;
  readonly p: number;
  readonly confused: string | null;
}

export function calibrate(
  landmarks: readonly Landmark[],
  temperature = 0.1,
  bars = 32,
): Calibration[] {
  const top = (read: ReturnType<typeof axesOf>) =>
    genreOf(read, temperature, landmarks).reduce((a, b) => (b.p > a.p ? b : a)).name;
  return PRESETS.map((preset) => {
    const style = { ...preset.style, entropy: 0.3 };
    const runs = SEEDS.map((seed) => timingSamples(holding(style), seed, bars));
    const axes = runs.flat().map(axesOf);
    const barTops = axes.map(top);
    const sections = runs.flatMap((run) =>
      Array.from({ length: bars / SECTION_BARS }, (_, i) =>
        top(axesOf(meanReading(run.slice(i * SECTION_BARS, (i + 1) * SECTION_BARS)))),
      ),
    );
    const counts = new Map<string, number>();
    for (const n of barTops.filter((n) => n !== preset.name))
      counts.set(n, (counts.get(n) ?? 0) + 1);
    return {
      preset: preset.name,
      bar: barTops.filter((n) => n === preset.name).length / barTops.length,
      section: sections.filter((n) => n === preset.name).length / sections.length,
      p: mean(
        axes.map((a) => genreOf(a, temperature, landmarks).find((g) => g.name === preset.name)!.p),
      ),
      confused: [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = readLandmarks();
  for (const [title, landmarks] of [
    ['the presets’ points', PRESET_LANDMARKS],
    ['where the presets read', read],
  ] as const)
    for (const t of [0.05, 0.1]) {
      console.log(`\n${title}, temperature ${t}`);
      for (const c of calibrate(landmarks, t))
        console.log(
          `  ${c.preset.padEnd(14)} bar=${c.bar.toFixed(2)} section=${c.section.toFixed(2)} p=${c.p.toFixed(2)} confused with ${c.confused}`,
        );
    }
}
