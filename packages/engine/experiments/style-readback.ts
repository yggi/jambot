/**
 * E23: the style read back from the notes it wrote (#15, step 2; F3 at the
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
 * every 8 bars with the style gliding to it over 8 (E10's glides). Each
 * bar plays in its preset's meter's swing (#360), straight in the sweeps;
 * swing is the meter's, so no reading of it is measured here.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/style-readback.ts
 */

import { fileURLToPath } from 'node:url';
import {
  AXES,
  type Axis,
  LOOKAHEAD,
  type BandBar,
  type ScheduledStep,
  type TimedEvent,
  transport,
  type ReadChord,
  readHarm,
  readStyle,
  readTiming,
  PROTOTYPE_PRESETS,
  PRESET_GLIDE,
  SECTION_BARS,
  type Style,
  type StyleTrack,
  type StyleReading,
  type TimingReading,
  type MeterSwing,
  STRAIGHT,
  type SwingTrack,
  band,
  barStart,
  glideTo,
  holding,
  holdingSwing,
  styleAt,
  swingAt,
  swingTo,
  presetSwing,
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

/** The band's bars, each composed at `styleOf(bar)` in the meter's swing `swingOf(bar)`, and read back. */
export function samples(
  styleOf: (bar: number) => Style,
  seed: number,
  bars: number,
  swingOf: (bar: number) => MeterSwing = () => STRAIGHT,
): Sample[] {
  let carried = band.initial;
  return range(bars).map((bar) => {
    const style = styleOf(bar);
    const out = band.advance(
      {
        seed,
        bar,
        style,
        swing: swingOf(bar),
        wish: { tonic: null, mode: 'aeolian', melodic: null },
        offer: null,
      },
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
  return PROTOTYPE_PRESETS.flatMap((p) =>
    SEEDS.flatMap((seed) =>
      samples(
        () => ({ ...p.style, entropy: 0.3 }),
        seed,
        bars,
        () => presetSwing(p)!,
      ),
    ),
  );
}

/** One axis from 0 to 1 in eleven steps, the others in the middle, each held for `bars` bars. */
export function sweepSamples(axis: Axis, bars: number): Sample[] {
  return range(11).flatMap((i) =>
    SEEDS.flatMap((seed) => samples(() => ({ ...MIDDLE, [axis]: i / 10 }), seed, bars)),
  );
}

/**
 * The tour's tracks: a new preset every section, the style and the swing's
 * share gliding to it over `PRESET_GLIDE`, the level asked for at once, so a
 * section takes it the section after.
 */
function tourTracks(sections: number): { track: StyleTrack; swing: SwingTrack }[] {
  let track: StyleTrack = holding({ ...PROTOTYPE_PRESETS[0]!.style, entropy: 0.3 });
  let swing: SwingTrack = holdingSwing(presetSwing(PROTOTYPE_PRESETS[0]!)!);
  return range(sections).map((section) => {
    const preset = PROTOTYPE_PRESETS[section % PROTOTYPE_PRESETS.length]!;
    const start = barStart(section * SECTION_BARS);
    track = glideTo(track, { ...preset.style }, start, PRESET_GLIDE);
    swing = swingTo(swing, presetSwing(preset)!, start, PRESET_GLIDE);
    return { track, swing };
  });
}

/** The tour: a new preset every section, the style gliding to it over `PRESET_GLIDE`. */
export function tourSamples(sections: number): Sample[] {
  const tracks = tourTracks(sections);
  const at = (bar: number) => tracks[Math.floor(bar / SECTION_BARS)]!;
  return SEEDS.flatMap((seed) =>
    samples(
      (bar) => styleAt(at(bar).track, barStart(bar)),
      seed,
      sections * SECTION_BARS,
      (bar) => swingAt(at(bar).swing, barStart(bar)),
    ),
  );
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
  const showTiming = (title: string, set: readonly TimingSample[]) => {
    const r = timingReadback(set);
    console.log(`\n${title} (${set.length} bars)`);
    console.log(
      `  bpm   n=${r.bpm.n} tau=${r.bpm.tau.toFixed(3)} distance=${r.bpm.distance.toFixed(2)} bpm (${r.bpm.unitDistance.toFixed(4)} of the axis)`,
    );
  };
  showTiming('timing: presets held', timingPresets(16));
  showTiming('timing: sweep of bpm', timingSweep(16));
  showTiming('timing: tour', timingTour(16));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

/** One bar as the clock laid it: the style at its start, and the timing `readTiming` read. */
export interface TimingSample extends StyleReading, TimingReading {
  readonly style: Style;
  /** The `harm` read from the chords the notes sound (`readHarm`). */
  readonly harm?: number;
}

/** The bars of a run through the transport, in a meter's swing, each read against the style at its start. */
export function timingSamples(
  track: StyleTrack,
  seed: number,
  bars: number,
  swing: SwingTrack = holdingSwing(STRAIGHT),
): TimingSample[] {
  let carried = transport.initial;
  const laid: ScheduledStep[] = [];
  const events: TimedEvent[] = [];
  const composed = new Map<number, BandBar>();
  let before: ReadChord | undefined;
  const env = {
    seed,
    start: 1,
    track,
    swing,
    wish: { tonic: null, mode: 'aeolian', melodic: null },
  } as const;
  for (let now = 0.9; laid.length < bars * 16; now += 0.025) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried;
    laid.push(...next.output.steps);
    events.push(...next.output.events);
    for (const b of next.output.composed) composed.set(b.bar, b);
  }
  return range(bars).map((bar) => {
    const steps = laid.filter((s) => Math.floor(s.step / 16) === bar);
    const dough = composed.get(bar)!.dough;
    const chords = readHarm(dough, before);
    before = chords?.chords.at(-1) ?? before;
    return {
      style: styleAt(track, barStart(bar)),
      ...readStyle(dough),
      ...(chords === undefined ? {} : { harm: chords.harm }),
      ...readTiming(steps),
    };
  });
}

/** Tau and distance for the tempo on its log axis scaled to 0 to 1. */
export function timingReadback(set: readonly TimingSample[]) {
  const unit = (bpm: number) =>
    (Math.log(bpm) - Math.log(AXES.bpm.min)) / (Math.log(AXES.bpm.max) - Math.log(AXES.bpm.min));
  const bpm = set.filter((s) => s.bpm !== undefined);
  return {
    bpm: {
      n: bpm.length,
      tau: tau(
        bpm.map((s) => s.style.bpm),
        bpm.map((s) => s.bpm!),
      ),
      /** In bpm, and on the log axis scaled to 0 to 1. */
      distance: mean(bpm.map((s) => Math.abs(s.style.bpm - s.bpm!))),
      unitDistance: mean(bpm.map((s) => Math.abs(unit(s.style.bpm) - unit(s.bpm!)))),
    },
  };
}

/** The tempo from 60 to 180 in eleven steps on its log axis, the rest in the middle. */
export function timingSweep(bars: number): TimingSample[] {
  return range(11).flatMap((i) => {
    const value = Math.exp(Math.log(60) + (i / 10) * (Math.log(180) - Math.log(60)));
    return SEEDS.slice(0, 3).flatMap((seed) =>
      timingSamples(holding({ ...MIDDLE, bpm: value }), seed, bars),
    );
  });
}

/** The presets, each held in its meter's swing. */
export function timingPresets(bars: number): TimingSample[] {
  return PROTOTYPE_PRESETS.flatMap((p) =>
    SEEDS.slice(0, 3).flatMap((seed) =>
      timingSamples(
        holding({ ...p.style, entropy: 0.3 }),
        seed,
        bars,
        holdingSwing(presetSwing(p)!),
      ),
    ),
  );
}

/** The tour through the transport: the tracks as they stand after its last section. */
export function timingTour(sections: number): TimingSample[] {
  const { track, swing } = tourTracks(sections).at(-1)!;
  return SEEDS.slice(0, 3).flatMap((seed) =>
    timingSamples(track, seed, sections * SECTION_BARS, swing),
  );
}
