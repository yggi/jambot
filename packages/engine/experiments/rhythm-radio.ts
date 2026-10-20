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
 * - the share of sections each rhythm plays;
 * - the sections whose rhythm is a line of its own played alone, a clave
 *   with no drum bar (`aloneByPreset`, #428), which E40 counts too.
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
 * E39, the composer tiring of a rhythm (#411, #414): the same runs, which
 * vary and reject grooves and seed rhythms as the band does (`novelty.ts`),
 * counted by `mostUsedGroove`: in the meters no seed rhythm fits, the
 * sections the most used groove of each plays.
 *
 * E40, a seed rhythm climbing the ladder while a preset is held (#414):
 * E37's runs with the radio not walking, each preset held at entropy 0.3
 * (`heldRuns`), learning from an empty layer or, as `main` plays a held
 * preset, with none. It counts the share of sections the run's most used
 * rhythm plays (`mostUsedRhythm`), how far the drummer's bars move from
 * `main`'s: the hits a role by section type (`drumDistance`) and the hits
 * on the steps `main` plays them, bar beside bar (`drumOverlap`), and the
 * sections where a drum bar returns without the clave it had (`claveLost`).
 *
 * It runs under vitest: `E37_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/rhythm-radio.test.ts` prints the numbers
 * (E38 and E39's in `rhythm-learning.test.ts`, E40's in `rhythm-held.test.ts`).
 */

import { beatsOf, stepsOf } from '@jambot/theory';
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
import type { BarEnv } from '../src/bar.ts';
import { drums } from '../src/drums.ts';
import { GROOVE_ROLES, isOwnLine, sectionHits } from '../src/rhythm-query.ts';
import { type SectionType, barEnergy } from '../src/form.ts';
import { grooveBar } from '../src/groove.ts';
import { EMPTY_LAYER, type LearnedLayer } from '../src/layer.ts';
import { METER_REPOSITORY } from '../src/repository.ts';
import { writtenStyle } from '../src/style.ts';

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
  /** The sections whose rhythm names none of the drummer's roles: a line of its own, a clave, played alone (#428). */
  readonly alone: number;
  /** The rhythm of each section, in order: its fragment, or `-` where the drummer invents. */
  readonly kept: readonly string[];
  /** The clave of each section, in order: its fragment, or `-` where none layers. */
  readonly claves: readonly string[];
  /** The meter of each section, in order: its fragment's id, where it has one, else `-`. */
  readonly meters: readonly string[];
  /** The meters of the run that no seed rhythm fits, so a groove is all a section of them finds (E39). */
  readonly seedless: readonly string[];
  /** What the run learned, where it was given a layer (E38). */
  readonly learning: Learning | null;
  /** The drummer's hits a role, and the bars, by section type, where the preset was held (E40). */
  readonly drums: DrumCounts | null;
  /** The drummer's hits in each bar, each its step and sound (`step × 128 + note`), where the preset was held (E40). */
  readonly drumBars: readonly (readonly number[])[] | null;
}

/** The drummer's bars by section type (E40): how many, and the hits of each role in them. */
export type DrumCounts = Readonly<
  Partial<
    Record<SectionType, { readonly bars: number; readonly hits: Readonly<Record<string, number>> }>
  >
>;

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

/**
 * The radio tuned in at a preset, the band deciding each bar with the composer asking for meter and rhythm; or, where
 * `held`, the preset held at entropy 0.3, the radio not walking, and the drummer's hits counted (E40).
 */
export function rhythmRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  hours = HOURS,
  margins?: RhythmRepository['margins'],
  layer?: LearnedLayer,
  held = false,
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
  const styles: Style[] = [];
  const envAt = (bar: number, clock: ReturnType<typeof clockOf>): BandEnv => {
    const section = Math.floor(bar / SECTION_BARS);
    while (!held && walked < section) {
      walked++;
      style = walkRadio(style, seed, walked, RADIO);
      track = glideTo(track, style, clock.barStart(walked * SECTION_BARS), PRESET_GLIDE);
    }
    const played = styleAt(track, clock.barStart(bar));
    bpms[bar] = played.bpm;
    styles[bar] = writtenStyle(played);
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
  const claveKept: string[] = [];
  const meterKept: string[] = [];
  const seedless = new Set<string>();
  const missed = { fit: 0, distance: 0 };
  let alone = 0;
  const drumCounts: Partial<Record<SectionType, { bars: number; hits: Record<string, number> }>> =
    {};
  const drumBars: number[][] = [];
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
      claveKept.push(d.plan.claveFragment ?? '-');
      meterKept.push(d.plan.meterFragment ?? '-');
      const bench = { meter: d.plan.meter, meterFragment: d.plan.meterFragment };
      // whatever the point, the query with no layer lists every seed rhythm that fits the bench: none is the fit refusing
      const fitsNone = rhythms.query({ energy: 0 }, bench).length === 0;
      if (fitsNone) seedless.add(d.plan.meterFragment ?? '-');
      if (d.plan.rhythmFragment === undefined) {
        if (fitsNone) missed.fit++;
        else missed.distance++;
      } else {
        const read = rhythms.read(
          d.plan.rhythmFragment,
          d.plan.meter,
          layers[Math.floor(d.bar / SECTION_BARS)] ?? layer,
        );
        if (read && isOwnLine(read)) alone++;
      }
    }
    if (held) {
      // (the drummer's bar as the band plays it: its own, given the section's fragments' hits, from the layer the
      // section was planned with)
      const barInSection = d.bar % SECTION_BARS;
      const bar: BarEnv = {
        seed,
        bar: d.bar,
        meter: d.plan.meter,
        plan: d.plan,
        barInSection,
        style: styles[d.bar]!,
        swing: { level: d.plan.swing, share: d.plan.share ?? STRAIGHT.share },
        barEnergy: barEnergy(styles[d.bar]!.energy, d.plan.section.type, barInSection),
        chords: d.chords,
        next: [],
        offer: null,
      };
      const learnt = layers[Math.floor(d.bar / SECTION_BARS)] ?? layer;
      const hits = sectionHits(
        rhythms,
        d.plan,
        d.plan.meter,
        barInSection,
        stepsOf(d.plan.meter),
        learnt,
      );
      const counts = (drumCounts[d.plan.section.type] ??= { bars: 0, hits: {} });
      counts.bars++;
      const played = grooveBar(bar, drums(bar), hits).filter((w) => w.role !== 'clave');
      for (const w of played) counts.hits[w.role!] = (counts.hits[w.role!] ?? 0) + 1;
      drumBars.push(played.map((w) => w.step * 128 + w.note));
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
    alone,
    kept,
    claves: claveKept,
    meters: meterKept,
    seedless: [...seedless],
    learning,
    drums: held ? drumCounts : null,
    drumBars: held ? drumBars : null,
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

/**
 * E40 (#414): E37's runs with each preset held at entropy 0.3, the radio not walking, for `hours` hours; learning from
 * an empty layer where `learning`, so the composer climbs the ladder with a seed rhythm too, else with none, as `main`
 * plays a held preset (where it finds a seed rhythm, nothing is filed).
 */
export const heldRuns = (learning: boolean, seeds = SEEDS, hours = HOURS): RhythmRun[] =>
  PRESETS.flatMap((preset, p) =>
    range(seeds).map((seed) =>
      rhythmRun(
        preset,
        p * seeds + seed + 1,
        hours,
        undefined,
        learning ? EMPTY_LAYER : undefined,
        true,
      ),
    ),
  );

/** E40: the sections a run's most used rhythm plays (its fragment, or `-` where the drummer invents), pooled over the runs, and its share. */
export function mostUsedRhythm(runs: readonly RhythmRun[]): {
  readonly sections: number;
  readonly mostUsed: number;
  readonly share: number;
} {
  let sections = 0;
  let mostUsed = 0;
  for (const run of runs) {
    const counts = new Map<string, number>();
    for (const id of run.kept) counts.set(id, (counts.get(id) ?? 0) + 1);
    sections += run.kept.length;
    mostUsed += Math.max(...counts.values());
  }
  return { sections, mostUsed, share: mostUsed / sections };
}

/**
 * E40 (#430): the sections where a drum bar that returns plays without the clave it had before. For each section of a
 * stretch of a drum bar (its fragment, the same in sections one after another) that played in a stretch before, where
 * that stretch's last section had a clave and this section has another, or none: `lost` where the clave played in
 * every section of that stretch, so the two were chosen together, and `lent` where it layered on only its last
 * sections, the drum bar it was chosen with having faded meanwhile.
 */
export function claveLost(runs: readonly RhythmRun[]): {
  readonly lost: number;
  readonly lent: number;
} {
  let lost = 0;
  let lent = 0;
  for (const run of runs) {
    const had = new Map<string, { readonly clave: string; readonly whole: boolean }>();
    let start = 0;
    run.kept.forEach((id, i) => {
      if (run.kept[i - 1] !== id) start = i;
      const before = had.get(id);
      if (id !== '-' && before && before.clave !== '-' && run.claves[i] !== before.clave)
        if (before.whole) lost++;
        else lent++;
      if (run.kept[i + 1] !== id) {
        const clave = run.claves[i]!;
        had.set(id, { clave, whole: run.claves.slice(start, i + 1).every((c) => c === clave) });
      }
    });
  }
  return { lost, lent };
}

/**
 * E40: how far the drummer's bars move from `main`'s, as `rhythms.test.ts` measures it: for each preset, section type
 * and role but the clave, the hits a bar over the preset's runs, against the same runs on `main`; the farthest a
 * preset moves, over its types and roles.
 */
export function drumDistance(
  runs: readonly RhythmRun[],
  main: readonly RhythmRun[],
): Record<string, number> {
  const pooled = (of: readonly RhythmRun[], preset: string) => {
    const out: Partial<Record<SectionType, { bars: number; hits: Record<string, number> }>> = {};
    for (const run of of.filter((r) => r.preset === preset))
      for (const [type, c] of Object.entries(run.drums!) as [
        SectionType,
        { bars: number; hits: Record<string, number> },
      ][]) {
        const into = (out[type] ??= { bars: 0, hits: {} });
        into.bars += c.bars;
        for (const [role, n] of Object.entries(c.hits))
          into.hits[role] = (into.hits[role] ?? 0) + n;
      }
    return out;
  };
  return Object.fromEntries(
    PRESETS.map(({ name }) => {
      const [a, b] = [pooled(runs, name), pooled(main, name)];
      let far = 0;
      for (const type of Object.keys(b) as SectionType[])
        for (const role of GROOVE_ROLES) {
          const perBar = (c: (typeof a)[SectionType]) => (c ? (c.hits[role] ?? 0) / c.bars : 0);
          far = Math.max(far, Math.abs(perBar(a[type]) - perBar(b[type])));
        }
      return [name, Math.round(far * 100) / 100];
    }),
  );
}

/**
 * E40: how much of the drummer's bars stays where `main` plays it, as `rhythms.test.ts` measures it, for each preset
 * over its runs, bar beside bar, the clave aside: the hits on a step and sound both play, over those either plays.
 */
export function drumOverlap(
  runs: readonly RhythmRun[],
  main: readonly RhythmRun[],
): Record<string, number> {
  return Object.fromEntries(
    PRESETS.map(({ name }) => {
      const overlaps = runs.flatMap((run, i) =>
        run.preset !== name
          ? []
          : run.drumBars!.map((bar, j) => {
              const theirs = new Set(main[i]!.drumBars![j]);
              const shared = bar.filter((k) => theirs.has(k)).length;
              return shared / new Set([...bar, ...theirs]).size || 1;
            }),
      );
      return [
        name,
        Math.round((overlaps.reduce((a, b) => a + b, 0) / overlaps.length) * 100) / 100,
      ];
    }),
  );
}

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

/** #428: the sections whose rhythm is a line of its own played alone (`RhythmRun.alone`), a preset's runs pooled, for each preset. */
export const aloneByPreset = (runs: readonly RhythmRun[]): Record<string, number> =>
  Object.fromEntries(
    PRESETS.map(({ name }) => [
      name,
      runs.filter((r) => r.preset === name).reduce((n, r) => n + r.alone, 0),
    ]),
  );
