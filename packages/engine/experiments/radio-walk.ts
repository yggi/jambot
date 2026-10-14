/**
 * E30: the radio's walk over hours of music (#313 step 1).
 *
 * The radio (`radio.ts`) is tuned in at each preset's point, entropy 0.3,
 * and walks on its own for `HOURS` hours of music, each section's tip glided
 * to over `PRESET_GLIDE` from the section's first step, as a preset is. A
 * section lasts 8 bars of 4/4 at the tempo each bar starts at. Per set of
 * parameters, over every preset and `SEEDS` seeds:
 *
 * - the tip's distance from the anchor, and the anchor's from home, on the
 *   axes a preset has (the root mean square of `styleDistance`, tempo on its
 *   unit scale): the mean, and how far home the anchor is after 10 minutes,
 *   1 hour and 3;
 * - per axis, the autocorrelation of the tip's distance from the anchor at a
 *   lag of 1, 4 and 16 sections, and of the anchor's from home at 16 and 64;
 * - the nearest preset (by `styleDistance` to `PRESET_LANDMARKS`) of the
 *   style played at each bar's start: the minutes until it first changes,
 *   how often it changes an hour, the share of changes undone within a
 *   section (a walk along a border between two presets), the share of time
 *   it is the preset tuned in at, and how many presets are nearest some time
 *   in the 3 hours;
 * - the share of the tip's values held at an axis's end, and the fastest
 *   each axis glides against the fastest a preset glide moves it (the bound
 *   `radio.test.ts` holds for the default).
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/radio-walk.ts
 */

import { fileURLToPath } from 'node:url';
import {
  AXES,
  AXIS_NAMES,
  type Axis,
  PRESETS,
  PRESET_GLIDE,
  PRESET_LANDMARKS,
  RADIO,
  type Radio,
  type RadioParams,
  SECTION_BARS,
  type Style,
  type StyleTrack,
  barStart,
  bpmUnit,
  centreOf,
  glideTo,
  holding,
  rateAt,
  styleAt,
  styleDistance,
  tuneIn,
  walkRadio,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

export const HOURS = 3;
export const SEEDS = 10;
const SECTION_STEPS = barStart(SECTION_BARS);

/** Every spread of `params` times `factor`. */
const scaled = (params: RadioParams, factor: number): RadioParams => ({
  ...params,
  tipSpread: Object.fromEntries(AXIS_NAMES.map((a) => [a, params.tipSpread[a] * factor])) as Style,
  anchorSpread: Object.fromEntries(
    AXIS_NAMES.map((a) => [a, params.anchorSpread[a] * factor]),
  ) as Style,
});

/**
 * The anchor as a walk that never returns, near enough over 3 hours: a time
 * of 100,000 sections, its spread raised so that it moves as far a section
 * as the default's anchor does.
 */
const FREE_TIME = 100_000;
const freeAnchor: RadioParams = (() => {
  const step = (time: number) => Math.sqrt(1 - (1 - 1 / time) ** 2);
  const factor = step(RADIO.anchorTime) / step(FREE_TIME);
  return {
    ...RADIO,
    anchorTime: FREE_TIME,
    anchorSpread: Object.fromEntries(
      AXIS_NAMES.map((a) => [a, RADIO.anchorSpread[a] * factor]),
    ) as Style,
  };
})();

/** The parameter sets compared. */
export const SETS: readonly { readonly name: string; readonly params: RadioParams }[] = [
  { name: 'default (4, 128)', params: RADIO },
  { name: 'quick (2, 32)', params: { ...RADIO, tipTime: 2, anchorTime: 32 } },
  { name: 'slow (8, 256)', params: { ...RADIO, tipTime: 8, anchorTime: 256 } },
  { name: 'narrow (× 0.5)', params: scaled(RADIO, 0.5) },
  { name: 'wide (× 2)', params: scaled(RADIO, 2) },
  { name: 'free anchor', params: freeAnchor },
  {
    name: 'entropy walks',
    params: {
      ...RADIO,
      tipSpread: { ...RADIO.tipSpread, entropy: 0.03 },
      anchorSpread: { ...RADIO.anchorSpread, entropy: 0.1 },
    },
  },
];

/** The style on the scale a distance is taken on: tempo on its unit axis. */
const unitOf = (style: Style) => ({ ...style, bpm: bpmUnit(style.bpm) });
const distance = (a: Style, b: Style) => styleDistance(unitOf(a), unitOf(b));
const nearest = (style: Style) =>
  centreOf(PRESET_LANDMARKS, (landmark) => -styleDistance(unitOf(style), landmark.at)).name;
const inSpace = (axis: Axis, x: number) => (AXES[axis].space === 'log' ? Math.log(x) : x);

/** One run: each section's radio, the minutes each section starts at, and each bar's nearest preset and minute. */
export interface RadioRun {
  readonly preset: string;
  readonly radios: readonly Radio[];
  readonly sectionMinutes: readonly number[];
  readonly bars: readonly { readonly minute: number; readonly nearest: string }[];
  /** The fastest each axis glides, per step, in its space. */
  readonly fastest: Readonly<Record<Axis, number>>;
}

/** The radio tuned in at a preset, left alone for `hours` hours of music. */
export function radioRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  params: RadioParams,
  hours = HOURS,
): RadioRun {
  const home: Style = { ...preset.style, entropy: 0.3 };
  let radio = tuneIn(home);
  let track: StyleTrack = holding(home);
  const radios: Radio[] = [];
  const sectionMinutes: number[] = [];
  const bars: { minute: number; nearest: string }[] = [];
  const fastest = Object.fromEntries(AXIS_NAMES.map((a) => [a, 0])) as Record<Axis, number>;
  let minute = 0;
  for (let section = 0; minute < hours * 60; section++) {
    if (section > 0) radio = walkRadio(radio, seed, section, params);
    radios.push(radio);
    sectionMinutes.push(minute);
    const start = section * SECTION_STEPS;
    track = glideTo(track, radio.tip, start, PRESET_GLIDE);
    for (let step = 0; step < SECTION_STEPS; step++)
      for (const axis of AXIS_NAMES)
        fastest[axis] = Math.max(fastest[axis], Math.abs(rateAt(axis, track[axis], start + step)));
    for (const bar of range(SECTION_BARS)) {
      const style = styleAt(track, start + barStart(bar));
      bars.push({ minute, nearest: nearest(style) });
      // A bar of 4/4 is 4 beats, at `bpm` beats a minute.
      minute += 4 / style.bpm;
    }
  }
  return { preset: preset.name, radios, sectionMinutes, bars, fastest };
}

