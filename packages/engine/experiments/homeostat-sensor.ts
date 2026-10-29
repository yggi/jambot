/**
 * E44: the homeostat's sensor, measured (#237, step 6's first part;
 * `recognised.ts`, cells' recogniser, yggi/cells decision 055).
 *
 * The band plays every member through the loop of `facet.ts` (cells'
 * meters, rhythms, bass lines and harmonies, the lead lines, learning from
 * an empty layer, nobody playing), and each bar, after it is played, what
 * each member played is stated as cells text (`barTexts`) and recognised
 * among the member's library as of that bar (`recognisedBar`: cells' seeds
 * and the layer's filings of its facet, exactly or by one of the composer's
 * operators). It counts, over every preset:
 *
 * - **held** (`sensedRun` with `walking` false): the preset held at an
 *   entropy, its meter's swing, as `bass-loop.ts` holds it;
 * - **walked** (`walking` true): the radio tuned in at the preset at an
 *   entropy, as E37 to E43 walk it (`rhythm-radio.ts`), each section's style
 *   glided to over `PRESET_GLIDE`, played straight;
 *
 * the share of bars recognised over the last `SHARE_BARS` at each section's
 * last bar (`shareOf`, whose window is then the section's eight bars), per
 * member and over all members (`sectionShares`), where it sits against the
 * ruled band (`BAND`: 0.4 to 0.7 at entropy 0.3, `against`), and what a
 * recognition costs a bar on the warmed recogniser (`costOf`: each member's,
 * and the bar's, every member's together).
 *
 * The band's events are untouched: the sensor reads a bar after it is
 * played and gives the band nothing (`homeostat-sensor.test.ts` sets every
 * event of a run beside the same run unsensed).
 *
 * It runs under vitest: `E44_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/homeostat-sensor.test.ts` prints the numbers.
 */

import { type Recogniser, createRecogniser } from '@yggi/cells/repository/recognise';
import {
  presetMode,
  BASS_REPOSITORY,
  type BandBar,
  type BandCarried,
  type BandEnv,
  EMPTY_LAYER,
  HARMONY_REPOSITORY,
  LEAD_REPOSITORY,
  METER_REPOSITORY,
  PROTOTYPE_PRESETS,
  PRESET_GLIDE,
  RADIO,
  RHYTHM_BENCHES,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  STRAIGHT,
  type Style,
  type StyleTrack,
  band,
  clockOf,
  glideTo,
  holding,
  presetSwing,
  styleAt,
  walkRadio,
  withMeter,
  SONG_METER,
  type MeterChange,
} from '../src/index.ts';
import {
  type BarRecognition,
  LOOP_FACETS,
  type LoopFacet,
  NOTHING_RECOGNISED,
  type RecognitionWindow,
  barTexts,
  heardInto,
  libraryOf,
  recogniseOptionsOf,
  recognisedBar,
  shareOf,
} from '../src/recognised.ts';

/** The band the share is kept in at entropy 0.3 (the owner's ruling, #237, 2026-10-22). */
export const BAND = { low: 0.4, high: 0.7 } as const;

/** A member's share, or the share over all members. */
export type Over = LoopFacet | 'all';

/** Every share counted: each member's and over all of them. */
export const OVERS: readonly Over[] = [...LOOP_FACETS, 'all'];

/** One run: each bar's recognition, the window's shares at each section's end, each bar's cost, and the bar's events. */
export interface SensedRun {
  readonly preset: string;
  readonly seed: number;
  readonly entropy: number;
  readonly walking: boolean;
  /** Each bar's recognition, in order. */
  readonly bars: readonly BarRecognition[];
  /** At each section's last bar, each share over the window (that section's bars); null where none played. */
  readonly sections: readonly Readonly<Record<Over, number | null>>[];
  /**
   * Each bar's cost of recognition, every member's together, and each member's, in ms on this machine; `fresh` where
   * the layer filed a fragment since the bar before, which the recogniser reads for the first time there.
   */
  readonly cost: readonly {
    readonly bar: number;
    readonly facets: Partial<Record<LoopFacet, number>>;
    readonly fresh: boolean;
  }[];
  /** Every event the band played, a line each (`bar step note velocity length part`), where `events` was asked for. */
  readonly events: readonly string[];
}

