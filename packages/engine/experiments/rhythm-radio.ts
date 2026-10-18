/**
 * E37: the composer asks the repository for its rhythm while the radio
 * walks (#397, step 2; E34's walk, E36's ruling).
 *
 * As E34: the radio tuned in at each preset's point at entropy 0.3 walks on
 * its own for `HOURS` hours of music, each section's style glided to over
 * `PRESET_GLIDE`, and the band decides every bar with no meter asked for,
 * now with cells' rhythms too (`RHYTHM_REPOSITORY`), so each section's plan
 * says the meter the composer found and the rhythm, and its clave, that fit
 * it (`composedRhythm`). Over every preset and `SEEDS` seeds it counts:
 *
 * - each change of the section's rhythm (its fragment or its clave): the bar
 *   it falls on, which must be a section's first, and how many go back, at
 *   the next section's start, to the rhythm just left;
 * - the sections where the composer finds no rhythm, and the drummer
 *   invents: the fit refusing every one (a meter other than a 4/4), or the
 *   nearest past `RHYTHM_MISS`;
 * - the share of sections each rhythm plays.
 *
 * E38, the Muse filing the drummer's grooves (#401): the same walks for
 * `LEARNING_HOURS` hours with the band given an empty learned layer, so on
 * each miss the drummer invents and the Muse files its groove where the next
 * section is planned, and every meter, rhythm and groove the composer keeps
 * is a use (`learningRuns`). It counts the grooves filed new and those whose
 * text was held already (identity), the sections that play a filed groove,
 * every filing read back by cells and fitted to its bench, the share of
 * sections whose rhythm is among its run's 3 most used against the same
 * walk with nothing learned (`lockIn`), and what the layer weighs.
 *
 * E39, the composer tiring of a groove (#411): the same runs, which vary
 * and reject grooves as the band does (`novelty.ts`), counted by
 * `mostUsedGroove`: in the meters no seed rhythm fits, the sections the
 * most used groove of each plays.
 *
 * It runs under vitest: `E37_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/rhythm-radio.test.ts` prints the numbers.
 */

import { beatsOf } from '@jambot/theory';
import {
  type BandCarried,
  type BandEnv,
  type GrooveFiling,
  type MeterRepository,
  type Plan,
  PRESETS,
  PRESET_GLIDE,
  RADIO,
  RHYTHM_REPOSITORY,
  type RhythmRepository,
  SECTION_BARS,
  STRAIGHT,
  type Style,
  type StyleTrack,
  band,
  clockOf,
  glideTo,
  holding,
  lookAhead,
  styleAt,
  walkRadio,
} from '../src/index.ts';
import { EMPTY_LAYER, type LearnedLayer } from '../src/layer.ts';
import { METER_REPOSITORY } from '../src/repository.ts';

export const HOURS = 1;
export const SEEDS = 5;
export const ENTROPY = 0.3;
/** E38's hours a run: E34's learning runs', over which #398 bounds the layer's size. */
export const LEARNING_HOURS = 3;

const range = (n: number) => [...Array(n).keys()];

/** A section's rhythm as a change is counted: its fragment and its clave. */
const rhythmKey = (plan: Plan) => `${plan.rhythmFragment ?? '-'} + ${plan.claveFragment ?? '-'}`;

/** One change of rhythm: the bar it falls on, the section, from and to. */
export interface RhythmChange {
  readonly bar: number;
  readonly section: number;
  readonly from: string;
  readonly to: string;
}

/** One run: the radio tuned in at a preset, for `HOURS` hours of music. */
export interface RhythmRun {
  readonly preset: string;
  readonly seed: number;
  readonly sections: number;
  readonly changes: readonly RhythmChange[];
  /** The sections where no rhythm was found, by why: the fit refused every one, or the nearest lay past the distance. */
  readonly missed: { readonly fit: number; readonly distance: number };
  /** Sections each rhythm played. */
  readonly played: Readonly<Record<string, number>>;
  /** The rhythm of each section, in order: its fragment, or `-` where the drummer invents. */
  readonly kept: readonly string[];
  /** The meter of each section, in order: its fragment's id, where it has one, else `-`. */
  readonly meters: readonly string[];
  /** The meters of the run that no seed rhythm fits, so a groove is all a section of them finds (E39). */
  readonly seedless: readonly string[];
  /** What the run learned, where it was given a layer (E38). */
  readonly learning: Learning | null;
}

