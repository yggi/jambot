/**
 * E47: the station (#547 rung 5, the owner's rulings of 2026-11-23). The planner alone, as a host plans (its meter,
 * rhythm, bass, lead and harmony repositories, a learned layer from empty), every preset at entropy 0.3, seeds 1 and
 * 2, for 3 hours of sections (counted as 4/4 bars at the preset's tempo), held at its point or walked by the radio
 * (`walkRadio`). It measures what the plan's bounds name: whether a song ever follows itself, how often the draw takes
 * the song that fits best, whether a song plays its themes again as it first did, whether each play starts from its
 * lead line, and whether the rotation keeps within its cap.
 */

import { NO_HISTORY } from '../src/history.ts';
import { EMPTY_LAYER } from '../src/layer.ts';
import { LEAD_REPOSITORY } from '../src/lead-lines.ts';
import { BASS_REPOSITORY } from '../src/bass-lines.ts';
import { stylePoint } from '../src/meter-query.ts';
import { presetMode } from '../src/mode-repository.ts';
import { type PlanCarried, type PlanEnv, planner } from '../src/plan.ts';
import { HARMONY_REPOSITORY } from '../src/progressions.ts';
import { walkRadio } from '../src/radio.ts';
import { METER_REPOSITORY } from '../src/repository.ts';
import { RHYTHM_REPOSITORY } from '../src/rhythms.ts';
import { familyOf } from '../src/novelty.ts';
import { capOf, sameSongMeter, weightOf } from '../src/rotation.ts';
import { PRESETS, type Style, pointDistance } from '../src/style.ts';
import { MISS_DISTANCE } from '../src/meter-query.ts';

/** The hours a run plays, the seeds, and the entropy. */
export const HOURS = 3;
export const SEEDS = [1, 2] as const;
export const ENTROPY = 0.3;

/** A run's sections in `hours`, eight bars of four beats at the style's tempo. */
export const sectionsIn = (style: Style, hours = HOURS) =>
  Math.round((hours * 3600) / ((8 * 4 * 60) / style.bpm));

/** What one run measured. */
export interface StationRun {
  readonly preset: string;
  readonly seed: number;
  readonly walked: boolean;
  readonly sections: number;
  /** Songs started: one each time a song's first section plays. */
  readonly starts: number;
  /** Starts of the song that had just ended. */
  readonly backToBack: number;
  /** Songs made in the run. */
  readonly made: number;
  /** Draws among two or more songs that fit, how many took the one that fits best, and what a uniform draw would take. */
  readonly draws: number;
  readonly nearest: number;
  readonly uniform: number;
  /** Sections whose theme differs from the same section of the song's first play, of those compared. */
  readonly themesCompared: number;
  readonly themesDiffering: number;
  /** Plays after a song's first whose first section's lead is neither the song's lead line nor a variation of it, of those that had one. */
  readonly leadsCompared: number;
  readonly leadsDiffering: number;
  /** Sections where the rotation held more songs than its cap. */
  readonly overCap: number;
}

/** One run of the station (see the module's comment). */
export function stationRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  walked: boolean,
  hours = HOURS,
): StationRun {
  let style: Style = { ...preset.style, entropy: ENTROPY };
  const sections = sectionsIn(style, hours);
  let carried: PlanCarried = planner.initial;
  let last: number | null = null;
  const firstPlay = new Map<number, Map<number, string>>();
  const seen = new Map<number, number>();
  let [starts, backToBack, draws, nearest, uniform] = [0, 0, 0, 0, 0];
  let [themesCompared, themesDiffering, leadsCompared, leadsDiffering, overCap] = [0, 0, 0, 0, 0];
  for (let index = 0; index < sections; index++) {
    const before = carried;
    const env: PlanEnv = {
      seed,
      index,
      style,
      wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
      history: NO_HISTORY,
      repository: METER_REPOSITORY,
      rhythms: RHYTHM_REPOSITORY,
      bassLines: BASS_REPOSITORY,
      leads: LEAD_REPOSITORY,
      harmonies: HARMONY_REPOSITORY,
      layer: EMPTY_LAYER,
    };
    const { output: plan, carried: next } = planner.advance(env, carried, null);
    carried = next;
    if (carried.rotation.songs.length > capOf(style.entropy)) overCap++;
    const song = carried.song;
    const at = plan.section.song?.at;
    if (song !== null && at === 0) {
      starts++;
      if (song === last) backToBack++;
      const plays = (seen.get(song) ?? 0) + 1;
      seen.set(song, plays);
      // (a draw: the song played again where two or more fit, the one that fits best by weight before the draw)
      const point = stylePoint(style);
      const fitting = before.rotation.songs.filter(
        (s) =>
          s.id !== last &&
          s.mode === plan.key.mode &&
          sameSongMeter(s.meter, plan) &&
          pointDistance(s.point, point) <= MISS_DISTANCE,
      );
      if (plays > 1 && fitting.length >= 2) {
        draws++;
        uniform += 1 / fitting.length;
        const best = fitting.reduce((a, b) => (weightOf(b, point) > weightOf(a, point) ? b : a));
        if (best.id === song) nearest++;
      }
      // (each later play starts from the lead line the song kept: it, or a variation the ladder made of it at once)
      const kept = before.rotation.songs.find((s) => s.id === song)?.lead ?? null;
      if (plays > 1 && kept !== null) {
        leadsCompared++;
        const family = familyOf(carried.layer ?? EMPTY_LAYER, kept);
        if (carried.leadFragment === null || !family.includes(carried.leadFragment))
          leadsDiffering++;
      }
    }
    if (song !== null && at !== undefined) {
      const theme = JSON.stringify(plan.theme);
      const plays = firstPlay.get(song) ?? new Map<number, string>();
      if ((seen.get(song) ?? 0) <= 1) plays.set(at, theme);
      else if (plays.has(at)) {
        themesCompared++;
        if (plays.get(at) !== theme) themesDiffering++;
      }
      firstPlay.set(song, plays);
    }
    if (at !== undefined && at + 1 === plan.section.song!.of) last = song;
    if (song === null) last = null;
    if (walked) style = walkRadio(style, seed, index);
  }
  return {
    preset: preset.name,
    seed,
    walked,
    sections,
    starts,
    backToBack,
    made: carried.rotation.made,
    draws,
    nearest,
    uniform,
    themesCompared,
    themesDiffering,
    leadsCompared,
    leadsDiffering,
    overCap,
  };
}

/** Every preset, both seeds, held and walked. */
export const stationRuns = (hours = HOURS): StationRun[] =>
  [false, true].flatMap((walked) =>
    PRESETS.flatMap((preset) => SEEDS.map((seed) => stationRun(preset, seed, walked, hours))),
  );