/** The fastest a preset glide moves each axis: the presets farthest apart, from rest; entropy across its axis. */
export function presetRates(): Record<Axis, number> {
  return Object.fromEntries(
    AXIS_NAMES.map((axis) => {
      const values = axis === 'entropy' ? [0, 1] : PRESETS.map((p) => p.style[axis]);
      const track = glideTo(
        holding({ ...PRESETS[0]!.style, entropy: 0, [axis]: Math.min(...values) }),
        { [axis]: Math.max(...values) },
        0,
        PRESET_GLIDE,
      );
      return [axis, Math.max(...range(PRESET_GLIDE).map((p) => rateAt(axis, track[axis], p)))];
    }),
  ) as Record<Axis, number>;
}

/** The correlation of each series with itself `lag` later, pooled. */
function autocorrelation(series: readonly (readonly number[])[], lag: number): number {
  const m = mean(series.flat());
  let together = 0;
  let alone = 0;
  for (const xs of series)
    for (let i = 0; i < xs.length; i++) {
      alone += (xs[i]! - m) ** 2;
      if (i >= lag) together += (xs[i]! - m) * (xs[i - lag]! - m);
    }
  return alone === 0 ? 1 : together / alone;
}

/** What E30 measures of one parameter set. */
export interface RadioWalk {
  readonly name: string;
  /** Minutes a section lasts, on average. */
  readonly sectionMinutes: number;
  /** The tip's mean distance from the anchor. */
  readonly tipOff: number;
  /** The anchor's mean distance from home after 10, 60 and 180 minutes. */
  readonly anchorOff: readonly number[];
  /** Per axis: the tip's distance from the anchor, correlated with itself 1, 4 and 16 sections on. */
  readonly tipCorrelation: Readonly<Record<Axis, readonly number[]>>;
  /** Per axis: the anchor's from home, 16 and 64 sections on. */
  readonly anchorCorrelation: Readonly<Record<Axis, readonly number[]>>;
  /** The minutes until the nearest preset first changes, the median over runs; a run where it never does counts as the whole. */
  readonly firstChange: number;
  /** Changes of the nearest preset an hour. */
  readonly changesPerHour: number;
  /** The share of changes undone within a section: the next change goes back to the preset left. */
  readonly undone: number;
  /** The share of bars whose nearest preset is the one tuned in at. */
  readonly atHome: number;
  /** The mean number of presets nearest at some bar, of 8. */
  readonly visited: number;
  /** The share of tip values held at an axis's end, over the walking axes. */
  readonly atEnd: number;
  /** Per axis: the fastest glide against the fastest preset glide. */
  readonly rateRatio: Readonly<Record<Axis, number>>;
}

export const OFF_AT = [10, 60, 180] as const;
export const TIP_LAGS = [1, 4, 16] as const;
export const ANCHOR_LAGS = [16, 64] as const;