/** A groove the Muse filed in a run (E38): what was filed, and what filing gave. */
export interface Filing {
  readonly filing: GrooveFiling;
  readonly id: string;
  /** Whether its text was held already, so it added to that fragment (identity). */
  readonly held: boolean;
}

/** What a run learned (E38). */
export interface Learning {
  /** Every filing in the run's hours, in order. */
  readonly filings: readonly Filing[];
  /** The sections whose rhythm is a groove the Muse filed. */
  readonly playedFiled: number;
  /** The layer after the run's hours. */
  readonly layer: LearnedLayer;
}

/** The radio tuned in at a preset, the band deciding each bar with the composer asking for meter and rhythm. */
export function rhythmRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  hours = HOURS,
  margins?: RhythmRepository['margins'],
  layer?: LearnedLayer,
): RhythmRun {
  // (each filing kept, and each section's layer as the planner left it: it asks the meter once a section,
  // in order, then files and learns)
  const filings: (Filing & { readonly section: number })[] = [];
  const layers: LearnedLayer[] = [];
  let planning = -1;
  const learnt = (learned: LearnedLayer) => {
    layers[planning] = learned;
    return learned;
  };
  const meters: MeterRepository = {
    ...METER_REPOSITORY,
    query(point, given, chosen, pull) {
      planning++;
      if (given) layers[planning] = given;
      return METER_REPOSITORY.query(point, given, chosen, pull);
    },
    used: (given, id, point) => learnt(METER_REPOSITORY.used!(given, id, point)),
  };
  const rhythms: RhythmRepository = {
    ...RHYTHM_REPOSITORY,
    ...(margins ? { margins } : {}),
    file(given, filing) {
      const filed = RHYTHM_REPOSITORY.file!(given, filing);
      filings.push({ filing, id: filed.id, held: filed.held, section: planning + 1 });
      return filed;
    },
    used: (given, ids, point, alongside) =>
      learnt(RHYTHM_REPOSITORY.used!(given, ids, point, alongside)),
  };
  let style: Style = { ...preset.style, entropy: ENTROPY };
  let track: StyleTrack = holding(style);
  let walked = 0;
  const bpms: number[] = [];
  const envAt = (bar: number, clock: ReturnType<typeof clockOf>): BandEnv => {
    const section = Math.floor(bar / SECTION_BARS);
    while (walked < section) {
      walked++;
      style = walkRadio(style, seed, walked, RADIO);
      track = glideTo(track, style, clock.barStart(walked * SECTION_BARS), PRESET_GLIDE);
    }
    const played = styleAt(track, clock.barStart(bar));
    bpms[bar] = played.bpm;
    return {
      seed,
      bar,
      style: played,
      wish: { tonic: null, mode: preset.mode, melodic: null },
      swing: STRAIGHT,
      repository: meters,
      rhythms,
      layer,
      offer: null,
    };
  };
  const decided = lookAhead(band.initial as BandCarried, envAt, Math.ceil((hours * 60 * 180) / 2));
  const changes: RhythmChange[] = [];
  const played: Record<string, number> = {};
  const kept: string[] = [];
  const meterKept: string[] = [];
  const seedless = new Set<string>();
  const missed = { fit: 0, distance: 0 };
  let minute = 0;
  let sections = 0;

  for (const [i, d] of decided.entries()) {
    if (minute >= hours * 60) break;
    const before = decided[i - 1];
    if (before && rhythmKey(before.plan) !== rhythmKey(d.plan))
      changes.push({
        bar: d.bar,
        section: Math.floor(d.bar / SECTION_BARS),
        from: rhythmKey(before.plan),
        to: rhythmKey(d.plan),
      });
    if (d.bar % SECTION_BARS === 0) {
      sections++;
      const key = rhythmKey(d.plan);
      played[key] = (played[key] ?? 0) + 1;
      kept.push(d.plan.rhythmFragment ?? '-');
      meterKept.push(d.plan.meterFragment ?? '-');
      const bench = { meter: d.plan.meter, meterFragment: d.plan.meterFragment };
      // whatever the point, the query with no layer lists every seed rhythm that fits the bench: none is the fit refusing
      const fitsNone = rhythms.query({ energy: 0 }, bench).length === 0;
      if (fitsNone) seedless.add(d.plan.meterFragment ?? '-');
      if (d.plan.rhythmFragment === undefined) {
        if (fitsNone) missed.fit++;
        else missed.distance++;
      }
    }
    minute += beatsOf(d.plan.meter) / bpms[d.bar]!;
  }
  // (a filing is made where a section is planned, of the section before: those of the sections within the hours)
  const within = filings
    .filter((f) => f.section < sections)
    .map(({ filing, id, held }) => ({ filing, id, held }));
  const filedIds = new Set(within.filter((f) => !f.held).map((f) => f.id));
  const learning: Learning | null = layer
    ? {
        filings: within,
        playedFiled: kept.filter((id) => filedIds.has(id)).length,
        layer: layers.slice(0, sections).findLast((l) => l !== undefined) ?? layer,
      }
    : null;
  return {
    preset: preset.name,
    seed,
    sections,
    changes,
    missed,
    played,
    kept,
    meters: meterKept,
    seedless: [...seedless],
    learning,
  };
}

