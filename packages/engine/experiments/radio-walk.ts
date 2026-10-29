/**
 * E30: the radio's walk over hours of music (#313).
 *
 * The radio (`radio.ts`) is tuned in at each preset's point, with the energy
 * and the entropy of a setting in place of the preset's, and walks on its own
 * for `HOURS` hours of music, each section's style glided to over
 * `PRESET_GLIDE` from the section's first step, as a preset is. A section
 * lasts 8 bars of 4/4 at the tempo each bar starts at. The settings are a
 * grid of entropy (the walk's variance) by the energy the station starts at,
 * which then walks, and three where energy is held instead. Per setting, over
 * every preset and `SEEDS` seeds:
 *
 * - the tempo's path: the range each run spans (its highest over its lowest),
 *   how far it moves in 10 minutes and in an hour (the root mean square of
 *   the change in log tempo, as a share), the largest change in a section,
 *   where it ends after the hours walked, and how much of the time it plays
 *   within 2 % of an end of its axis;
 * - per axis, how far the style has walked from where it was tuned in after
 *   10 minutes, 1 hour and 3 (root mean square; tempo on its unit scale);
 * - the nearest preset (`nearestPreset`) of the
 *   style played at each bar's start: the minutes until it first changes,
 *   how often it changes an hour, the share of changes undone within a
 *   section (a walk along a border between two presets), the share of time
 *   it is the preset tuned in at, and how many presets are nearest some time;
 * - the fastest each axis glides against the fastest a preset glide moves it.
 *
 * And, apart, entropy walking under its own temperature (`entropyWalks`),
 * which the radio does not do: where it is after 3, 12 and 48 hours.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/radio-walk.ts
 */

