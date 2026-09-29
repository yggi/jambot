/**
 * E19: the key's loop, measured (#210 step 3, A4, C9, Q11).
 *
 * The key is the one level with all five arrows of #210's loop: the style
 * holds a reach (`harmonicReach`) and a chance to move (`KEY_JUMP` times
 * the entropy), the band fills it with chords, `foldBar` reads them as
 * pitch-class weights, the history fades by `HISTORY_DECAY` a bar, and two
 * leans read it: the home the players' licence counts from (`centre`), and
 * the band's own drift (`bandWish`), a draw by weight to the fourth power.
 *
 * The band is left alone, the players wishing only for its preset's mode,
 * over every preset, at several entropies, seeds and sections. Per preset:
 *
 * - the jumps: how often the band moves its own key at a section boundary,
 *   how far, in fifths, and how often back to the key the jump before left;
 * - the home's lag: at a jump, the bars into the new section before the
 *   home is the band's new key, and the share of jumps it isn't by the
 *   section's end;
 * - the home's error: the share of bars whose home is not the key playing;
 * - the drift: how far the key is from the opening key, in fifths, after a
 *   number of sections, and the share of runs back on it.
 *
 * The time constant is derived, not measured: `timeConstant(HISTORY_DECAY)`,
 * about 6.7 bars, against a section's 8.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/key-loop.ts
 */

import { fileURLToPath } from 'node:url';
import {
  HISTORY_DECAY,
  NO_HISTORY,
  PRESETS,
  type Key,
  type Preset,
  SECTION_BARS,
  band,
  centre,
  fifthsApart,
  foldBar,
  harmonicReach,
  lookAhead,
  timeConstant,
} from '../src/index.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

/** One run of the band left alone: each bar's key and its home. */
export interface KeyRun {
  readonly keys: readonly Key[];
  readonly homes: readonly Key[];
}

/** The band left alone at `entropy` for `sections`, the players wishing only for the preset's mode. */
export function keyRun(preset: Preset, seed: number, entropy: number, sections: number): KeyRun {
  const style = { ...preset.style, entropy };
  const bars = lookAhead(
    band.initial,
    (bar) => ({
      seed,
      bar,
      style,
      wish: { tonic: null, mode: preset.mode, melodic: null },
      offer: null,
    }),
    sections * SECTION_BARS,
  );
  let history = NO_HISTORY;
  const homes: Key[] = [];
  for (const { plan, chords } of bars) {
    history = foldBar(history, chords);
    homes.push(centre(history, plan.key));
  }
  return { keys: bars.map(({ plan }) => plan.key), homes };
}

/** What E19 measures of a preset's runs. */
export interface KeyLoop {
  readonly preset: string;
  /** Jumps per section boundary. */
  readonly jumpRate: number;
  /** The largest jump, in fifths, and the style's reach, which bounds it. */
  readonly widestJump: number;
  readonly reach: number;
  /** The mean jump, in fifths. */
  readonly meanJump: number;
  /** The share of jumps after the first that go back to the key the jump before left. */
  readonly jumpBack: number;
  /** Bars into the section before the home is the band's new key, over the jumps it is by the section's end. */
  readonly homeLag: number;
  /** The share of jumps whose home is not the band's key by the section's end. */
  readonly homeMissed: number;
  /** The share of bars whose home is not the key playing. */
  readonly homeError: number;
  /** The mean distance from the opening key, in fifths, after each of `DRIFT_AT` sections. */
  readonly drift: readonly number[];
  /** The share of runs on the opening key after the last of `DRIFT_AT`. */
  readonly back: number;
}

/** The sections after which the drift is read. */
export const DRIFT_AT = [1, 2, 4, 8, 16, 32] as const;

/** E19 over a preset's runs: `runs` of `DRIFT_AT`'s last number of sections or more. */
export function keyLoop(preset: Preset, runs: readonly KeyRun[]): KeyLoop {
  const jumps: number[] = [];
  const lags: number[] = [];
  let missed = 0;
  let wrong = 0;
  let bars = 0;
  let later = 0;
  let backs = 0;
  for (const { keys, homes } of runs) {
    let left: Key | null = null;
    for (let bar = SECTION_BARS; bar < keys.length; bar += SECTION_BARS) {
      const [from, to] = [keys[bar - 1]!, keys[bar]!];
      if (from.tonic === to.tonic && from.mode === to.mode) continue;
      jumps.push(Math.abs(fifthsApart(to, from)));
      if (left) {
        later++;
        if (left.tonic === to.tonic) backs++;
      }
      left = from;
      const lag = range(SECTION_BARS).find((n) => homes[bar + n]!.tonic === to.tonic);
      if (lag === undefined) missed++;
      else lags.push(lag);
    }
    for (const [bar, key] of keys.entries()) {
      bars++;
      if (homes[bar]!.tonic !== key.tonic) wrong++;
    }
  }
  const apart = (run: KeyRun, sections: number) =>
    Math.abs(fifthsApart(run.keys[sections * SECTION_BARS]!, run.keys[0]!));
  const last = DRIFT_AT.at(-1)!;
  const boundaries = runs.reduce((n, run) => n + run.keys.length / SECTION_BARS - 1, 0);
  return {
    preset: preset.name,
    jumpRate: jumps.length / boundaries,
    widestJump: Math.max(0, ...jumps),
    reach: harmonicReach(preset.style),
    meanJump: mean(jumps),
    jumpBack: later === 0 ? 0 : backs / later,
    homeLag: mean(lags),
    homeMissed: jumps.length === 0 ? 0 : missed / jumps.length,
    homeError: wrong / bars,
    drift: DRIFT_AT.map((sections) => mean(runs.map((run) => apart(run, sections)))),
    back: runs.filter((run) => apart(run, last) === 0).length / runs.length,
  };
}

/** E19 for every preset at `entropy`, over `seeds` seeds of one more section than `DRIFT_AT` reads. */
export function keyLoops(entropy: number, seeds: number): KeyLoop[] {
  const sections = DRIFT_AT.at(-1)! + 1;
  return PRESETS.map((preset) =>
    keyLoop(
      preset,
      range(seeds).map((seed) => keyRun(preset, seed + 1, entropy, sections)),
    ),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(
    `time constant: ${timeConstant(HISTORY_DECAY).toFixed(2)} bars; a section holds ${SECTION_BARS}`,
  );
  for (const entropy of [0.3, 0.6, 1]) {
    console.log(`\nentropy ${entropy}, 20 seeds, ${DRIFT_AT.at(-1)! + 1} sections`);
    console.log(
      'preset          jumps  reach widest mean  back  lag  missed  error  drift after ' +
        DRIFT_AT.join(', ') +
        ' sections  back',
    );
    for (const m of keyLoops(entropy, 20))
      console.log(
        [
          m.preset.padEnd(14),
          m.jumpRate.toFixed(3),
          String(m.reach).padStart(5),
          String(m.widestJump).padStart(6),
          m.meanJump.toFixed(2),
          (100 * m.jumpBack).toFixed(0).padStart(3) + '%',
          m.homeLag.toFixed(2),
          (100 * m.homeMissed).toFixed(1).padStart(5) + '%',
          (100 * m.homeError).toFixed(1).padStart(5) + '%',
          '  ' + m.drift.map((d) => d.toFixed(2)).join(' '),
          '  ' + (100 * m.back).toFixed(0) + '%',
        ].join('  '),
      );
  }
}