/** A bar's events as the band plays them, a line each. */
const eventsOf = (bar: BandBar) =>
  bar.dough.map((n) => `${bar.bar} ${n.step} ${n.note} ${n.velocity} ${n.length} ${n.part}`);

/**
 * A preset played for `bars` bars at `entropy`, held or with the radio walking, every member through the loop,
 * learning from an empty layer; each bar sensed with `recogniser` where one is given (else nothing sensed), its
 * events kept where `events`.
 */
export function sensedRun(
  preset: (typeof PROTOTYPE_PRESETS)[number],
  seed: number,
  entropy: number,
  bars: number,
  walking: boolean,
  recogniser: Recogniser | null,
  events = false,
  tolerance = 0,
  now: () => number = () => performance.now(),
): SensedRun {
  let carried = band.initial as BandCarried;
  let style: Style = { ...preset.style, entropy };
  let track: StyleTrack = holding(style);
  let walked = 0;
  let changes: readonly MeterChange[] = [{ bar: 0, meter: SONG_METER }];
  let window: RecognitionWindow = NOTHING_RECOGNISED;
  const heard: BarRecognition[] = [];
  const sections: Record<Over, number | null>[] = [];
  const cost: { bar: number; facets: Partial<Record<LoopFacet, number>>; fresh: boolean }[] = [];
  const played: string[] = [];
  let filed = 0;
  for (let bar = 0; bar < bars; bar++) {
    const clock = clockOf(changes);
    const section = Math.floor(bar / SECTION_BARS);
    while (walking && walked < section) {
      walked++;
      style = walkRadio(style, seed, walked, RADIO);
      track = glideTo(track, style, clock.barStart(walked * SECTION_BARS), PRESET_GLIDE);
    }
    const env: BandEnv = {
      seed,
      bar,
      style: walking ? styleAt(track, clock.barStart(bar)) : style,
      wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
      swing: walking ? STRAIGHT : presetSwing(preset)!,
      repository: METER_REPOSITORY,
      rhythms: RHYTHM_REPOSITORY,
      layer: EMPTY_LAYER,
      offer: null,
      bassLines: BASS_REPOSITORY,
      leads: LEAD_REPOSITORY,
      harmonies: HARMONY_REPOSITORY,
    };
    // (the layer as of the bar: what the band had filed when it decided it, before the bar's own section is filed)
    const layer = carried.plans.layer ?? undefined;
    const { carried: after, output } = band.advance(env, carried, null);
    carried = after;
    changes = withMeter(changes, bar, output.meter);
    if (events) played.push(...eventsOf(output));
    if (!recogniser) continue;
    const bench = { meter: output.plan.meter, meterFragment: output.plan.meterFragment };
    const texts = barTexts(output);
    const recognition: Partial<Record<LoopFacet, boolean>> = {};
    const facets: Partial<Record<LoopFacet, number>> = {};
    for (const facet of LOOP_FACETS) {
      const text = texts[facet];
      if (text === undefined) continue;
      const at = now();
      Object.assign(
        recognition,
        recognisedBar(recogniser, { [facet]: text }, bench, layer, tolerance),
      );
      facets[facet] = now() - at;
    }
    heard.push(recognition);
    const fresh = (layer?.filed.length ?? 0) !== filed;
    filed = layer?.filed.length ?? 0;
    cost.push({ bar: Object.values(facets).reduce((a, b) => a + b, 0), facets, fresh });
    window = heardInto(window, recognition);
    if (bar % SECTION_BARS === SECTION_BARS - 1)
      sections.push(
        Object.fromEntries(
          OVERS.map((over) => [over, shareOf(window, over === 'all' ? undefined : over)]),
        ) as Record<Over, number | null>,
      );
  }
  return {
    preset: preset.name,
    seed,
    entropy,
    walking,
    bars: heard,
    sections,
    cost,
    events: played,
  };
}

/**
 * A recogniser warmed on every member's seeds as `recognisedBar` reads them on each named meter's bench, as a page
 * warms it at idle, on every bench a section can ask on (`RHYTHM_BENCHES`): each fragment's readings and variations
 * kept, so a bar compiles only its heard text.
 */
