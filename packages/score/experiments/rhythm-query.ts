/**
 * E36: the composer's rhythm, asked of cells' repository with the meter
 * chosen as the workbench, read back into the band's drums, and set beside
 * what the band's drummer plays (#397, step 1; #358). An experiment: nothing
 * here changes what the band plays.
 *
 * The corpus is E35's (E28's): every preset held at entropy 0.3, seeds 1 to
 * 5, 64 bars, 8 sections of 8 bars a run (320 sections), but decided with no
 * meter asked for, so each section's plan takes its meter from cells'
 * repository (`METER_REPOSITORY`, E34), as the band does by default. The bars
 * are the band's own (`band.advance`), since what is compared is what the
 * drummer writes, not when the transport plays it.
 *
 * At each section's start the composer asks cells' rhythms
 * (`RHYTHM_FRAGMENTS`, v0.7.0: E31's 8 drum bars and 5 claves) with the
 * style's point on the meter's four axes (`stylePoint`), the facet `rhythm`,
 * and the workbench the section's meter fragment as the band hosts it, its
 * tempo set (`setTiming`, as `repository.ts` reads a meter), so the fit
 * (`fitOf`, decision 047) ranks only the rhythms that fit the meter
 * (`askRhythm`). A section gets the nearest that fits, or a named miss: the
 * fit refusing every rhythm, or the nearest that fits lying past
 * `RHYTHM_MISS`, the meter's own distance.
 *
 * A fragment is read back into the band's drums (`readFragment`, E31's
 * reverse): its union with the workbench played through cells' MIDI out, a
 * role a line, each line alone (its card cut to that term), each hit its
 * General MIDI note as the band's sound, its step through the meter's swing
 * undone, its velocity cells' 127·√level. Under a straight meter of its
 * bpm it is E31's bar hit for hit (`e31Readback`).
 *
 * Beside the drummer (`compare`): hits, density by section type, roles,
 * fills, and where the hits fall, per preset, against the drummer's own
 * variation between seeds (`selfOverlap`). And four ways a fragment could
 * enter the drummer (`ENTRIES`), each a bar built from the fragment and the
 * drummer's bar of the same place, measured against the drummer's bar.
 *
 * A clave chosen with the drum bar (decision 046's use together) is asked
 * with the drum bar on the workbench: the nearest fragment whose union
 * renames none of its names, so that it layers as a line of its own
 * (`coSelect`).
 *
 * It runs under vitest. Its test, `rhythm-query.test.ts`, holds what it
 * found;
 * `E36_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/rhythm-query.test.ts`
 * prints the tables.
 */