/** Every preset, `seeds` seeds each, each run its own seed as E34's are; learning from `layer` where one is given. */
export const rhythmRuns = (
  seeds = SEEDS,
  hours = HOURS,
  margins?: RhythmRepository['margins'],
  layer?: LearnedLayer,
): RhythmRun[] =>
  PRESETS.flatMap((preset, p) =>
    range(seeds).map((seed) => rhythmRun(preset, p * seeds + seed + 1, hours, margins, layer)),
  );

/** E38: E37's runs for `hours` hours with the band learning from an empty layer, and the Muse filing (#401). */
export const learningRuns = (seeds = SEEDS, hours = LEARNING_HOURS): RhythmRun[] =>
  rhythmRuns(seeds, hours, undefined, EMPTY_LAYER);

/** How many of a run's sections play one of its 3 most used rhythms (`-`, the drummer's own, counting as one). */
export function inTopThree(run: RhythmRun): number {
  const counts = new Map<string, number>();
  for (const id of run.kept) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.values()]
    .sort((a, b) => b - a)
    .slice(0, 3)
    .reduce((a, b) => a + b, 0);
}

/**
 * Lock-in (cells decision 048, point 6, as amended), as E34 measures it for
 * meters: how many points learning adds to the share of sections whose
 * rhythm is among its run's 3 most used, over the same walks with nothing
 * learned, pooled, with the standard error of the runs' paired differences.
 */
export function lockIn(
  unlearned: readonly RhythmRun[],
  learned: readonly RhythmRun[],
): {
  readonly before: number;
  readonly after: number;
  readonly added: number;
  readonly error: number;
} {
  const pooled = (runs: readonly RhythmRun[]) =>
    runs.reduce((n, r) => n + inTopThree(r), 0) / runs.reduce((n, r) => n + r.kept.length, 0);
  const share = (r: RhythmRun) => inTopThree(r) / r.kept.length;
  const differences = learned.map((r, i) => (share(r) - share(unlearned[i]!)) * 100);
  const mean = differences.reduce((a, b) => a + b, 0) / differences.length;
  const spread = Math.sqrt(
    differences.reduce((a, d) => a + (d - mean) ** 2, 0) / (differences.length - 1),
  );
  const [before, after] = [pooled(unlearned), pooled(learned)];
  return {
    before,
    after,
    added: (after - before) * 100,
    error: spread / Math.sqrt(differences.length),
  };
}

/** The changes that go back, at the next section's start, to the rhythm just left. */
export const wentBack = (run: RhythmRun): RhythmChange[] =>
  run.changes.filter((c, i) => {
    const next = run.changes[i + 1];
    return next !== undefined && next.section === c.section + 1 && next.to === c.from;
  });

/**
 * E39 (#411): in the meters no seed rhythm fits, where a groove is all a
 * section finds, how many sections the most used groove of each plays, over
 * every run and meter: the sections in those meters, the most used groove's
 * pooled over them, and its share. A section the drummer invents its own
 * in (`-`) counts among the sections and is no groove.
 */
export function mostUsedGroove(runs: readonly RhythmRun[]): {
  readonly sections: number;
  readonly mostUsed: number;
  readonly share: number;
} {
  let sections = 0;
  let mostUsed = 0;
  for (const run of runs)
    for (const meter of run.seedless) {
      const counts = new Map<string, number>();
      run.meters.forEach((m, i) => {
        if (m !== meter) return;
        sections++;
        const id = run.kept[i]!;
        if (id !== '-') counts.set(id, (counts.get(id) ?? 0) + 1);
      });
      mostUsed += Math.max(0, ...counts.values());
    }
  return { sections, mostUsed, share: mostUsed / sections };
}
