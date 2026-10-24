/**
 * E45: the homeostat's controller, measured (#237, step 6; `homeostat.ts`,
 * the owner's limits of 2026-10-22).
 *
 * The band plays as E44 plays it (every member through the loop, learning
 * from an empty layer, nobody playing), and each bar, after it is played,
 * what each member played is recognised among its library and what it
 * played lately (`heardTexts`, `playedInto`, `recognisedBar` with `lately`:
 * a member's last eight texts, the harmony's last two themes, heard once a
 * section). At each section's second-to-last bar (`READ_AT`) the controller
 * reads the share over the last eight bars and leans the loop's entropy
 * (`regulated`), which the band plays at from the next bar, the one that
 * decides the next section, so the section after is planned and played at
 * it. It counts, over every preset:
 *
 * - **open** (`controlled` false): the controller reads and moves nothing,
 *   at a lean held from the start (`lean`), so a run at a lean of -e and of
 *   1 - e measures what the lean can reach (its gain);
 * - **closed** (`controlled` true): the lean as the controller moves it,
 *   by `step` a reading;
 *
 * held, or walked by the radio as E44 walks it (the walk itself at the
 * players' entropy, the band at the leaned), the share at each section's last
 * bar against the band at the players' entropy (`bandOf`), the controller's
 * reversals per four sections, how many sections a run starting leaned all
 * the way down takes to come inside, and a bar's cost.
 *
 * It runs under vitest: `E45_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/homeostat.test.ts` prints the numbers.
 */

import type { Recogniser } from '@yggi/cells/repository/recognise';
import {
  BASS_REPOSITORY,
  type BandCarried,
  type BandEnv,
  EMPTY_LAYER,
  HARMONY_REPOSITORY,
  type Homeostat,
  LEAD_REPOSITORY,
  LEAN_STEP,
  METER_REPOSITORY,
  type MeterChange,
  NO_LEAN,
  PATIENCE,
  PRESETS,
  PRESET_GLIDE,
  RADIO,
  RHYTHM_REPOSITORY,
  SECTION_BARS,
  SONG_METER,
  STRAIGHT,
  type Style,
  type StyleTrack,
  band,
  bandOf,
  clockOf,
  glideTo,
  holding,
  leanedEntropy,
  presetMode,
  presetSwing,
  regulated,
  styleAt,
  walkRadio,
  withMeter,
} from '../src/index.ts';
import {
  type BarRecognition,
  type Lately,
  NOTHING_LATELY,
  NOTHING_RECOGNISED,
  type RecognitionWindow,
  heardInto,
  heardTexts,
  playedInto,
  recognisedBar,
  shareOf,
} from '../src/recognised.ts';
import { type Over, OVERS } from './homeostat-sensor.ts';

/** The bar of a section the controller reads the share at: its second-to-last, so the bar after decides the next section at the new lean. */
export const READ_AT = SECTION_BARS - 2;

/** How a run is played: held or walked, the controller moving the lean or not, its step, and the lean it starts at. */
export interface RunOptions {
  readonly walking: boolean;
  readonly controlled: boolean;
  readonly step?: number;
  readonly patience?: number;
  /** The lean at the start; with the controller off, the lean throughout. */
  readonly lean?: number;
}

/** One run: each section's shares at its last bar, and its band, each reading's lean, the controller as it ends, each bar's cost. */
export interface RegulatedRun {
  readonly preset: string;
  readonly seed: number;
  readonly entropy: number;
  /** At each section's last bar, each share over the window (that section's bars), and whether the share over all sits inside the band at the players' entropy there. */
  readonly sections: readonly (Readonly<Record<Over, number | null>> & {
    readonly inside: boolean | null;
    readonly lean: number;
  })[];
  readonly homeostat: Homeostat;
  /** Each bar's cost of recognition, every member's together, in ms on this machine. */
  readonly cost: readonly number[];
}

