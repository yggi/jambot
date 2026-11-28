/**
 * Cells' repository of rhythms, as the composer asks it (#397): cells'
 * `RHYTHM_FRAGMENTS` (v0.9.0: E31's eight drum bars and five claves), ranked
 * by cells' own `query` on the facet `rhythm` with the section's meter as
 * the workbench, so only the rhythms that fit it rank (cells' fit, decision
 * 047), and each read by cells' own compiler and MIDI out into hits a role a
 * line (`readRhythm`, E36's reading, 144 of E31's 144 hits).
 *
 * The workbench is the section's meter fragment, its tempo set as
 * `repository.ts` reads a meter (any tempo: a fragment is open on its
 * tempo), or, for a meter asked for, the meter named. A fragment is read
 * under its meter played straight, the swing left out, since the band swings
 * its hits as it swings its own (E36: a Euclid on `1m` stays straight under
 * a swung meter in cells, yggi/cells#121). Fragments are ranked by cells'
 * `query` and filtered by cells' `fitsAs`, the fit its query's workbench
 * applies, each fit and read kept for the repository's life, so a section
 * asks again at the cost of a lookup. A fit not yet tested costs a compile
 * (2 to 15 ms), too much for a section's start while the band plays, so
 * the host warms the repository first (`warm`, over `RHYTHM_BENCHES`),
 * a step at a time, at idle.
 *
 * A groove the Muse files (#401) joins the rhythms through the layer: ranked
 * with them, held by its text there, read and fitted as they are. Filing
 * keeps its reading and its fit to the bench it was played on, which the
 * round trip gives (`muse-groove.ts`), so the section that takes it at once
 * compiles only its union with the bench, and those of the few fragments
 * within a clave's reach (whether a fragment layers with a rhythm is tested
 * one fragment at a time, only for those a section could take). The rest,
 * its fits, reads and unions on every bench, the host warms after filing,
 * or after loading a layer that filed it (#412: `warm` given the layer), so
 * no later section compiles them.
 *
 * A rhythm is varied by cells' vary (#442, yggi/cells decision 052): every
 * variation of its text by one of cells' rhythm operators on one line, on
 * the bench's workbench, which sets the anchors cells derives (the kick's
 * line and the backbeat's), beside the lines the composer keeps
 * (`GROOVE_KEEP`, the fill), each kept for the repository's life and
 * warmed with the rhythm's fit and read; the one a draw takes is read back
 * by its varied line alone, over the rhythm's lap (E39): cells' `hitsOf`,
 * two compiles, the varied text and its lap. */

import { METERS, type Meter, type MeterName, stepsOf } from '@jambot/theory';
import { variationBy } from '@yggi/cells';
import { setTiming, type Variation, drawn, variations } from '@yggi/cells/edit';
import {
  answered,
  cachedFit,
  unionOf,
  declarations,
  hasFrom,
  type Fragment,
  createRepository,
  fileFragment,
  hitsOf,
  type Hit,
  useFragments,
} from '@yggi/cells/repository';
import { isLibraryFragment, resolveSeed } from '@yggi/cells/library';
import { instrumentsFor, withInstruments } from './instruments.ts';
import { METER_FRAGMENTS, RHYTHM_FRAGMENTS } from './library.ts';
import { DRUM_ORDER, type DrumRole, sameMeter } from './events.ts';
import { type Ask, askOptions } from './facet.ts';
import {
  BENCH,
  BENCH_FRAGMENT,
  HASH,
  type LearnedLayer,
  cappedLayer,
  recordedHashIs,
  stillHeld,
} from './layer.ts';
import type { StylePoint } from './meter-query.ts';
import { METER_REPOSITORY } from './repository.ts';
import { GROOVE_FEWEST, grooveText, roleOfSound } from './muse-groove.ts';
import { BY, GROOVE_KEEP } from './novelty.ts';
import {
  type FragmentHit,
  type FragmentRead,
  type RhythmBench,
  type RhythmRepository,
  isOwnLine,
} from './rhythm-query.ts';

/** The compiles kept: every fragment, workbench and union the benches meet, a few hundred, with room. */
const COMPILES = 2048;

/** The tempo a fragment is fitted and read at: any, since it is open on its tempo. */
const READ_AT = 120;