import { fileURLToPath } from 'node:url';
import {
  AXES,
  HISTORY_DECAY,
  AXIS_NAMES,
  type Axis,
  PROTOTYPE_PRESETS,
  PRESET_GLIDE,
  RADIO,
  type RadioParams,
  SECTION_BARS,
  type Style,
  type StyleTrack,
  barStart,
  bpmUnit,
  glideTo,
  holding,
  nearestPreset,
  rateAt,
  styleAt,
  timeConstant,
  walkRadio,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const rms = (xs: readonly number[]) => Math.sqrt(mean(xs.map((x) => x * x)));
const median = (xs: readonly number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

export const HOURS = 3;
export const SEEDS = 5;
const SECTION_STEPS = barStart(SECTION_BARS);
/** The minutes at which the distance walked is read. */
export const WALKED_AT = [10, 60, 180] as const;

/** A setting the owner chooses among: the station's temperature. */
export interface Setting {
  readonly name: string;
  readonly entropy: number;
  /** The energy the station is tuned in at. */
  readonly energy: number;
  /** Whether energy walks (the default) or holds where it was tuned in. */
  readonly energyWalks: boolean;
}

const setting = (entropy: number, energy: number, energyWalks = true): Setting => ({
  name: `entropy ${entropy}, energy ${energy}${energyWalks ? '' : ' held'}`,
  entropy,
  energy,
  energyWalks,
});

/** The settings compared: entropy by the energy tuned in at, energy walking; then energy held. */
export const SETTINGS: readonly Setting[] = [
  ...[0.15, 0.3, 0.6, 1].flatMap((entropy) => [0.2, 0.5, 0.8].map((e) => setting(entropy, e))),
  ...[0.2, 0.5, 0.8].map((e) => setting(0.3, e, false)),
];

const paramsOf = ({ energyWalks }: Setting): RadioParams =>
  energyWalks ? RADIO : { ...RADIO, step: { ...RADIO.step, energy: 0 } };

const nearest = nearestPreset;

/** One run: each section's style and the minute it starts at, and each bar's nearest preset and minute. */
export interface RadioRun {
  readonly preset: string;
  readonly styles: readonly Style[];
  readonly sectionMinutes: readonly number[];
  readonly bars: readonly { readonly minute: number; readonly nearest: string }[];
  /** The fastest each axis glides, per step, in its space. */
  readonly fastest: Readonly<Record<Axis, number>>;
}

/** The radio tuned in at a preset under a setting, left alone for `hours` hours of music. */
export function radioRun(
  preset: (typeof PROTOTYPE_PRESETS)[number],
  seed: number,
  tuned: Setting,
  hours = HOURS,
): RadioRun {
  const params = paramsOf(tuned);
  let style: Style = { ...preset.style, energy: tuned.energy, entropy: tuned.entropy };
  let track: StyleTrack = holding(style);
  const styles: Style[] = [];
  const sectionMinutes: number[] = [];
  const bars: { minute: number; nearest: string }[] = [];
  const fastest = Object.fromEntries(AXIS_NAMES.map((a) => [a, 0])) as Record<Axis, number>;
  let minute = 0;
  for (let section = 0; minute < hours * 60; section++) {
    if (section > 0) style = walkRadio(style, seed, section, params);
    styles.push(style);
    sectionMinutes.push(minute);
    const start = section * SECTION_STEPS;
    track = glideTo(track, style, start, PRESET_GLIDE);
    for (let step = 0; step < SECTION_STEPS; step++)
      for (const axis of AXIS_NAMES)
        fastest[axis] = Math.max(fastest[axis], Math.abs(rateAt(axis, track[axis], start + step)));
    for (const bar of range(SECTION_BARS)) {
      const played = styleAt(track, start + barStart(bar));
      bars.push({ minute, nearest: nearest(played) });
      // A bar of 4/4 is 4 beats, at `bpm` beats a minute.
      minute += 4 / played.bpm;
    }
  }
  return { preset: preset.name, styles, sectionMinutes, bars, fastest };
}

/** The fastest a preset glide moves each axis: the presets farthest apart, from rest; entropy across its axis. */
export function presetRates(): Record<Axis, number> {
  return Object.fromEntries(
    AXIS_NAMES.map((axis) => {
      const values = axis === 'entropy' ? [0, 1] : PROTOTYPE_PRESETS.map((p) => p.style[axis]);
      const track = glideTo(
        holding({ ...PROTOTYPE_PRESETS[0]!.style, entropy: 0, [axis]: Math.min(...values) }),
        { [axis]: Math.max(...values) },
        0,
        PRESET_GLIDE,
      );
      return [axis, Math.max(...range(PRESET_GLIDE).map((p) => rateAt(axis, track[axis], p)))];
    }),
  ) as Record<Axis, number>;
}

/** What E30 measures of one setting. */
export interface RadioWalk {
  readonly setting: Setting;
  /** Seconds a section lasts, on average. */
  readonly sectionSeconds: number;
  /** The tempo's range in a run, its highest over its lowest, less 1: the median over runs. */
  readonly tempoRange: number;
  /** The tempo's change in 10 minutes and in an hour, as a share (root mean square of the log). */
  readonly tempoMoves: readonly [number, number];
  /** The largest change of tempo in a section, as a share. */
  readonly tempoStep: number;
  /** The tempo at the end of the hours walked: the 10th, 50th and 90th percentile over runs, in bpm. */
  readonly tempoEnd: readonly [number, number, number];
  /** The share of sections whose tempo is within 2 % of an end of its axis. */
  readonly tempoAtEnd: number;
  /** Per axis: how far the style is from where it was tuned in at each of `WALKED_AT` minutes (root mean square; tempo on its unit scale). */
  readonly walked: Readonly<Record<Axis, readonly number[]>>;
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
  /** Per axis: the fastest glide against the fastest preset glide. */
  readonly rateRatio: Readonly<Record<Axis, number>>;
}

/** E30 over one setting: every preset, `seeds` seeds. */
export function radioWalk(tuned: Setting, seeds = SEEDS, hours = HOURS): RadioWalk {
  // Each run its own seeds: the presets' runs share no draws.
  const runs = PROTOTYPE_PRESETS.flatMap((preset, p) =>
    range(seeds).map((seed) => radioRun(preset, p * seeds + seed + 1, tuned, hours)),
  );
  const minutes = hours * 60;
  const sectionAt = (run: RadioRun, at: number) => {
    const i = run.sectionMinutes.findIndex((m) => m >= at);
    return i === -1 ? run.styles.length - 1 : i;
  };
  const logBpm = (run: RadioRun) => run.styles.map((s) => Math.log(s.bpm));
  /** The root mean square change of log tempo over windows of `span` minutes, as a share. */
  const tempoOver = (span: number) => {
    const changes = runs.flatMap((run) => {
      const logs = logBpm(run);
      return range(Math.floor(minutes / span)).map(
        (w) => logs[sectionAt(run, (w + 1) * span)]! - logs[sectionAt(run, w * span)]!,
      );
    });
    return Math.exp(rms(changes)) - 1;
  };
  const ends = runs.map((run) => run.styles.at(-1)!.bpm).sort((a, b) => a - b);
  const percentile = (p: number) => ends[Math.min(ends.length - 1, Math.floor(p * ends.length))]!;
  const { min, max } = AXES.bpm;
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
  const unit = (axis: Axis, x: number) => (axis === 'bpm' ? bpmUnit(x) : x);
  return {
    setting: tuned,
    sectionSeconds:
      60 * mean(runs.map((run) => run.sectionMinutes.at(-1)! / (run.sectionMinutes.length - 1))),
    tempoRange: median(
      runs.map((run) => {
        const bpms = run.styles.map((s) => s.bpm);
        return Math.max(...bpms) / Math.min(...bpms) - 1;
      }),
    ),
    tempoMoves: [tempoOver(10), tempoOver(60)],
    tempoStep:
      Math.exp(
        Math.max(
          ...runs.flatMap((run) => {
            const logs = logBpm(run);
            return logs.slice(1).map((x, i) => Math.abs(x - logs[i]!));
          }),
        ),
      ) - 1,
    tempoEnd: [percentile(0.1), percentile(0.5), percentile(0.9)],
    tempoAtEnd: mean(
      runs.flatMap((run) =>
        run.styles.map((s) => (s.bpm < min * 1.02 || s.bpm > max / 1.02 ? 1 : 0)),
      ),
    ),
    walked: Object.fromEntries(
      AXIS_NAMES.map((axis) => [
        axis,
        WALKED_AT.map((at) =>
          rms(
            runs.map(
              (run) =>
                unit(axis, run.styles[sectionAt(run, at)]![axis]) -
                unit(axis, run.styles[0]![axis]),
            ),
          ),
        ),
      ]),
    ) as Record<Axis, number[]>,
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
    rateRatio: Object.fromEntries(
      AXIS_NAMES.map((axis) => [
        axis,
        Math.max(...runs.map((run) => run.fastest[axis])) / limits[axis],
      ]),
    ) as Record<Axis, number>,
  };
}

/** The style's loop with nobody in it (#210, A4) at one entropy: its time constant, gain and bound. */
export interface StyleLoop {
  readonly entropy: number;
  /** Per axis: the sections it remembers itself for, `timeConstant` of its correlation a section later. */
  readonly sections: Readonly<Record<Axis, number>>;
  /** Per unit axis: the same, from the reflected walk's slowest mode, 2 / (π² σ²) for a step of spread σ. */
  readonly slowestMode: Readonly<Record<Axis, number>>;
  /** The gain: the mean step against the distance from the axis's middle, inside its middle half, pooled over the unit axes (a pull of 1/τ reads −1/τ). */
  readonly pull: number;
  /** The pull's standard error. */
  readonly pullError: number;
  /** Per axis: the largest step over the step the entropy allows (the tempo's lean added). */
  readonly largestStep: Readonly<Record<Axis, number>>;
  /** The share of values on an end of their axis, after the one tuned in at. */
  readonly atEnd: number;
}

/** The style's loop measured over `seeds` walks of `sections` sections, tuned in at the first preset, energy walking. */
export function styleLoop(entropy: number, seeds = 4, sections = 100_000): StyleLoop {
  const walking = AXIS_NAMES.filter((a) => RADIO.step[a] > 0);
  const unitAxes = walking.filter((a) => AXES[a].space === 'linear');
  const walks = range(seeds).map((seed) => {
    const styles: Style[] = [{ ...PROTOTYPE_PRESETS[0]!.style, entropy }];
    for (let section = 1; section < sections; section++)
      styles.push(walkRadio(styles.at(-1)!, seed + 1, section));
    return styles;
  });
  const inSpace = (axis: Axis, x: number) => (AXES[axis].space === 'log' ? Math.log(x) : x);
  const lagOne = (axis: Axis) => {
    const m = mean(walks.flatMap((w) => w.map((s) => inSpace(axis, s[axis]))));
    let together = 0;
    let alone = 0;
    for (const w of walks)
      for (let i = 0; i < w.length; i++) {
        const x = inSpace(axis, w[i]![axis]) - m;
        alone += x * x;
        if (i > 0) together += x * (inSpace(axis, w[i - 1]![axis]) - m);
      }
    return together / alone;
  };
  // The pull: a least-squares slope of each step on where it starts, inside the middle half.
  const pairs = unitAxes.flatMap((axis) =>
    walks.flatMap((w) =>
      w
        .slice(1)
        .map((s, i) => [w[i]![axis] - 0.5, s[axis] - w[i]![axis]] as const)
        .filter(([at]) => Math.abs(at) <= 0.25),
    ),
  );
  const mx = mean(pairs.map(([x]) => x));
  const my = mean(pairs.map(([, y]) => y));
  const sxx = pairs.reduce((n, [x]) => n + (x - mx) ** 2, 0);
  const pull = pairs.reduce((n, [x, y]) => n + (x - mx) * (y - my), 0) / sxx;
  const residual = pairs.reduce((n, [x, y]) => n + (y - my - pull * (x - mx)) ** 2, 0);
  const allowed = (axis: Axis) =>
    RADIO.step[axis] * entropy + (axis === 'bpm' ? RADIO.tempoLean : 0);
  return {
    entropy,
    sections: Object.fromEntries(
      walking.map((axis) => [axis, timeConstant(lagOne(axis))]),
    ) as Record<Axis, number>,
    slowestMode: Object.fromEntries(
      unitAxes.map((axis) => [axis, 2 / ((Math.PI ** 2 * (RADIO.step[axis] * entropy) ** 2) / 3)]),
    ) as Record<Axis, number>,
    pull,
    pullError: Math.sqrt(residual / (pairs.length - 2) / sxx),
    largestStep: Object.fromEntries(
      walking.map((axis) => [
        axis,
        walks.reduce(
          (most, w) =>
            w.reduce(
              (m, s, i) =>
                i === 0
                  ? m
                  : Math.max(m, Math.abs(inSpace(axis, s[axis]) - inSpace(axis, w[i - 1]![axis]))),
              most,
            ),
          0,
        ) / allowed(axis),
      ]),
    ) as Record<Axis, number>,
    atEnd: mean(
      walks.flatMap((w) =>
        w
          .slice(1)
          .flatMap((s) =>
            walking.map((axis) =>
              s[axis] === AXES[axis].min || s[axis] === AXES[axis].max ? 1 : 0,
            ),
          ),
      ),
    ),
  };
}

/** The entropies the style's loop is measured at. */
export const LOOP_ENTROPIES = [0.15, 0.3, 0.6, 1] as const;

/**
 * Entropy walking under its own temperature, as the other axes do (a step of
 * 0.06, scaled by itself), from 0.3: its 10th, 50th and 90th percentile
 * after each of `hours`, over `seeds` seeds. A step scaled by the value it
 * moves is a multiplicative walk, so it creeps toward 0 and freezes there.
 */
export function entropyWalks(
  hours: readonly number[] = [3, 12, 48],
  seeds = 100,
): { hours: number; entropy: readonly [number, number, number] }[] {
  const params: RadioParams = { ...RADIO, step: { ...RADIO.step, entropy: 0.06 } };
  const from: Style = { ...PROTOTYPE_PRESETS[0]!.style, entropy: 0.3 };
  const styles = range(seeds).map(() => from);
  const out: { hours: number; entropy: readonly [number, number, number] }[] = [];
  let section = 0;
  for (const until of hours) {
    // A section at about 113 bpm, the middle the walk wanders around, lasts 17 s.
    for (; section < (until * 3600) / 17; section++)
      for (const seed of range(seeds))
        styles[seed] = walkRadio(styles[seed]!, seed + 1, section + 1, params);
    const sorted = styles.map((s) => s.entropy).sort((a, b) => a - b);
    const at = (p: number) => sorted[Math.floor(p * seeds)]!;
    out.push({ hours: until, entropy: [at(0.1), at(0.5), at(0.9)] });
  }
  return out;
}

const percent = (x: number, digits = 1) => (100 * x).toFixed(digits) + ' %';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = SETTINGS.map((tuned) => radioWalk(tuned));
  console.log(
    `E30: every preset tuned in at each setting, ${SEEDS} seeds, ${HOURS} hours each; ` +
      `a section lasts ${results[0]!.sectionSeconds.toFixed(1)} s on average`,
  );
  console.log(
    '\nsetting                        tempo: range  10 min   1 h   largest/section  ends at (10/50/90 %)  near an end' +
      '   nearest preset: first change  changes/h  undone  at home  visited',
  );
  for (const r of results)
    console.log(
      [
        r.setting.name.padEnd(30),
        percent(r.tempoRange, 0).padStart(13),
        percent(r.tempoMoves[0]).padStart(8),
        percent(r.tempoMoves[1]).padStart(7),
        percent(r.tempoStep, 2).padStart(17),
        r.tempoEnd
          .map((b) => b.toFixed(0))
          .join('/')
          .padStart(22),
        percent(r.tempoAtEnd, 0).padStart(13),
        (r.firstChange.toFixed(1) + ' min').padStart(32),
        r.changesPerHour.toFixed(1).padStart(11),
        percent(r.undone, 0).padStart(8),
        percent(r.atHome, 0).padStart(9),
        r.visited.toFixed(1).padStart(9),
      ].join(''),
    );
  console.log(
    `\ndistance walked from where it was tuned in, per axis, after ${WALKED_AT.join(', ')} minutes ` +
      '(root mean square; tempo on its unit scale), and the fastest glide against a preset’s',
  );
  for (const r of results.filter((r) => r.setting.energy === 0.5 && r.setting.energyWalks)) {
    console.log(r.setting.name);
    for (const axis of AXIS_NAMES.filter((a) => RADIO.step[a] > 0))
      console.log(
        '  ' +
          axis.padEnd(8) +
          r.walked[axis].map((d) => d.toFixed(3).padStart(7)).join('') +
          '   fastest glide ' +
          r.rateRatio[axis].toFixed(2) +
          ' of a preset’s',
      );
  }
  const keyBars = timeConstant(HISTORY_DECAY);
  console.log(
    `\nthe style's loop, 4 walks of 100,000 sections each: its time constant in sections (by the slowest mode), ` +
      `in hours at ${results[0]!.sectionSeconds.toFixed(1)} s a section, and against the key loop's ${keyBars.toFixed(2)} bars; ` +
      'its gain (the pull a section, ± its error); its bound (the largest step over the step allowed; the share on an end)',
  );
  for (const entropy of LOOP_ENTROPIES) {
    const loop = styleLoop(entropy);
    console.log(
      `entropy ${entropy}: pull ${loop.pull.toExponential(1)} ± ${loop.pullError.toExponential(1)} a section, ` +
        `on an end ${percent(loop.atEnd, 2)}`,
    );
    for (const axis of AXIS_NAMES.filter((a) => RADIO.step[a] > 0)) {
      const sections = loop.sections[axis];
      const mode = loop.slowestMode[axis];
      console.log(
        '  ' +
          axis.padEnd(8) +
          sections.toFixed(0).padStart(7) +
          (mode === undefined ? '' : ` (${mode.toFixed(0)})`).padEnd(9) +
          ((sections * results[0]!.sectionSeconds) / 3600).toFixed(1).padStart(6) +
          ' h' +
          ((sections * SECTION_BARS) / keyBars).toFixed(0).padStart(7) +
          ' × the key’s   largest step ' +
          loop.largestStep[axis].toFixed(3),
      );
    }
  }
  console.log(
    '\nentropy walking under its own temperature (a step of 0.06), from 0.3: 10th, 50th and 90th percentile',
  );
  for (const { hours, entropy } of entropyWalks())
    console.log(`  after ${hours} h: ${entropy.map((e) => e.toFixed(3)).join(' ')}`);
}
