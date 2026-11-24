/**
 * E47: the station (#547 rung 5, the owner's rulings of 2026-11-23). The planner alone, as a host plans (its meter,
 * rhythm, bass, lead and harmony repositories, a learned layer from empty), every preset at entropy 0.3, seeds 1 and
 * 2, for 3 hours of sections (counted as 4/4 bars at the preset's tempo), held at its point or walked by the radio
 * (`walkRadio`). It measures what the plan's bounds name: whether a song ever follows itself, how often the draw takes
 * the song that fits best, whether a song plays its themes again as it first did, whether each play starts from its
 * lead line, and whether the rotation keeps within its cap. And the mixes (step 2a): how often a song played again is
 * one, whether each play starts from its version's tonic, drum bar and bass line, whether each new mix differs from the
 * original, what each changes, whether a speed mix keeps within its reach, whether every section of a play carries its
 * version's tempo and style shift (step 2b), and how many mixes a song keeps.
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
import { familyOf, rejectedOf } from '../src/novelty.ts';
import {
  type MixChange,
  SPEED_LEAST,
  SPEED_REACH,
  capOf,
  sameSongMeter,
  weightOf,
} from '../src/rotation.ts';
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
  /** Plays after a song's first, and how many of them were mixes. */
  readonly replays: number;
  readonly mixed: number;
  /**
   * Plays of a version kept; how many of them found its drum bar or bass line rejected by the ladder, which then plays the
   * next nearest; and how many didn't start from its tonic, or from its drum bar or bass line where it has one and the
   * ladder hadn't rejected it (or a variation the ladder made of them at once).
   */
  readonly versionsCompared: number;
  readonly versionsRejected: number;
  readonly versionsDiffering: number;
  /** New mixes, and how many play the original's tonic, drum bar and bass line all the same. */
  readonly mixesMade: number;
  readonly mixesSame: number;
  /** New mixes by what they change, a mix of two counted under each. */
  readonly changed: Partial<Record<MixChange, number>>;
  /** Speed mixes whose tempo lies outside `SPEED_LEAST` to `SPEED_REACH` of the original's. */
  readonly speedsOutside: number;
  /** Sections of a song, and how many didn't carry their version's tempo and style shift (an original's none). */
  readonly sectionsMarked: number;
  readonly marksDiffering: number;
  /** The most mixes a song kept, at any section. */
  readonly mostMixes: number;
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
  let [replays, mixed, versionsCompared, versionsRejected, versionsDiffering] = [0, 0, 0, 0, 0];
  let [mixesMade, mixesSame, mostMixes, speedsOutside, sectionsMarked, marksDiffering] = [
    0, 0, 0, 0, 0, 0,
  ];
  const changed: Partial<Record<MixChange, number>> = {};
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
    for (const s of carried.rotation.songs)
      mostMixes = Math.max(mostMixes, s.versions.filter((v) => v.id > 0).length);
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
      // (the version it plays: one kept starts from its tonic, drum bar and bass line; a new mix differs from the original)
      const was = before.rotation.songs.find((s) => s.id === song);
      const now = carried.rotation.songs.find((s) => s.id === song)!;
      const version = now.versions.find((v) => v.id === carried.version)!;
      const original = now.versions.find((v) => v.id === 0)!;
      if (plays > 1) {
        replays++;
        if (version.id > 0) mixed++;
      }
      const layer = carried.layer ?? EMPTY_LAYER;
      const sameOrVaried = (kept: string | undefined | null, playing: string | undefined | null) =>
        (kept ?? null) === (playing ?? null) ||
        (kept != null && playing != null && familyOf(layer, kept).includes(playing));
      if (was?.versions.some((v) => v.id === version.id)) {
        versionsCompared++;
        const rejected = rejectedOf(before.boredom, before.claveOwners);
        const drumsOut =
          version.drums.rhythmFragment !== undefined &&
          rejected.includes(version.drums.rhythmFragment);
        const bassOut = version.bass !== null && rejected.includes(version.bass);
        if (drumsOut || bassOut) versionsRejected++;
        // (a version keeps only a drum bar and bass line it has: where the drummer or the bass invented, a play finds one)
        const drumsKept = version.drums.rhythmFragment !== undefined && !drumsOut;
        const bassKept = version.bass !== null && !bassOut;
        if (
          plan.key.tonic !== version.tonic ||
          (drumsKept && !sameOrVaried(version.drums.rhythmFragment, plan.rhythmFragment)) ||
          (bassKept && !sameOrVaried(version.bass, carried.bassFragment))
        )
          versionsDiffering++;
      } else if (version.id > 0) {
        mixesMade++;
        if (
          version.tonic === original.tonic &&
          version.drums.rhythmFragment === original.drums.rhythmFragment &&
          version.bass === original.bass &&
          version.tempo === original.tempo &&
          JSON.stringify(version.shift) === JSON.stringify(original.shift)
        )
          mixesSame++;
        for (const change of version.changes) changed[change] = (changed[change] ?? 0) + 1;
        if (version.changes.includes('speed')) {
          const by = Math.abs(version.tempo - 1);
          if (by < SPEED_LEAST - 1e-12 || by > SPEED_REACH + 1e-12) speedsOutside++;
        }
      }
    }
    // (every section of a play carries its version's tempo and style shift, an original's none)
    if (song !== null && at !== undefined) {
      const now = carried.rotation.songs.find((s) => s.id === song)!;
      const version = now.versions.find((v) => v.id === carried.version)!;
      const mixed = version.tempo !== 1 || Object.keys(version.shift).length > 0;
      sectionsMarked++;
      if (
        JSON.stringify(plan.mix ?? null) !==
        JSON.stringify(mixed ? { tempo: version.tempo, shift: version.shift } : null)
      )
        marksDiffering++;
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
    replays,
    mixed,
    versionsCompared,
    versionsRejected,
    versionsDiffering,
    mixesMade,
    mixesSame,
    changed,
    speedsOutside,
    sectionsMarked,
    marksDiffering,
    mostMixes,
  };
}

/** Every preset, both seeds, held and walked. */
export const stationRuns = (hours = HOURS): StationRun[] =>
  [false, true].flatMap((walked) =>
    PRESETS.flatMap((preset) => SEEDS.map((seed) => stationRun(preset, seed, walked, hours))),
  );