/** A meter's name as cells writes it in `meter("…")`, or null for one cells has no name for. */
const nameOf = (meter: Meter): MeterName | null =>
  (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], meter)) ?? null;

/**
 * A groove's lines (cells v0.24.0, #634): a seed groove is a template whose lines are its heads and whose drums are
 * optional parameters, each `gm_kit`'s own line by default (`&bd, &sd, &hh from gm_kit`). Its lines alone, signature
 * and `from` lines aside, read those drums by their names, as cells' `sameText` reads a held template, and are the text
 * the groove was before: the band reads, fits, unions and varies them, and the kit's lines its voices are filled from
 * (`withInstruments`) are those same defaults. A `from` line that takes a built-in fill (`&euclidLevel from
 * metric_accent(…)`, cells v0.29.0) is one of its lines, written out as the levels it answers (cells' `answered`), not
 * one to leave out with the kit's. A text with no `from` line (a groove the Muse filed) is itself.
 */
export const grooveLines = (text: string): string =>
  hasFrom(text)
    ? answered(text)
        .split('\n')
        .filter((line) => !hasFrom(line))
        .join('\n')
    : text;

/** A meter played straight, at the reading tempo. */
const straight = (name: MeterName) => `&bar meter("${name}") step=${READ_AT}bpm`;

/**
 * A rhythm on a workbench, as cells' fit reads it (#562): a rhythm is a collection, judged by its lines, so its text is
 * their union with the workbench, and `union` what became of its names there (renamed where the workbench defines one
 * by another line). Cached by text, as the fit is.
 */
const onBench = cachedFit(resolveSeed, COMPILES);

/** A rhythm's union with a workbench, its text: cells' `unionOf`, written with no compile. */
const unionText = (text: string, workbench: string): string => unionOf(text, workbench).text;

/** Each text's declarations (cells' `declarations`), kept by text, the last `COMPILES`. */
const declared = new Map<string, ReturnType<typeof declarations>>();
function declarationsOf(text: string): ReturnType<typeof declarations> {
  let lines = declared.get(text);
  if (!lines) {
    lines = declarations(text);
    declared.set(text, lines);
    if (declared.size > COMPILES) declared.delete(declared.keys().next().value!);
  }
  return lines;
}

/**
 * Whether a text's union with a workbench renames any of its names, `unionOf(text, bench).renamed.size > 0`: whether a
 * name both declare is declared by different lines, which is where cells' union by lines renames first. Each text's
 * declarations are read once: the warm-up asks it of each rhythm beside each other on every bench (11,594 pairs), and
 * `unionOf` reads both texts at each ask, 1.4 s more at song start. `rhythms.test.ts` holds the two equal on every pair.
 */
export function collides(text: string, bench: string): boolean {
  const there = new Map(declarationsOf(bench).map((l) => [l.name, l.code]));
  return declarationsOf(text).some((l) => there.has(l.name) && there.get(l.name) !== l.code);
}

/** The workbench of a bench: its meter fragment at the reading tempo, or the meter named. */
export function benchText({ meter, meterFragment }: RhythmBench): string | null {
  const fragment = METER_FRAGMENTS.find((f) => f.id === meterFragment);
  if (fragment) return setTiming(fragment.text, 'bar', 'step', `${READ_AT}bpm`);
  const name = nameOf(meter);
  return name ? straight(name) : null;
}

/**
 * A hit's role: its line's name, where that is one of the drummer's roles; else the role of the sound it strikes, as the
 * Muse hears a player's (`roleOfSound`: Electro swing drums' `&clap` the backbeat, its `&hats` and `&ticks` the hat, the
 * ghost of its snare a ghost; #508, the owner's ruling). Null for a sound outside the kit.
 *
 * The role a line declares (`role=`, which cells' `hitsOf` gives) is not read yet: at cells v0.29.0 every line of the 33
 * rhythms declares one, and 15 of the 407 hits in 4/4 declare another than this reading gives (`march_drums`' snare on
 * the offbeats and `trip_hop_drums`' on the half a backbeat, not a ghost; `quiet_pulse`'s claves a clave, not a hat), and
 * more in the other meters (the claps and snares of `acid_drums`, `happy_hardcore_drums` and `shanty_drums` on the
 * backbeat its meter doesn't name), so reading it would change what the band plays (#742).
 */