const median = (xs: readonly number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

/** E30 over one parameter set: every preset, `seeds` seeds. */
export function radioWalk(
  name: string,
  params: RadioParams,
  seeds = SEEDS,
  hours = HOURS,
): RadioWalk {
  const runs = PRESETS.flatMap((preset) =>
    range(seeds).map((seed) => radioRun(preset, seed + 1, params, hours)),
  );
  const minutes = hours * 60;
  const offAt = (run: RadioRun, at: number) => {
    const i = run.sectionMinutes.findIndex((m) => m >= at);
    const { anchor, home } = run.radios[i === -1 ? run.radios.length - 1 : i]!;
    return distance(anchor, home);
  };
  const perAxis = (lags: readonly number[], of: (axis: Axis, radio: Radio) => number) =>
    Object.fromEntries(
      AXIS_NAMES.map((axis) => [
        axis,
        lags.map((lag) =>
          autocorrelation(
            runs.map((run) => run.radios.map((radio) => of(axis, radio))),
            lag,
          ),
        ),
      ]),
    ) as Record<Axis, number[]>;
  const changes = runs.map((run) => {
    const at: number[] = [];
    const bars: number[] = [];
    run.bars.forEach((bar, i) => {
      if (i > 0 && bar.nearest !== run.bars[i - 1]!.nearest) {
        at.push(bar.minute);
        bars.push(i);
      }
    });
    // A change undone: the next change, within a section, goes back to the preset this one left.
    const undone = bars.filter(
      (i, n) =>
        n + 1 < bars.length &&
        bars[n + 1]! - i <= SECTION_BARS &&
        run.bars[bars[n + 1]!]!.nearest === run.bars[i - 1]!.nearest,
    ).length;
    return Object.assign(at, { undone });
  });
  const limits = presetRates();
  const walking = AXIS_NAMES.filter((a) => params.tipSpread[a] > 0 || params.anchorSpread[a] > 0);
  const ends = runs.flatMap((run) =>
    run.radios.flatMap(({ tip }) =>
      walking.map((axis) => tip[axis] === AXES[axis].min || tip[axis] === AXES[axis].max),
    ),
  );
  return {
    name,
    sectionMinutes: mean(
      runs.map((run) => run.sectionMinutes.at(-1)! / (run.sectionMinutes.length - 1)),
    ),
    tipOff: mean(runs.flatMap((run) => run.radios.map(({ tip, anchor }) => distance(tip, anchor)))),
    anchorOff: OFF_AT.map((at) => mean(runs.map((run) => offAt(run, at)))),
    tipCorrelation: perAxis(
      TIP_LAGS,
      (axis, { tip, anchor }) => inSpace(axis, tip[axis]) - inSpace(axis, anchor[axis]),
    ),
    anchorCorrelation: perAxis(
      ANCHOR_LAGS,
      (axis, { anchor, home }) => inSpace(axis, anchor[axis]) - inSpace(axis, home[axis]),
    ),
    firstChange: median(changes.map((at) => at[0] ?? minutes)),
    changesPerHour: mean(changes.map((at) => at.length)) / hours,
    undone:
      changes.reduce((n, at) => n + at.undone, 0) /
      Math.max(
        1,
        changes.reduce((n, at) => n + at.length, 0),
      ),
    atHome: mean(
      runs.map((run) => mean(run.bars.map((bar) => (bar.nearest === run.preset ? 1 : 0)))),
    ),
    visited: mean(runs.map((run) => new Set(run.bars.map((bar) => bar.nearest)).size)),
    atEnd: mean(ends.map((end) => (end ? 1 : 0))),
    rateRatio: Object.fromEntries(
      AXIS_NAMES.map((axis) => [
        axis,
        Math.max(...runs.map((run) => run.fastest[axis])) / limits[axis],
      ]),
    ) as Record<Axis, number>,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = SETS.map(({ name, params }) => radioWalk(name, params));
  console.log(
    `E30: every preset tuned in at entropy 0.3, ${SEEDS} seeds, ${HOURS} hours each; time constants in sections`,
  );
  console.log(
    'set                section  tip off  anchor off at ' +
      OFF_AT.join(', ') +
      ' min   first change  changes/h  undone  at home  visited  at an end',
  );
  for (const r of results)
    console.log(
      [
        r.name.padEnd(18),
        (r.sectionMinutes * 60).toFixed(1).padStart(5) + ' s',
        r.tipOff.toFixed(3).padStart(7),
        '   ' + r.anchorOff.map((d) => d.toFixed(3)).join(' '),
        (r.firstChange.toFixed(1) + ' min').padStart(18),
        r.changesPerHour.toFixed(1).padStart(9),
        (100 * r.undone).toFixed(0).padStart(7) + '%',
        (100 * r.atHome).toFixed(0).padStart(7) + '%',
        r.visited.toFixed(1).padStart(7),
        (100 * r.atEnd).toFixed(1).padStart(9) + '%',
      ].join(''),
    );
  console.log(
    '\nautocorrelation per axis: the tip off the anchor at ' +
      TIP_LAGS.join(', ') +
      ' sections; the anchor off home at ' +
      ANCHOR_LAGS.join(', '),
  );
  for (const r of results) {
    console.log(r.name);
    for (const axis of AXIS_NAMES)
      console.log(
        '  ' +
          axis.padEnd(8) +
          r.tipCorrelation[axis].map((c) => c.toFixed(2).padStart(6)).join('') +
          '   ' +
          r.anchorCorrelation[axis].map((c) => c.toFixed(2).padStart(6)).join('') +
          '   fastest glide ' +
          r.rateRatio[axis].toFixed(2) +
          ' of a preset’s',
      );
  }
}