/** A preset played for `bars` bars at the players' `entropy`, its loop at the leaned, each bar sensed against its library and what it played lately. */
export function regulatedRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  entropy: number,
  bars: number,
  recogniser: Recogniser,
  { walking, controlled, step = LEAN_STEP, patience = PATIENCE, lean = 0 }: RunOptions,
  now: () => number = () => performance.now(),
): RegulatedRun {
  let carried = band.initial as BandCarried;
  let players: Style = { ...preset.style, entropy };
  let track: StyleTrack = holding(players);
  let walked = 0;
  let changes: readonly MeterChange[] = [{ bar: 0, meter: SONG_METER }];
  let window: RecognitionWindow = NOTHING_RECOGNISED;
  let lately: Lately = NOTHING_LATELY;
  let homeostat: Homeostat = { ...NO_LEAN, lean };
  const sections: RegulatedRun['sections'][number][] = [];
  const cost: number[] = [];
  for (let bar = 0; bar < bars; bar++) {
    const clock = clockOf(changes);
    const section = Math.floor(bar / SECTION_BARS);
    while (walking && walked < section) {
      walked++;
      players = walkRadio(players, seed, walked, RADIO);
      track = glideTo(track, players, clock.barStart(walked * SECTION_BARS), PRESET_GLIDE);
    }
    const style = walking ? styleAt(track, clock.barStart(bar)) : players;
    const env: BandEnv = {
      seed,
      bar,
      style: { ...style, entropy: leanedEntropy(style.entropy, homeostat.lean) },
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
    // (the layer as of the bar: what the band had filed when it decided it)
    const layer = carried.plans.layer ?? undefined;
    const { carried: after, output } = band.advance(env, carried, null);
    carried = after;
    changes = withMeter(changes, bar, output.meter);
    const bench = { meter: output.plan.meter, meterFragment: output.plan.meterFragment };
    const texts = heardTexts(output);
    const at = now();
    const recognition: BarRecognition = recognisedBar(recogniser, texts, bench, layer, 0, lately);
    cost.push(now() - at);
    lately = playedInto(lately, texts);
    window = heardInto(window, recognition);
    const share = shareOf(window);
    if (bar % SECTION_BARS === READ_AT && controlled)
      homeostat = regulated(homeostat, share, style.entropy, step, patience);
    if (bar % SECTION_BARS === SECTION_BARS - 1) {
      const { low, high } = bandOf(style.entropy);
      sections.push({
        ...(Object.fromEntries(
          OVERS.map((over) => [over, shareOf(window, over === 'all' ? undefined : over)]),
        ) as Record<Over, number | null>),
        inside: share === null ? null : share >= low && share <= high,
        lean: homeostat.lean,
      });
    }
  }
  return { preset: preset.name, seed, entropy, sections, homeostat, cost };
}

/**
 * Every preset, `seeds` seeds of `bars` bars at the players' `entropy`, played as `options` say, each run with a
 * recogniser of its own (`recogniser`), since one keeps every text it reads and a run reads new ones every bar.
 */
export const regulatedRuns = (
  entropy: number,
  seeds: number,
  bars: number,
  recogniser: () => Recogniser,
  options: RunOptions,
): RegulatedRun[] =>
  PRESETS.flatMap((preset, p) =>
    [...Array(seeds).keys()].map((seed) =>
      regulatedRun(preset, p * seeds + seed + 1, entropy, bars, recogniser(), options),
    ),
  );

/** The share of these runs' sections inside the band at the players' entropy, from section `from` on. */
export function insideOf(runs: readonly RegulatedRun[], from = 0): number {
  const read = runs.flatMap((r) =>
    r.sections.slice(from).flatMap((s) => (s.inside === null ? [] : [s.inside])),
  );
  return read.filter(Boolean).length / read.length;
}

/** The controller's reversals per four sections, over these runs, and the most of any run. */
export function reversalsOf(runs: readonly RegulatedRun[]): {
  readonly mean: number;
  readonly most: number;
} {
  const per = runs.map((r) => (4 * r.homeostat.reversals) / r.sections.length);
  return { mean: per.reduce((a, b) => a + b, 0) / per.length, most: Math.max(...per) };
}

/**
 * How many sections each run took to come inside the band, counted from its first (whose window is its first eight
 * bars); null for a run that never came inside.
 */
export const cameInside = (runs: readonly RegulatedRun[]): (number | null)[] =>
  runs.map((r) => {
    const at = r.sections.findIndex((s) => s.inside === true);
    return at < 0 ? null : at + 1;
  });

/** A bar's cost over these runs, in ms: p95 and the most. */
export function costOf(runs: readonly RegulatedRun[]): {
  readonly p95: number;
  readonly max: number;
} {
  const sorted = runs.flatMap((r) => r.cost).sort((a, b) => a - b);
  return { p95: sorted[Math.floor(sorted.length * 0.95)] ?? NaN, max: sorted.at(-1) ?? NaN };
}