export function warmedRecogniser(): Recogniser {
  const recogniser = createRecogniser();
  for (const facet of LOOP_FACETS) {
    const library = libraryOf(facet);
    for (const bench of RHYTHM_BENCHES) {
      const options = recogniseOptionsOf(facet, bench);
      if (options) for (const f of library) recogniser.recognise(f.text, library, options);
    }
  }
  return recogniser;
}

/** Every preset, `seeds` seeds of `bars` bars at `entropy`, held or walked, sensed by one warmed recogniser. */
export const sensedRuns = (
  entropy: number,
  walking: boolean,
  seeds: number,
  bars: number,
  recogniser: Recogniser = warmedRecogniser(),
  tolerance = 0,
): SensedRun[] =>
  PROTOTYPE_PRESETS.flatMap((preset, p) =>
    [...Array(seeds).keys()].map((seed) =>
      sensedRun(preset, p * seeds + seed + 1, entropy, bars, walking, recogniser, false, tolerance),
    ),
  );

/** A share's sections over runs: where they sit against the band, and their spread. */
export interface Against {
  /** The sections with a share (those the member played in). */
  readonly sections: number;
  readonly mean: number;
  /** The standard deviation of the sections' shares. */
  readonly spread: number;
  /** The shares at the 10th and 90th percentiles. */
  readonly p10: number;
  readonly p90: number;
  /** The share of sections below the band, inside it and above it. */
  readonly below: number;
  readonly inside: number;
  readonly above: number;
  /** The share of sections at exactly 0 or exactly 1: where the share is pinned. */
  readonly pinned: number;
}

/** Where the sections' shares (`over`) of these runs sit against `band`, pooled. */
export function against(
  runs: readonly Pick<SensedRun, 'sections'>[],
  over: Over,
  band: { readonly low: number; readonly high: number } = BAND,
): Against {
  const shares = runs
    .flatMap((r) => r.sections.map((s) => s[over]))
    .filter((s): s is number => s !== null)
    .sort((a, b) => a - b);
  const n = shares.length;
  if (!n)
    return {
      sections: 0,
      mean: NaN,
      spread: NaN,
      p10: NaN,
      p90: NaN,
      below: NaN,
      inside: NaN,
      above: NaN,
      pinned: NaN,
    };
  const mean = shares.reduce((a, b) => a + b, 0) / n;
  const share = (f: (s: number) => boolean) => shares.filter(f).length / n;
  return {
    sections: n,
    mean,
    spread: Math.sqrt(shares.reduce((a, s) => a + (s - mean) ** 2, 0) / n),
    p10: shares[Math.floor(n * 0.1)]!,
    p90: shares[Math.min(n - 1, Math.floor(n * 0.9))]!,
    below: share((s) => s < band.low),
    inside: share((s) => s >= band.low && s <= band.high),
    above: share((s) => s > band.high),
    pinned: share((s) => s === 0 || s === 1),
  };
}

/**
 * What a recognition costs a bar over these runs, in ms: the bar's (every member's together) and each member's, p95
 * and max; and the bar's over the bars with no fragment filed since the bar before (`warm`), which a page warms after
 * filing (#412).
 */
export function costOf(
  runs: readonly SensedRun[],
): Record<LoopFacet | 'bar' | 'warm', { readonly p95: number; readonly max: number }> {
  const stat = (xs: number[]) => {
    const sorted = xs.toSorted((a, b) => a - b);
    return { p95: sorted[Math.floor(sorted.length * 0.95)] ?? NaN, max: sorted.at(-1) ?? NaN };
  };
  const all = runs.flatMap((r) => r.cost);
  return {
    bar: stat(all.map((c) => c.bar)),
    warm: stat(all.filter((c) => !c.fresh).map((c) => c.bar)),
    ...(Object.fromEntries(
      LOOP_FACETS.map((f) => [
        f,
        stat(all.flatMap((c) => (c.facets[f] === undefined ? [] : [c.facets[f]]))),
      ]),
    ) as Record<LoopFacet, { p95: number; max: number }>),
  };
}

/** Each preset's mean share over its runs' sections (`over`), and its sections inside the band. */
export const byPreset = (runs: readonly SensedRun[], over: Over): Record<string, Against> =>
  Object.fromEntries(
    PROTOTYPE_PRESETS.map(({ name }) => [
      name,
      against(
        runs.filter((r) => r.preset === name),
        over,
      ),
    ]),
  );