import {
  type BandBar,
  type BandCarried,
  DRUM_NOTES,
  DRUM_ROLES,
  GROOVE_ROLES,
  type DrumSound,
  METER_REPOSITORY,
  MISS_DISTANCE,
  type MeterSwing,
  PRESETS,
  SECTION_BARS,
  type StylePoint,
  band,
  composedMeter,
  leanMap,
  leansOf,
  stepSeconds,
  stylePoint,
} from '@jambot/engine';
import { METERS, type Meter, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { setTiming } from '@yggi/cells/engine/edit';
import { unionOf } from '@yggi/cells/repository/fit';
import { type Fragment, type Repository, createRepository } from '@yggi/cells/repository/fragments';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { type Hit, witnesses } from './drums-in-cells.ts';
import { meterName } from './bar-in-cells.ts';

/** The corpus: E35's seeds, entropy and length. */
export const SEEDS = [1, 2, 3, 4, 5] as const;
export const ENTROPY = 0.3;
export const BARS = 64;

/**
 * The farthest a rhythm may lie from the style for the composer to take it:
 * the meter's (`MISS_DISTANCE`, E34), so one point misses for both by the
 * same rule.
 */
export const RHYTHM_MISS = MISS_DISTANCE;

/**
 * The farthest a fragment chosen with the drum bar may lie from the style to
 * join it. Chosen from the numbers: the claves nearest Bossa nova and Funk
 * lie 0.025 and 0.069 from them, Lo-fi hip hop's 0.168, every other
 * preset's 0.26 or more, so 0.1 takes the two a clave was written near
 * (`rhythms.ts`) and no other.
 */
export const CO_SELECT = 0.1;

/** A section of the corpus: its preset, seed and index, its bars, and its style's point. */
export interface CorpusSection {
  readonly preset: string;
  readonly seed: number;
  readonly index: number;
  readonly bars: readonly BandBar[];
  readonly point: StylePoint;
}

const presetOf = (name: string) => PRESETS.find((p) => p.name === name)!;

/** A preset held, at a seed, its bars decided with no meter asked for: each section's meter is the repository's. */
export function corpusRun(name: string, seed: number, count = BARS): BandBar[] {
  const preset = presetOf(name);
  let carried: BandCarried = band.initial;
  return Array.from({ length: count }, (_, bar) => {
    const out = band.advance(
      {
        seed,
        bar,
        style: { ...preset.style, entropy: ENTROPY },
        swing: preset.swing,
        wish: { tonic: null, mode: preset.mode, melodic: null },
        offer: null,
        repository: METER_REPOSITORY,
      },
      carried,
      null,
    );
    carried = out.carried;
    return out.output;
  });
}

/** Every section of the corpus, in order of preset, seed and index (320). */
export function corpus(seeds: readonly number[] = SEEDS): CorpusSection[] {
  return PRESETS.flatMap((preset) =>
    seeds.flatMap((seed) => {
      const bars = corpusRun(preset.name, seed);
      return Array.from({ length: bars.length / SECTION_BARS }, (_, index) => {
        const of = bars.slice(index * SECTION_BARS, (index + 1) * SECTION_BARS);
        return { preset: preset.name, seed, index, bars: of, point: stylePoint(of[0]!.style) };
      });
    }),
  );
}

/** A meter fragment's text as the band hosts it: its tempo set on `&bar` (as `repository.ts` reads one). */
export const hosted = (text: string, bpm: number): string =>
  setTiming(text, 'bar', 'step', `${bpm}bpm`);

/** The workbench of a section: its meter fragment hosted at its tempo, or, where the meter came from none, the meter named. */
export function workbenchOf(bar: BandBar): string {
  const fragment = METER_FRAGMENTS.find((f) => f.id === bar.plan.meterFragment);
  return hosted(fragment ? fragment.text : `&bar meter("${meterName(bar)}")`, bar.style.bpm);
}

/** Cells' rhythms, as the composer asks them. */
export const rhythmRepository = (): Repository => createRepository(RHYTHM_FRAGMENTS);

/** What the composer finds: the rhythm and its distance, or a named miss. */
export type RhythmAnswer =
  | { readonly id: string; readonly distance: number }
  | { readonly miss: 'fit'; readonly nearest: string }
  | { readonly miss: 'distance'; readonly id: string; readonly distance: number };

/** The rhythm the composer takes at a point, with a workbench: the nearest that fits, unless none fits or it lies past the distance. */
export function askRhythm(
  repository: Repository,
  point: StylePoint,
  workbench: string,
): RhythmAnswer {
  const [found] = repository.query(point, 1, {}, { facet: 'rhythm', workbench });
  if (!found) {
    const [nearest] = repository.query(point, 1, {}, { facet: 'rhythm' });
    return { miss: 'fit', nearest: nearest!.fragment.id };
  }
  const { id } = found.fragment;
  return found.distance > RHYTHM_MISS
    ? { miss: 'distance', id, distance: found.distance }
    : { id, distance: found.distance };
}

/** A hit as the band's drums hold it: its role (a line's name: a band role, or `clave`), its sound, step, length and velocity. */
export interface DrumHit {
  readonly role: string;
  readonly sound: DrumSound;
  readonly note: number;
  readonly step: number;
  readonly length: number;
  readonly velocity: number;
}

const SOUND_OF_NOTE = new Map<number, DrumSound>(
  Object.entries(DRUM_NOTES).map(([sound, note]) => [note, sound as DrumSound]),
);

/** A fragment's MIDI card on channel 10: its line, and its terms, each a role's line (`&euclid * &euclidLevel`). */
export function cardOf(text: string): { readonly line: string; readonly terms: string[] } {
  const card = /^&\w+ map=midi\(10\) \[(.*)\]$/m.exec(text);
  if (!card) throw new Error('a fragment with no MIDI card on channel 10');
  return { line: card[0], terms: card[1]!.split(', ') };
}

/** Within a millionth of a step. */
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/**
 * A fragment read into the band's drums: each role's line alone, in its
 * union with the workbench, played through cells' MIDI out over `bars`
 * bars, each hit's step read through the meter's swing undone. Only a meter
 * whose beat is a quarter of 4 sixteenths is read (every one a rhythm
 * fits).
 */
export function readFragment(
  fragment: string,
  workbench: string,
  bpm: number,
  meter: Meter,
  swing: MeterSwing,
  bars = 1,
): DrumHit[] {
  if (stepsOf(meter) !== 16 || meter.heights.length !== 4)
    throw new Error('only a bar of four quarters is read');
  const step = stepSeconds(bpm, meter);
  const unswung = leanMap(leansOf(swing), meter);
  const { line, terms } = cardOf(fragment);
  return terms
    .flatMap((term) => {
      const role = /^&(\w+)/.exec(term)![1]!;
      const alone = fragment.replace(line, line.replace(/\[.*\]$/, `[${term}]`));
      const plan = planOf(unionOf(alone, workbench).text);
      const route = router(plan.result, channelTable(plan.result));
      return windowAt(plan, 0, bars * 16 * step).events.flatMap((e) =>
        routesOf(route(e)).flatMap((r) => {
          const note = midiNote(e, r);
          if (!note || note.channel !== 10) return [];
          const at = unswung.written(note.at / step);
          const end = unswung.written(note.end / step);
          return [
            {
              role,
              sound: SOUND_OF_NOTE.get(note.note)!,
              note: note.note,
              step: near(at, Math.round(at)) ? Math.round(at) : at,
              length: near(end - at, Math.round(end - at)) ? Math.round(end - at) : end - at,
              velocity: note.velocity,
            },
          ];
        }),
      );
    })
    .sort((a, b) => a.step - b.step || a.note - b.note);
}

/** The drum-bar fragment E31 wrote for a preset. */
export const drumFragmentOf = (preset: string): Fragment =>
  RHYTHM_FRAGMENTS.find((f) => f.id === `${preset} drums`)!;

/** A straight 4/4 at a tempo, as a workbench. */
export const straightBench = (bpm: number) => hosted('&bar meter("4/4")', bpm);

/** E31's hits beside a fragment's read back: per preset, the hits, how many match (note, step, length, velocity and role), and the mismatches. */
export function e31Readback(
  bench: (preset: string, bpm: number) => { text: string; meter: Meter; swing: MeterSwing } = (
    _,
    bpm,
  ) => ({ text: straightBench(bpm), meter: METERS['4/4'], swing: { level: '16n', share: 0.5 } }),
): { preset: string; hits: number; matched: number; mismatches: string[] }[] {
  return witnesses().map((w) => {
    const { bpm } = w.bar.style;
    const b = bench(w.preset, bpm);
    const read = readFragment(drumFragmentOf(w.preset).text, b.text, bpm, b.meter, b.swing);
    const roleOf = (h: Hit) =>
      w.bar.dough.find((n) => n.part === 'drums' && n.step === h.step && n.note === h.note)!.role;
    const key = (h: { note: number; step: number }) => `${h.step}:${h.note}`;
    const byKey = new Map(read.map((h) => [key(h), h]));
    const mismatches: string[] = [];
    let matched = 0;
    for (const h of w.band) {
      const r = byKey.get(key(h));
      if (r && r.length === h.length && r.velocity === h.velocity && r.role === roleOf(h))
        matched++;
      else
        mismatches.push(
          `band ${JSON.stringify({ ...h, role: roleOf(h) })}, cells ${JSON.stringify(r ?? null)}`,
        );
    }
    const extra = read.filter((r) => !w.band.some((h) => key(h) === key(r)));
    mismatches.push(...extra.map((r) => `cells only ${JSON.stringify(r)}`));
    return { preset: w.preset, hits: w.band.length, matched, mismatches };
  });
}

/** A bar's drums as the drummer plays them: written step, note and role, played velocity. */
export function drummerHits(bar: BandBar): DrumHit[] {
  return bar.dough
    .filter((n) => n.part === 'drums')
    .map((n) => ({
      role: n.role!,
      sound: SOUND_OF_NOTE.get(n.note)!,
      note: n.note,
      step: n.step,
      length: 1,
      velocity: n.velocity,
    }));
}

const keyOf = (h: Pick<DrumHit, 'step' | 'note'>) => h.step * 128 + h.note;

/** How much two bars' hits overlap, by step and sound: shared over either's (Jaccard), 1 for two empty bars. */
export function overlap(a: readonly DrumHit[], b: readonly DrumHit[]): number {
  const [x, y] = [new Set(a.map(keyOf)), new Set(b.map(keyOf))];
  const union = new Set([...x, ...y]).size;
  return union === 0 ? 1 : [...x].filter((k) => y.has(k)).length / union;
}

/** A section's rhythm read for its bars: bar b plays the fragment's bar b mod 2 (a clave laps two). */
export interface ReadRhythm {
  readonly id: string;
  /** The fragment's hits over two bars, steps 0 to 31. */
  readonly hits: readonly DrumHit[];
}

/** The fragment's hits in a bar of the section, steps 0 to 15. */
export const barOf = (rhythm: Pick<ReadRhythm, 'hits'>, barInSection: number): DrumHit[] => {
  const lap = barInSection % 2;
  return rhythm.hits
    .filter((h) => Math.floor(h.step / 16) === lap)
    .map((h) => ({ ...h, step: h.step - lap * 16 }));
};

/**
 * Four ways a fragment could enter the drummer, each a bar from the
 * fragment's bar and the drummer's bar of the same place:
 *
 * - `bar`: the fragment is the bar, every bar of the section, its fill too;
 * - `roles`: the fragment says where, the drummer whether: each role the
 *   drummer plays in the bar, on the fragment's steps (a role it doesn't
 *   play, none), the fill the drummer's own;
 * - `thinned`: as `roles`, and at most as many hits a role as the drummer
 *   plays, the fragment's loudest first (then the earliest);
 * - `groove`: as `thinned`, and as many as the drummer plays: where it plays
 *   more of a role than the fragment holds, its own hits of that role on
 *   other steps, its loudest first, make up the count, so a role the
 *   fragment lacks is the drummer's own and the density by energy is the
 *   drummer's.
 *
 * In each but `bar`, a line of the fragment that names no role of the band
 * (a clave's `&clave`) plays as a line of its own.
 */
export const ENTRIES = ['bar', 'roles', 'thinned', 'groove'] as const;
export type Entry = (typeof ENTRIES)[number];

// the drummer's own roles: since #397's build the clave is a role too, but a line of its own
const isBandRole = (role: string) => (GROOVE_ROLES as readonly string[]).includes(role);
const loudFirst = (a: DrumHit, b: DrumHit) => b.velocity - a.velocity || a.step - b.step;

/** The bar an entry builds. */
export function entered(
  entry: Entry,
  fragment: readonly DrumHit[],
  drummer: readonly DrumHit[],
): DrumHit[] {
  if (entry === 'bar') return merged(fragment);
  const fill = drummer.filter((h) => h.role === 'fill');
  const own = fragment.filter((h) => !isBandRole(h.role));
  const roles = new Set(drummer.map((h) => h.role));
  const groove = [...roles]
    .filter((role) => role !== 'fill')
    .flatMap((role) => {
      const mine = fragment.filter((h) => h.role === role).sort(loudFirst);
      if (entry === 'roles') return mine;
      const theirs = drummer.filter((h) => h.role === role);
      const kept = mine.slice(0, theirs.length);
      if (entry === 'thinned') return kept;
      const steps = new Set(kept.map(keyOf));
      const more = theirs.filter((h) => !steps.has(keyOf(h))).sort(loudFirst);
      return [...kept, ...more.slice(0, theirs.length - kept.length)];
    });
  return merged([...groove, ...fill, ...own]);
}

/** Hits on one sound and step kept once, the stronger role's (the drummer's rule, `DRUM_ROLES`' order; a role it doesn't name, weakest). */
function merged(hits: readonly DrumHit[]): DrumHit[] {
  const rank = (role: string) => {
    const i = (DRUM_ROLES as readonly string[]).indexOf(role);
    return i < 0 ? DRUM_ROLES.length : i;
  };
  const kept = new Map<number, DrumHit>();
  for (const h of hits) {
    const there = kept.get(keyOf(h));
    if (!there || rank(h.role) < rank(there.role)) kept.set(keyOf(h), h);
  }
  return [...kept.values()].sort((a, b) => a.step - b.step || a.note - b.note);
}

/** The corpus with each section's rhythm: the answer, and the fragment read back under its workbench. */
export interface AskedSection extends CorpusSection {
  readonly workbench: string;
  readonly answer: RhythmAnswer;
  readonly rhythm: ReadRhythm | null;
  /** The fragment chosen with it, where one layers within `CO_SELECT`, read as well. */
  readonly withIt: ReadRhythm | null;
}

/**
 * The fragment chosen with a rhythm (decision 046): asked with the rhythm on
 * the workbench, and it among those chosen, the nearest other fragment that
 * fits and whose union renames none of its names, so it layers as a line of
 * its own; none past `within` (`CO_SELECT`).
 */
export function coSelect(
  repository: Repository,
  point: StylePoint,
  workbench: string,
  chosen: string,
  within = CO_SELECT,
): { id: string; distance: number } | null {
  const text = repository.fragments.find((f) => f.id === chosen)!.text;
  const bench = unionOf(text, workbench).text;
  const found = repository
    .query(
      point,
      repository.fragments.length,
      {},
      { facet: 'rhythm', workbench: bench, chosen: [chosen] },
    )
    .find((f) => f.fragment.id !== chosen && unionOf(f.fragment.text, bench).renamed.size === 0);
  return found && found.distance <= within
    ? { id: found.fragment.id, distance: found.distance }
    : null;
}

/** Every section of the corpus asked, each fragment read once for each workbench it meets. */
export function askCorpus(sections: readonly CorpusSection[] = corpus()): AskedSection[] {
  const repository = rhythmRepository();
  const reads = new Map<string, ReadRhythm>();
  const read = (id: string, bar: BandBar, workbench: string): ReadRhythm => {
    const key = `${id}\n${workbench}`;
    if (!reads.has(key)) {
      const text = repository.fragments.find((f) => f.id === id)!.text;
      reads.set(key, {
        id,
        hits: readFragment(text, workbench, bar.style.bpm, bar.meter, bar.swing, 2),
      });
    }
    return reads.get(key)!;
  };
  return sections.map((section) => {
    const first = section.bars[0]!;
    const workbench = workbenchOf(first);
    const answer = askRhythm(repository, section.point, workbench);
    if ('miss' in answer) return { ...section, workbench, answer, rhythm: null, withIt: null };
    const other = coSelect(repository, section.point, workbench, answer.id);
    return {
      ...section,
      workbench,
      answer,
      rhythm: read(answer.id, first, workbench),
      withIt: other ? read(other.id, first, workbench) : null,
    };
  });
}

const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** What sets a preset's fragment beside its drummer's bars. */
export interface Comparison {
  readonly preset: string;
  /** The rhythms its sections got, id to sections. */
  readonly found: Readonly<Record<string, number>>;
  readonly misses: number;
  /** The fragment's hits in a bar, and the drummer's mean, over the preset's bars. */
  readonly fragmentHits: number;
  readonly drummerHits: number;
  /** The drummer's mean hits a bar by section type. */
  readonly byType: Readonly<Record<string, number>>;
  /** The fragment's roles, and the share of the drummer's bars that play exactly those roles. */
  readonly fragmentRoles: readonly string[];
  readonly sameRoles: number;
  /** The share of sections whose last bar the drummer fills; the fragment fills every bar it is played as. */
  readonly drummerFills: number;
  /** The mean overlap of the drummer's bar with the fragment's (`overlap`), and the bars equal. */
  readonly overlap: number;
  readonly equalBars: number;
  /** The mean overlap of the drummer's bar with its own at another seed, the same bar where the section types agree. */
  readonly selfOverlap: number;
  /** The mean velocity apart, the fragment's against the drummer's, on hits both play. */
  readonly velocityApart: number;
  /** Each entry's mean overlap with the drummer's bar, its hits a bar, the drummer's hits a bar it doesn't play, its fills a section, and its hits a bar by section type. */
  readonly entries: Readonly<
    Record<
      Entry,
      {
        overlap: number;
        hits: number;
        moved: number;
        fills: number;
        byType: Record<string, number>;
        /** Its bars' overlap with its own at another seed, as `selfOverlap` is the drummer's. */
        self: number;
      }
    >
  >;
  /**
   * Where a fragment layers with the drum bar: its id, its hits a bar, how
   * many fall on a step and sound the drum bar strikes, and how many it adds
   * a bar to the `groove` entry's bar (a hit on a step and sound that bar
   * strikes is kept once, the band role's).
   */
  readonly withIt: { id: string; hits: number; onDrums: number; added: number } | null;
}

/** Two bars at the same place in two seeds' runs (seed s and the next), where their sections' types agree, each as `hitsAt` gives it: their overlaps. */
function selfOverlaps(
  sections: readonly AskedSection[],
  hitsAt: (s: AskedSection, barInSection: number) => DrumHit[],
): number[] {
  const at = new Map(sections.map((s) => [`${s.preset}|${s.seed}|${s.index}`, s]));
  return sections.flatMap((s) => {
    const other = at.get(`${s.preset}|${(s.seed % SEEDS.length) + 1}|${s.index}`);
    if (!other) return [];
    return s.bars.flatMap((bar, i) =>
      bar.plan.section.type === other.bars[i]!.plan.section.type
        ? [overlap(hitsAt(s, i), hitsAt(other, i))]
        : [],
    );
  });
}

const tally = (keys: readonly string[]) =>
  keys.reduce<Record<string, number>>((t, k) => ({ ...t, [k]: (t[k] ?? 0) + 1 }), {});

const meanBy = (rows: readonly { key: string; value: number }[]) => {
  const keys = [...new Set(rows.map((r) => r.key))];
  return Object.fromEntries(
    keys.map((k) => [k, mean(rows.filter((r) => r.key === k).map((r) => r.value))]),
  );
};

/** Each preset's fragment beside its drummer, over the corpus asked. */
export function compare(asked: readonly AskedSection[]): Comparison[] {
  return PRESETS.map(({ name }) => {
    const sections = asked.filter((s) => s.preset === name);
    const played = sections.filter((s) => s.rhythm);
    const bars = played.flatMap((s) =>
      s.bars.map((bar, i) => ({ bar, fragment: barOf(s.rhythm!, i), drummer: drummerHits(bar) })),
    );
    const first = played[0]?.rhythm;
    const fragmentRoles = first ? [...new Set(first.hits.map((h) => h.role))] : [];
    const roleKey = (hits: readonly DrumHit[]) =>
      [...new Set(hits.map((h) => h.role))].sort().join();
    const apart = bars.flatMap(({ fragment, drummer }) =>
      fragment.flatMap((f) => {
        const d = drummer.find((h) => keyOf(h) === keyOf(f));
        return d ? [Math.abs(f.velocity - d.velocity)] : [];
      }),
    );
    const entries = Object.fromEntries(
      ENTRIES.map((entry) => {
        const built = bars.map((b) => ({ ...b, built: entered(entry, b.fragment, b.drummer) }));
        const self = selfOverlaps(sections, (s, i) =>
          s.rhythm
            ? entered(entry, barOf(s.rhythm, i), drummerHits(s.bars[i]!))
            : drummerHits(s.bars[i]!),
        );
        return [
          entry,
          {
            overlap: mean(built.map((b) => overlap(b.built, b.drummer))),
            hits: mean(built.map((b) => b.built.length)),
            moved: mean(
              built.map((b) => {
                const there = new Set(b.built.map(keyOf));
                return b.drummer.filter((h) => !there.has(keyOf(h))).length;
              }),
            ),
            fills: mean(
              played.map(
                (s) =>
                  built.filter(
                    (b) => s.bars.includes(b.bar) && b.built.some((h) => h.role === 'fill'),
                  ).length,
              ),
            ),
            byType: meanBy(
              built.map((b) => ({ key: b.bar.plan.section.type, value: b.built.length })),
            ),
            self: mean(self),
          },
        ];
      }),
    ) as Comparison['entries'];
    const layered = played.filter((s) => s.withIt);
    const withIt = layered[0]
      ? {
          id: layered[0].withIt!.id,
          hits: layered[0].withIt!.hits.length / 2,
          onDrums: mean(
            [0, 1].map((lap) => {
              const drums = new Set(barOf(layered[0]!.rhythm!, lap).map(keyOf));
              return barOf(layered[0]!.withIt!, lap).filter((h) => drums.has(keyOf(h))).length;
            }),
          ),
          added: mean(
            layered.flatMap((s) =>
              s.bars.map((bar, i) => {
                const groove = entered('groove', barOf(s.rhythm!, i), drummerHits(bar));
                return merged([...groove, ...barOf(s.withIt!, i)]).length - groove.length;
              }),
            ),
          ),
        }
      : null;
    return {
      preset: name,
      found: tally(sections.flatMap((s) => ('miss' in s.answer ? [] : [s.answer.id]))),
      misses: sections.filter((s) => 'miss' in s.answer).length,
      fragmentHits: first ? first.hits.length / 2 : 0,
      drummerHits: mean(bars.map((b) => b.drummer.length)),
      byType: meanBy(bars.map((b) => ({ key: b.bar.plan.section.type, value: b.drummer.length }))),
      fragmentRoles,
      sameRoles: mean(bars.map((b) => Number(roleKey(b.drummer) === roleKey(b.fragment)))),
      drummerFills: mean(
        played.map((s) =>
          Number(drummerHits(s.bars[SECTION_BARS - 1]!).some((h) => h.role === 'fill')),
        ),
      ),
      overlap: mean(bars.map((b) => overlap(b.fragment, b.drummer))),
      equalBars: bars.filter((b) => overlap(b.fragment, b.drummer) === 1).length,
      selfOverlap: mean(selfOverlaps(sections, (s, i) => drummerHits(s.bars[i]!))),
      velocityApart: mean(apart),
      entries,
      withIt,
    };
  });
}

/** The section's point with its energy the section's own (its first bar's), as a variant of what the composer could ask with. */
export const sectionPoint = (s: CorpusSection): StylePoint => ({
  ...s.point,
  energy: s.bars[0]!.barEnergy,
});

/** The band roles a fragment's lines name (none for a clave's `&clave`). */
export const bandRolesOf = (text: string): string[] =>
  cardOf(text)
    .terms.map((term) => /^&(\w+)/.exec(term)![1]!)
    .filter(isBandRole);

/** The sections whose rhythm, asked at the section's energy (`sectionPoint`), is another than at the style's: each with what it finds there, and whether that names no band role. */
export function atSectionEnergy(
  asked: readonly AskedSection[],
): { preset: string; type: string; id: string; noRole: boolean }[] {
  const repository = rhythmRepository();
  return asked.flatMap((s) => {
    const there = askRhythm(repository, sectionPoint(s), s.workbench);
    const id = 'miss' in there ? `miss: ${there.miss}` : there.id;
    if ('miss' in s.answer || id === s.answer.id) return [];
    const text = repository.fragments.find((f) => f.id === id)?.text;
    return [
      {
        preset: s.preset,
        type: s.bars[0]!.plan.section.type,
        id,
        noRole: text !== undefined && bandRolesOf(text).length === 0,
      },
    ];
  });
}

/** Over a grid of the four unit axes (`n` points an axis), what the composer finds: the meter, then the rhythm with that meter as the workbench (4/4 where the meter misses). */
export function gridAnswers(n: number, bpm = 120): Record<'found' | 'fit' | 'distance', number> {
  const repository = rhythmRepository();
  const benches = new Map(METER_FRAGMENTS.map((f) => [f.id, hosted(f.text, bpm)]));
  const song = hosted('&bar meter("4/4")', bpm);
  const axis = Array.from({ length: n }, (_, i) => i / (n - 1));
  const counts = { found: 0, fit: 0, distance: 0 };
  for (const sync of axis)
    for (const harm of axis)
      for (const artic of axis)
        for (const energy of axis) {
          const meter = composedMeter(METER_REPOSITORY, { sync, harm, artic, energy }, null);
          const bench = meter ? benches.get(meter.id)! : song;
          const answer = askRhythm(repository, { sync, harm, artic, energy }, bench);
          counts['miss' in answer ? answer.miss : 'found']++;
        }
  return counts;
}

/** Every meter the band plays from the repository, as the workbench at every preset's point: the answer. */
export function meterSweep(bpm = 120): { meter: string; preset: string; answer: RhythmAnswer }[] {
  const repository = rhythmRepository();
  return [...METER_REPOSITORY.fragments.keys()].flatMap((id) =>
    PRESETS.map((p) => ({
      meter: id,
      preset: p.name,
      answer: askRhythm(
        repository,
        stylePoint(p.style),
        hosted(METER_FRAGMENTS.find((f) => f.id === id)!.text, bpm),
      ),
    })),
  );
}

/** What a query costs, in milliseconds: with no workbench, with one the repository has seen, and with one it hasn't (a repository new for each), each the median over the sections given. */
export function queryCost(
  sections: readonly CorpusSection[],
  now: () => number,
): { none: number; seen: number; unseen: number } {
  const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  const time = (f: () => unknown) => {
    const t = now();
    f();
    return now() - t;
  };
  const seenRepo = rhythmRepository();
  const benches = sections.map((s) => workbenchOf(s.bars[0]!));
  // warm: the compiler's first run, and every workbench once in the repository that has seen them
  askRhythm(rhythmRepository(), sections[0]!.point, benches[0]!);
  benches.forEach((b, i) => askRhythm(seenRepo, sections[i]!.point, b));
  return {
    none: median(
      sections.map((s) => time(() => seenRepo.query(s.point, 1, {}, { facet: 'rhythm' }))),
    ),
    seen: median(sections.map((s, i) => time(() => askRhythm(seenRepo, s.point, benches[i]!)))),
    unseen: median(
      sections.map((s, i) => {
        const fresh = rhythmRepository();
        return time(() => askRhythm(fresh, s.point, benches[i]!));
      }),
    ),
  };
}

const fixed = (x: number, digits = 2) => x.toFixed(digits);

/** The comparison as lines to read: a preset a line, then each entry. */
export function report(comparisons: readonly Comparison[]): string {
  return comparisons
    .map((c) =>
      [
        `${c.preset}: ${Object.entries(c.found)
          .map(([id, n]) => `${id} ×${n}`)
          .join(', ')}; misses ${c.misses}`,
        `  fragment ${c.fragmentHits} hits (${c.fragmentRoles.join(' ')}); drummer ${fixed(c.drummerHits)} a bar (${Object.entries(
          c.byType,
        )
          .map(([t, n]) => `${t} ${fixed(n, 1)}`)
          .join(', ')}); fills ${fixed(c.drummerFills)} of sections`,
        `  overlap ${fixed(c.overlap)}, the drummer with itself at another seed ${fixed(c.selfOverlap)}; same roles ${fixed(c.sameRoles, 3)}; velocity apart ${fixed(c.velocityApart, 1)}`,
        ...ENTRIES.map((entry) => {
          const e = c.entries[entry];
          return `  ${entry}: overlap ${fixed(e.overlap)}, self ${fixed(e.self)}, hits ${fixed(e.hits)}, moved ${fixed(e.moved)}, fills ${fixed(e.fills)}`;
        }),
        ...(c.withIt
          ? [
              `  with it: ${c.withIt.id}, ${c.withIt.hits} hits a bar, ${c.withIt.onDrums} on the drum bar's, adds ${fixed(c.withIt.added)} to the groove's`,
            ]
          : []),
      ].join('\n'),
    )
    .join('\n');
}