const roleOf = ({ line, note, step }: Hit, meter: Meter): DrumRole | null =>
  (DRUM_ORDER as readonly string[]).includes(line)
    ? (line as DrumRole)
    : roleOfSound(note, step % stepsOf(meter), meter);

/**
 * A fragment's hits under a meter played straight, over its lap (the most
 * bars a line of it laps, `cycle=`): cells' `hitsOf`, its lines read from one
 * compile in their union with the meter, through cells' MIDI out on channel
 * 10, each hit on its role (`roleOf`). Null where the meter has no name in
 * cells, the fragment no mix of its lines, a hit falls off the steps, or one
 * strikes a sound the drummer has no role for.
 */
export function readRhythm(template: string, meter: Meter): FragmentRead | null {
  return readLines(grooveLines(template), meter);
}

/**
 * A fragment's drums under a meter, a bar of them, its signature aside (as `readFill`): the drums an ending lands with
 * (#646), each hit on its line's role, and a sound the drummer has no role for (a crash, a stomp) an ostinato, an accent
 * beside the groove's roles. `context` is what its other lines read beside the meter (an ending's key).
 */
export function readDrums(template: string, meter: Meter, context = ''): FragmentRead | null {
  const lines = answered(template)
    .split('\n')
    .filter((line) => !/ from \(/.test(line));
  return readLines([context, ...lines].join('\n'), meter, 1, undefined, 'ostinato');
}

/**
 * A fragment's hits (`readRhythm`), each line's, or one line's alone where its name is given, over the fragment's own
 * lap, or `bars` where given: cells' `hitsOf`, one compile (and the one that finds its lap).
 */
function readLines(
  text: string,
  meter: Meter,
  bars?: number,
  only?: string,
  otherwise?: DrumRole,
): FragmentRead | null {
  const name = nameOf(meter);
  if (!name) return null;
  const read = hitsOf(withInstruments(text), straight(name), { resolve: resolveSeed });
  if (!read) return null;
  const lap = bars ?? read.bars;
  const steps = stepsOf(meter) * lap;
  const hits: FragmentHit[] = [];
  for (const hit of read.hits) {
    if (only !== undefined && hit.line !== only) continue;
    if (!Number.isInteger(hit.step)) return null;
    if (hit.step >= steps) continue;
    const role = roleOf(hit, meter) ?? otherwise ?? null;
    if (role === null) return null;
    hits.push({
      role,
      ...(role === hit.line ? {} : { line: hit.line }),
      note: hit.note,
      step: hit.step,
      velocity: hit.velocity,
    });
  }
  return { bars: lap, hits: inOrder(hits) };
}

/**
 * A read as the band plays it: each hit its role, its note, its step and its velocity, the line it was read from left
 * behind (the repository keeps it, to vary a line by its name), so what the Muse files is what was played.
 */
const played = (read: FragmentRead): FragmentRead => ({
  bars: read.bars,
  hits: read.hits.map(({ role, note, step, velocity }) => ({ role, note, step, velocity })),
});

/** Hits in the order a read gives them: by step, then note. */
const inOrder = (hits: readonly FragmentHit[]): FragmentHit[] =>
  [...hits].sort((a, b) => a.step - b.step || a.note - b.note);

/** A meter's key in the caches: its cycle and pulses. */
const meterKey = (meter: Meter) => `${meter.cycle}:${meter.heights.join(' ')}`;

/** Whether a fragment fits a workbench: cells' `fitsAs` (#562), its compiles cached by text. */
export type RhythmFit = (fragment: string, workbench: string) => boolean;

/** Cells' fit, with a cache of compiles and answers of its own, its `from` lines read from cells' seed library. */
export function cellsFit(): RhythmFit {
  const fit = cachedFit(resolveSeed, COMPILES);
  return (fragment, workbench) => fit(fragment, workbench).fits;
}

/** Whether a fragment is a rhythm: associated as one at some point. */
const isRhythmFragment = (fragment: Fragment) =>
  fragment.association.some((p) => p.facet === 'rhythm');

/** Whether a filed fragment is a rhythm. */
const isRhythm = ({ fragment }: LearnedLayer['filed'][number]) => isRhythmFragment(fragment);

/**
 * The rhythms held of each list of fragments, kept by the list: a read of each is a compile, about 100 ms over cells'
 * seed, which every repository made of the seed (one for each groove a test files) would otherwise pay again.
 */
const HELD = new WeakMap<readonly Fragment[], readonly Fragment[]>();

/**
 * The fragments the drummer holds, each rhythm by its lines (`grooveLines`: what is fitted, read, unioned, layered,
 * varied and filed beside), and any other fragment as it is (a count of cells v0.30.0 is `from` lines alone, which
 * would leave it no text): all but a rhythm it can't play, one with no mix of lines (`hitsOf`) or a line that strikes a sound it
 * has no role for (`roleOf`), read in 4/4. Of cells' seed that is every rhythm, 33 of 33 at cells v0.29.0, `salsa_drums`'
 * tumbao on the toms an ostinato (#651, #717).
 */
export function heldRhythms(fragments: readonly Fragment[] = RHYTHM_FRAGMENTS): Fragment[] {
  let held = HELD.get(fragments);
  if (!held)
    HELD.set(
      fragments,
      (held = fragments
        .filter((f) => !isRhythmFragment(f) || readRhythm(f.text, METERS['4/4']) !== null)
        .map((f) => (isRhythmFragment(f) ? { ...f, text: grooveLines(f.text) } : f))),
    );
  return [...held];
}

/** What cells' variations of a rhythm are asked with on a workbench, by the composer's policy (`novelty.ts`). */
const variationOptions = (text: string, workbench: string) => ({
  // (the workbench brings the instruments the rhythm strikes, so the text varied is the rhythm's own)
  workbench: [workbench, ...instrumentsFor(text)].join('\n'),
  keep: GROOVE_KEEP,
  fewest: GROOVE_FEWEST,
  resolve: resolveSeed,
});

/**
 * A rhythm varied as the composer plays it: the line the variation rewrites read back over the rhythm's lap and put in
 * place of that line's hits in the whole (`whole`, the rhythm's read), as the band plays them (`played`). A variation
 * rewrites one line, so only that line's hits are kept of its text's (`hitsOf`: two compiles, where a line compiled
 * alone was one). Null where the line doesn't read.
 */
function variedGroove(
  text: string,
  variation: Variation,
  meter: Meter,
  whole: FragmentRead,
): FragmentRead | null {
  const name = variation.line.slice(1);
  const line = readLines(variation.apply(text), meter, whole.bars, name);
  if (line === null) return null;
  return played({
    bars: whole.bars,
    hits: inOrder([...whole.hits.filter((h) => (h.line ?? h.role) !== name), ...line.hits]),
  });
}

/** A groove variation's bench as its meta keeps it (`BENCH`, `BENCH_FRAGMENT`): its meter's name and its meter fragment. */
const benchMeta = (bench: RhythmBench): Record<string, string> => {
  const name = nameOf(bench.meter);
  if (name === null) return {};
  return {
    [BENCH]: name,
    ...(bench.meterFragment === undefined ? {} : { [BENCH_FRAGMENT]: bench.meterFragment }),
  };
};

/**
 * A groove variation's text rebuilt from its source (#553): the variation of `source` that cells names `by`, made on
 * the bench its meta keeps without the others (cells' `variationBy`), played as the composer played it (`variedGroove`)
 * and stated as the repository files it (`grooveText`). Null where the bench, the source's read or the variation is
 * gone.
 */
export function rebuiltGroove(
  source: string,
  by: string,
  meter: string,
  meterFragment?: string,
): string | null {
  const at = METERS[meter as MeterName];
  if (at === undefined) return null;
  const workbench = benchText({ meter: at, ...(meterFragment ? { meterFragment } : {}) });
  const whole = readRhythm(source, at);
  if (workbench === null || whole === null) return null;
  const variation = variationBy(source, by, variationOptions(source, workbench));
  const read = variation && variedGroove(source, variation, at, whole);
  return read ? grooveText(read.hits, stepsOf(at)) : null;
}

/** What a stored layer gave back (`rebuiltLayer`): the layer, and the ids of the references it could not rebuild. */
export interface RebuiltLayer {
  readonly layer: LearnedLayer;
  readonly dropped: readonly string[];
}

/**
 * A layer as it was stored (`storedLayer`), its groove variations given their texts back (#553): each rebuilt from its
 * source, a seed rhythm by its lines (`heldRhythms`) or a groove filed before it, and kept where the text rebuilt has
 * the hash stored (`recordedHashIs`: a hash kept before cells v0.31.0 checks as it was recorded). One that doesn't
 * (its source gone, or cells' variation of that name moved at another pin) is dropped and named, never played
 * otherwise than it was filed.
 */
export function rebuiltLayer(stored: LearnedLayer): RebuiltLayer {
  const texts = new Map(heldRhythms().map((f) => [f.id, f.text]));
  const dropped: string[] = [];
  const filed = stored.filed.flatMap((file) => {
    const hash = file.meta[HASH];
    if (file.fragment.text !== '' || typeof hash !== 'string') {
      texts.set(file.fragment.id, file.fragment.text);
      return [file];
    }
    const source = texts.get(String(file.meta['varies']));
    const fragment = file.meta[BENCH_FRAGMENT];
    const text =
      source === undefined
        ? null
        : rebuiltGroove(
            source,
            String(file.meta[BY]),
            String(file.meta[BENCH]),
            typeof fragment === 'string' ? fragment : undefined,
          );
    if (text === null || !recordedHashIs(hash, text)) {
      dropped.push(file.fragment.id);
      return [];
    }
    texts.set(file.fragment.id, text);
    const meta = Object.fromEntries(Object.entries(file.meta).filter(([key]) => key !== HASH));
    return [{ ...file, fragment: { ...file.fragment, text }, meta }];
  });
  return { layer: dropped.length || filed.length ? { ...stored, filed } : stored, dropped };
}

/** A repository of these rhythms, ranked by cells' query on the facet `rhythm`, filtered by the fit and read by `read` (cells', unless a test counts them). */
export function rhythmRepository(
  fragments: readonly Fragment[] = RHYTHM_FRAGMENTS,
  // (by default the union's own fit, `onBench`, so a fit and a union asked alike compile once)
  fit: RhythmFit = (fragment, workbench) => onBench(fragment, workbench).fits,
  read: (text: string, meter: Meter) => FragmentRead | null = readRhythm,
): RhythmRepository {
  fragments = heldRhythms(fragments);
  // (the rhythms, and every other fragment of the library known, which a rhythm query never ranks: so a rhythm and the
  // meter it was kept with count as used together, yggi/cells#861)
  const cells = createRepository(fragments, { known: isLibraryFragment });
  const texts = new Map(fragments.map((f) => [f.id, f.text]));
  const textOf = (id: string, layer?: LearnedLayer) =>
    texts.get(id) ?? layer?.filed.find((f) => f.fragment.id === id)?.fragment.text;
  // (every fit tested, every read, each bench's workbench, each rhythm's union with one, whether a fragment
  // layers there, and each rhythm warmed on a workbench, by text: kept for the repository's life, a few
  // hundred of each at most, and a few dozen more for every groove filed)
  const fitted = new Map<string, boolean>();
  const reads = new Map<string, FragmentRead | null>();
  const workbenches = new Map<string, string | null>();
  const withIts = new Map<string, string>();
  const layering = new Map<string, boolean>();
  const warmed = new Set<string>();
  const varied = new Map<string, readonly Variation[]>();
  const fits = (text: string, workbench: string) => {
    const key = `${workbench.length}:${workbench}${text}`;
    if (!fitted.has(key)) fitted.set(key, fit(text, workbench));
    return fitted.get(key)!;
  };
  const benchKey = (bench: RhythmBench) => `${bench.meterFragment ?? ''}\n${meterKey(bench.meter)}`;
  const benchOf = (bench: RhythmBench) => {
    const key = benchKey(bench);
    if (!workbenches.has(key)) workbenches.set(key, benchText(bench));
    return workbenches.get(key)!;
  };
  const withItOf = (chosen: string, workbench: string) => {
    const key = `${chosen}\n${workbench}`;
    if (!withIts.has(key)) withIts.set(key, unionText(chosen, workbench));
    return withIts.get(key)!;
  };
  // Whether a seed fragment layers with `chosen` on the workbench: another text, whose union with theirs renames none
  // of its names. Tested one fragment at a time, so a section tests it only for those within its reach. One that
  // layers fits the union where it fits the workbench, over every seed rhythm on every bench (`rhythms.test.ts`), so
  // its fit is the workbench's, compiled once for every rhythm chosen beside it.
  const layersWith = (id: string, chosen: string, workbench: string) => {
    const key = `${id}\n${chosen}\n${workbench}`;
    if (!layering.has(key)) {
      const text = texts.get(id);
      layering.set(
        key,
        text !== undefined && text !== chosen && !collides(text, withItOf(chosen, workbench)),
      );
    }
    return layering.get(key)!;
  };
  // Ranked as cells' query ranks them, the seed's every rhythm and the grooves filed (#401), those `own` admits (its fit
  // on the bench, whether the drummer reads it); with an ask, cells' query tests that only for one that could be taken.
  const found = (
    point: StylePoint,
    layer: LearnedLayer | undefined,
    chosen: readonly string[],
    own: (fragment: Fragment) => boolean,
    ask: Ask | undefined,
    pull: number | undefined,
  ) => {
    const all = fragments.length + (layer?.filed.length ?? 0);
    const asked = cells.query(
      point,
      ask?.k ?? all,
      {},
      {
        facet: 'rhythm',
        ...(layer ? { layer } : {}),
        ...(chosen.length ? { chosen } : {}),
        ...(pull === undefined ? {} : { pull }),
        ...(ask ? askOptions(ask, own) : {}),
      },
    );
    return (ask ? asked : asked.filter((f) => own(f.fragment))).map((f) => ({
      id: f.fragment.id,
      distance: f.distance,
    }));
  };
  const readText = (text: string, meter: Meter) => {
    const key = `${text}\n${meterKey(meter)}`;
    if (!reads.has(key)) reads.set(key, read(text, meter));
    return reads.get(key)!;
  };
  // Whether the band can read a fragment under a meter: one cells fits but the drummer can't read (a hit between the
  // bar's sixteenths, yggi/cells#360) is no find, so a section never names a rhythm that would play the drummer's own.
  const readable = (text: string, meter: Meter) => readText(text, meter) !== null;
  // Every variation of a rhythm on a workbench, by the composer's policy (`novelty.ts`): cells' rhythm operators on
  // every line but its anchors and those kept, none of fewer hits than a groove holds.
  const variationsOn = (text: string, workbench: string) => {
    const key = `${workbench.length}:${workbench}${text}`;
    if (!varied.has(key)) varied.set(key, variations(text, variationOptions(text, workbench)));
    return varied.get(key)!;
  };
  return {
    query(point, bench, layer, chosen = [], ask, pull) {
      const workbench = benchOf(bench);
      if (workbench === null) return [];
      const own = (f: Fragment) => fits(f.text, workbench) && readable(f.text, bench.meter);
      return found(point, layer, chosen, own, ask, pull);
    },
    layered(point, bench, chosen, layer, ask, more = [], pull) {
      const workbench = benchOf(bench);
      const chosenText = textOf(chosen, layer);
      if (workbench === null || chosenText === undefined) return [];
      const own = (f: Fragment) =>
        layersWith(f.id, chosenText, workbench) &&
        fits(f.text, workbench) &&
        readable(f.text, bench.meter);
      return found(point, layer, [chosen, ...more], own, ask, pull);
    },
    used: (layer, ids, point, alongside = []) =>
      cappedLayer(
        useFragments(cells, layer, [
          ...stillHeld(cells, layer, ids).map((id) => ({ id, point, facet: 'rhythm' })),
          ...stillHeld(cells, layer, alongside).map((id) => ({ id })),
        ]),
      ),
    file(layer, { hits, bench, point, source, created, tags, varies, by }) {
      // (a groove heard that is a seed's exactly, hit for hit, is a use of that seed, not a fragment of its own, #553; never
      // the composer's variation, which stays of its groove's family, so the ladder rejects what it varied)
      // (asked of the seeds that fit the bench alone, whose reads the repository warms: no compile on the clock)
      const heard = JSON.stringify(inOrder(hits));
      const bench_ = benchOf(bench);
      const seed = fragments.find((f) => {
        if (varies !== undefined || bench_ === null || !fits(f.text, bench_)) return false;
        const read = readText(f.text, bench.meter);
        return read !== null && read.bars === 1 && JSON.stringify(played(read).hits) === heard;
      });
      if (seed !== undefined) {
        const { meterFragment } = bench;
        const used = useFragments(cells, layer, [
          { id: seed.id, point, facet: 'rhythm' },
          ...(meterFragment === undefined ? [] : [{ id: meterFragment }]),
        ]);
        return { layer: cappedLayer(used), id: seed.id, held: true };
      }
      const text = grooveText(hits, stepsOf(bench.meter));
      const filed = fileFragment(cells, layer, {
        text,
        point,
        facet: 'rhythm',
        source,
        created,
        meta: {
          tags: [...tags],
          ...(varies === undefined ? {} : { varies }),
          ...(by === undefined ? {} : { [BY]: by }),
          // (a variation keeps the bench it was made on, so a stored layer rebuilds its text from its source: #553)
          ...(varies === undefined || by === undefined ? {} : benchMeta(bench)),
        },
      });
      // (filing is its use at the point; beside the meter fragment it was played in, a use together)
      const { meterFragment } = bench;
      const together =
        meterFragment === undefined
          ? filed.layer
          : useFragments(cells, filed.layer, [{ id: filed.id }, { id: meterFragment }]);
      // (the round trip: a groove stated from its hits reads back as them, and fits the bench it was played on)
      const known = `${text}\n${meterKey(bench.meter)}`;
      if (filed.file && !reads.has(known)) reads.set(known, { bars: 1, hits: inOrder(hits) });
      const workbench = benchOf(bench);
      if (filed.file && workbench !== null)
        fitted.set(`${workbench.length}:${workbench}${text}`, true);
      return { layer: cappedLayer(together), id: filed.id, held: filed.file === null };
    },
    read(id, meter, layer) {
      const text = textOf(id, layer);
      const read = text === undefined ? null : readText(text, meter);
      return read && played(read);
    },
    vary(id, bench, draw, layer) {
      const text = textOf(id, layer);
      const workbench = benchOf(bench);
      const whole = text === undefined ? null : readText(text, bench.meter);
      if (text === undefined || workbench === null || whole === null) return null;
      const all = variationsOn(text, workbench);
      if (!all.length) return null;
      const variation = all[drawn(draw, all.length)]!;
      const varied = variedGroove(text, variation, bench.meter, whole);
      return varied && { hits: varied.hits, by: variation.by };
    },
    *warm(benches, layer) {
      // (cells' rhythms, and the grooves the layer filed, newest first; a rhythm warmed on a workbench takes no step again)
      const rhythms = [
        ...(layer?.filed ?? [])
          .filter(isRhythm)
          .map((f) => f.fragment.text)
          .reverse(),
        ...fragments.map((f) => f.text),
      ];
      for (const bench of benches) {
        const asked = workbenches.has(benchKey(bench));
        const workbench = benchOf(bench);
        if (!asked) yield;
        if (workbench === null) continue;
        for (const text of rhythms) {
          const done = `${workbench.length}:${workbench}${text}`;
          if (warmed.has(done)) continue;
          warmed.add(done);
          if (!fits(text, workbench)) {
            yield;
            continue;
          }
          const got = readText(text, bench.meter);
          yield;
          // (and its variations, where the composer could vary it there: a bar of a drum bar's lines, so its ask reads one line)
          if (got !== null && got.bars === 1 && !isOwnLine(got)) {
            variationsOn(text, workbench);
            yield;
          }
          withItOf(text, workbench);
          yield;
          for (const other of fragments) {
            if (layersWith(other.id, text, workbench)) {
              fits(other.text, workbench);
              readText(other.text, bench.meter);
            }
            yield;
          }
        }
      }
    },
  };
}

/**
 * Every bench a section can ask on: each meter the meter repository plays,
 * from its fragment, and each named meter a person can ask for. Warming the
 * repository on them (`RhythmRepository.warm`) leaves no section a fit to
 * compile.
 */
export const RHYTHM_BENCHES: readonly RhythmBench[] = [
  ...[...METER_REPOSITORY.fragments.values()].map((f) => ({ meter: f.meter, meterFragment: f.id })),
  ...Object.values(METERS).map((meter) => ({ meter })),
];

/** Cells' rhythms, as the composer asks them. */
export const RHYTHM_REPOSITORY: RhythmRepository = rhythmRepository();
