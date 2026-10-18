/**
 * The section plan: the machine at section rate.
 *
 * At each section boundary it reads the seed, the section's index, the style
 * where the section starts, and the key the players wish for. It advances
 * the form, moves the key one step toward the wish (`nextKey`), picks the
 * melodic scale the lead walks (the wish's where the style reaches it, else
 * the style's default, #209), takes the meter asked for (#261) and the
 * level its swing leans (#360), or where none is asked for, the meter the
 * composer finds in the repository at the style (#375, `sectionMeter`), and
 * picks the section's theme. Where the band was given a learned layer
 * (#398), the composer asks with it, and a meter it keeps from the
 * repository is learned as a use at the section's point, which the plans
 * carry to the next section's query (`layer.ts`). First, at each section's
 * start, the Muse files what she heard played on drums over the section
 * before (#401, `museFiled`): the drummer's groove where it invented on a
 * miss, and each player's, in the layer and in the composer's short-term
 * memory (`short-term.ts`), whose fragments every query of the section names
 * as chosen, so the meter and the groove pull each other. The composer tires
 * of a groove it plays (#411, `novelty.ts`): bored, it varies it and files
 * the variation (`climbed`), and past that it rejects it, so the drummer
 * invents again where nothing else fits. The band
 * holds the plan for the section's eight bars, so a new key, scale or theme
 * arrives only at a boundary, as does a new meter or swing level.
 *
 * Where the players wish for no tonic and the mode playing, the band may move
 * the key itself (#169): the harmony's reach (`harmonicReach`) gives how far,
 * the entropy how readily, and its harmonic history (`history.ts`) where to,
 * leaning toward the key the history weighs most. It returns the same way:
 * after a move the key it left still weighs most, so it leans back.
 *
 * Themes return: an A theme for the grooves and drops, a B theme for the
 * contrast. A returning theme is built anew when the mode has changed, when
 * the harmony has moved more than 0.2 from the one it was built for, or at
 * random, the more often the higher the entropy (at most three times in
 * ten). A build is always built afresh.
 */

import { type Meter, fifthsIndex, mod, stepsOf } from '@jambot/theory';
import { leaning } from './fading.ts';
import { SECTION_BARS, type Section, form } from './form.ts';
import { type HarmonicWeights, keyWeight } from './history.ts';
import { INITIAL_KEY, type Key, type KeyWish, type MelodicScale, nextKey } from './key.ts';
import { harmonicReach, licenceOf, melodicDefault } from './licence.ts';
import { SONG_METER } from './events.ts';
import type { Machine } from './machine.ts';
import type { LearnedLayer } from './layer.ts';
import {
  type MeterFragment,
  type MeterRepository,
  type StylePoint,
  composedMeter,
  stylePoint,
} from './meter-query.ts';
import { type HeardGroove, distilledGroove } from './muse-groove.ts';
import {
  type Boredom,
  type Lineage,
  NO_BOREDOM,
  boredAfter,
  familyOf,
  lineageOf,
  pullOf,
  rejectedOf,
  variedGroove,
  wantsVariation,
} from './novelty.ts';
import { NO_SHORT_TERM, type ShortTerm, chosenOf, remembered } from './short-term.ts';
import {
  type RhythmBench,
  type RhythmRepository,
  type SectionRhythm,
  composedRhythm,
} from './rhythm-query.ts';
import { chance, draw, pick } from './random.ts';
import type { Style } from './style.ts';
import type { SwingLevel } from './swing.ts';
import { type Theme, buildTheme, themeKind } from './themes.ts';

export interface PlanEnv {
  readonly seed: number;
  readonly index: number;
  /** The style where the section starts. */
  readonly style: Style;
  /** The key the players wish for: a mode, and a tonic or none; and a melodic scale or none. */
  readonly wish: KeyWish;
  /** What the band's harmony has sounded lately, which its own moves lean toward. */
  readonly history: HarmonicWeights;
  /** The meter asked for, which the plan takes at a section's boundary as it takes the key (#261). */
  readonly meter?: Meter | undefined;
  /** The level the meter asked for swings on, which the plan takes as it takes the meter (#360); the 16ths where none is. */
  readonly swing?: SwingLevel | undefined;
  /**
   * The repository the composer asks for the section's meter where none is
   * asked for (#375); the song's 4/4 where there is none either.
   */
  readonly repository?: MeterRepository | undefined;
  /**
   * What the host has learned, which the song starts from (#398): the
   * composer asks the repository with it, and the plans carry it on, each
   * meter kept a use. With none, it asks with nothing learned and learns
   * nothing.
   */
  readonly layer?: LearnedLayer | undefined;
  /**
   * The repository the composer asks for the section's rhythm, with its
   * meter as the workbench (#397); with none, or on a miss, the drummer
   * invents its own.
   */
  readonly rhythms?: RhythmRepository | undefined;
  /**
   * What the Muse heard played on drums over the section before (#401): the
   * drummer's bars where it invented on a miss, and each player's; she
   * files each source's groove at the section's end, where there is a layer
   * to file in and a repository that files (`museFiled`).
   */
  readonly heard?: readonly HeardGroove[] | undefined;
  /** The session the band plays in, which a groove filed is tagged with; none playing alone. */
  readonly session?: string | undefined;
}

/**
 * What a section plays: where it stands in the form, its key and its meter,
 * the lead's melodic scale over the key, and its theme. The key and the
 * meter are its two frames (C3), held for its eight bars.
 */
export interface Plan {
  readonly section: Section;
  readonly key: Key;
  /** The meter of each of the section's bars (#261). */
  readonly meter: Meter;
  /**
   * The level the section's meter swings on (#360): its share glides on the
   * style's time (`SwingTrack`), and the level changes only here, where a
   * section starts, since nothing jumps.
   */
  readonly swing: SwingLevel;
  /**
   * The share the section's meter swings at, where the composer took it
   * from the repository (#375): a feel is one fragment, held for the
   * section. Absent where the meter was asked for, and the share glides on
   * the swing track.
   */
  readonly share?: number;
  /** The repository's meter fragment the section plays, by id, where it plays one (#375). */
  readonly meterFragment?: string;
  /** The repository's rhythm fragment the drummer plays the section from (`groove.ts`), by id, where it found one (#397). */
  readonly rhythmFragment?: string;
  /** The fragment chosen with the rhythm, a line of its own (a clave), by id, where one layers (#397). */
  readonly claveFragment?: string;
  readonly melodic: MelodicScale;
  readonly theme: Theme;
}

export interface PlanCarried {
  /** The plan of the section before. */
  readonly before: Plan | null;
  /** The themes that return. */
  readonly themes: { readonly A: Theme | null; readonly B: Theme | null };
  /**
   * What the band has learned as of the next section (#398): the layer it
   * started from (`PlanEnv.layer`) with every meter kept since; null before
   * the first section, or where it was given none.
   */
  readonly layer: LearnedLayer | null;
  /** The composer's short-term memory as the section before left it (#401, `short-term.ts`). */
  readonly shortTerm: ShortTerm;
  /** The point the section before was asked at, where a groove heard in it is filed; null before the first. */
  readonly asked: StylePoint | null;
  /** The composer's boredom with the grooves it played lately, as the section before left it (#411, `novelty.ts`). */
  readonly boredom: Boredom;
}

/** How far the harmony may move from a returning theme's before it is built anew. */
export const THEME_REACH = 0.2;

/** How likely the band is to move the key itself at a section boundary, at entropy 1. */
export const KEY_JUMP = 0.6;

/**
 * How sharply the band leans toward the key its history weighs most: each
 * candidate is picked in proportion to its weight to this power.
 */
const LEAN = 4;

/**
 * Where the band would move the key itself from `key` at section `index`, or
 * null to stay: with a chance of `KEY_JUMP` times the entropy, to a key in
 * the same mode within the harmony's reach, each picked by how much its scale
 * weighs in the history.
 */
export function bandWish(
  { seed, index, style, history }: Pick<PlanEnv, 'seed' | 'index' | 'style' | 'history'>,
  key: Key,
): Pick<KeyWish, 'tonic' | 'mode'> | null {
  const reach = harmonicReach(style);
  if (reach === 0 || !chance(draw(seed, 'keyJump', index), style.entropy * KEY_JUMP)) return null;
  // In one mode, keys lie as many fifths apart as their tonics do on the wheel.
  const home = fifthsIndex(key.tonic);
  const candidates = [...Array(12).keys()]
    .filter((tonic) => {
      const apart = Math.abs(mod(fifthsIndex(tonic) - home + 6, 12) - 6);
      return apart > 0 && apart <= reach;
    })
    .map((tonic) => ({ tonic, mode: key.mode }));
  const weights = candidates.map((c) => keyWeight(history, c));
  return candidates[pick(draw(seed, 'keyJump', index, 1), leaning(weights, LEAN))]!;
}

/** A section's meter: the meter, the level it swings on, and where the composer took it from the repository, the share and the fragment. */
export type SectionMeter = Pick<Plan, 'meter' | 'swing' | 'share' | 'meterFragment'>;

/**
 * The meter a section takes where it starts: the one asked for, with the
 * level asked for; where none is, the one the composer finds in the
 * repository at the style (`composedMeter`), asked with the pull of use
 * together its entropy sets (#389, `pullOf`); on a miss, the section
 * before's; and where there is nothing else, the song's 4/4.
 */
export function sectionMeter(
  env: Pick<PlanEnv, 'meter' | 'swing' | 'repository' | 'style' | 'layer'>,
  before: SectionMeter | null,
  chosen: readonly string[] = [],
): SectionMeter {
  return composedSection(env, before, chosen).meter;
}

/** A section's meter (`sectionMeter`), and the fragment the composer found for it in the repository: null where it found none. */
function composedSection(
  {
    meter,
    swing = '16n',
    repository,
    style,
    layer,
  }: Pick<PlanEnv, 'meter' | 'swing' | 'repository' | 'style' | 'layer'>,
  before: SectionMeter | null,
  chosen: readonly string[],
): { readonly meter: SectionMeter; readonly found: MeterFragment | null } {
  if (meter) return { meter: { meter, swing }, found: null };
  const found = repository
    ? composedMeter(
        repository,
        style,
        before?.meterFragment ?? null,
        layer,
        chosen,
        pullOf(style.entropy),
      )
    : null;
  if (found)
    return {
      meter: {
        meter: found.meter,
        swing: found.swing.level,
        share: found.swing.share,
        meterFragment: found.id,
      },
      found,
    };
  if (repository && before) {
    const { meter: kept, swing: level, share, meterFragment } = before;
    return {
      meter: {
        meter: kept,
        swing: level,
        ...(share === undefined ? {} : { share }),
        ...(meterFragment === undefined ? {} : { meterFragment }),
      },
      found: null,
    };
  }
  return { meter: { meter: SONG_METER, swing }, found: null };
}

/**
 * What the band has learned once a section is planned (#398): the layer
 * with the meter the composer found and kept, a use at the section's point,
 * the style it asked at; the layer as it was where it found none, or where
 * the repository learns nothing.
 */
function learnedFrom(
  { repository, style }: Pick<PlanEnv, 'repository' | 'style'>,
  layer: LearnedLayer,
  found: MeterFragment | null,
): LearnedLayer {
  return found && repository?.used ? repository.used(layer, found.id, stylePoint(style)) : layer;
}

/**
 * The rhythm a section takes where it starts, after its meter: the one the
 * composer finds in the repository at the style, fitting the section's meter
 * (`composedRhythm`), the section before's held, none of those `rejected`;
 * none with no repository or on a miss, where the drummer invents. It asks
 * with the pull of use together its entropy sets (#389, `pullOf`).
 */
export function sectionRhythm(
  { rhythms, style, layer }: Pick<PlanEnv, 'rhythms' | 'style' | 'layer'>,
  meter: SectionMeter,
  before: SectionRhythm | null,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
): SectionRhythm {
  return rhythms
    ? composedRhythm(
        rhythms,
        style,
        { meter: meter.meter, meterFragment: meter.meterFragment },
        before,
        layer,
        chosen,
        rejected,
        pullOf(style.entropy),
      )
    : {};
}

/**
 * The layer with a section's rhythm and clave, where it found them, learned
 * as used together at the section's point (#398), and each as used together
 * with the section's meter fragment (#401), which this use doesn't move.
 */
function rhythmLearned(
  { rhythms, style }: Pick<PlanEnv, 'rhythms' | 'style'>,
  layer: LearnedLayer,
  { rhythmFragment, claveFragment }: SectionRhythm,
  meterFragment: string | undefined,
): LearnedLayer {
  const ids = [rhythmFragment, claveFragment].filter((id) => id !== undefined);
  return ids.length && rhythms?.used
    ? rhythms.used(
        layer,
        ids,
        stylePoint(style),
        meterFragment === undefined ? [] : [meterFragment],
      )
    : layer;
}

/** The tag every groove the Muse files carries, beside the session's name where there is one. */
export const GROOVE_TAG = 'groove';

/** A filed groove's tags: `groove`, and the session's name where there is one. */
const grooveTags = (session: string | undefined): string[] => [
  GROOVE_TAG,
  ...(session === undefined ? [] : [session]),
];

/** Who makes a variation of a groove (#411): the composer, as a groove heard names who played it. */
export const COMPOSER = 'composer';

/**
 * The novelty ladder where a section's rhythm is found (#411, `novelty.ts`):
 * where the rhythm is a groove the layer filed, the lineage its family
 * belongs to (`familyOf`); where the composer is bored enough to vary it,
 * one variation of it (`variedGroove`, drawn by the groove's place in the
 * layer, so a forecast varies it as the band will), filed in the layer at
 * the point the section is asked at, on its bench, by the composer, created
 * at its first bar, tagged as the Muse's grooves are and naming the groove
 * it varies, and played in its place. The rhythm and the layer as they
 * were, and no lineage, where the rhythm is no groove.
 */
function climbed(
  {
    rhythms,
    style,
    seed,
    index,
    session,
  }: Pick<PlanEnv, 'rhythms' | 'style' | 'seed' | 'index' | 'session'>,
  layer: LearnedLayer,
  boredom: Boredom,
  rhythm: SectionRhythm,
  bench: RhythmBench,
): {
  readonly rhythm: SectionRhythm;
  readonly layer: LearnedLayer;
  readonly playing: Lineage | null;
} {
  const id = rhythm.rhythmFragment;
  const position = layer.filed.findIndex((f) => f.fragment.id === id);
  if (!rhythms || id === undefined || position === -1) return { rhythm, layer, playing: null };
  const lineage = lineageOf(boredom, familyOf(layer, id));
  const read =
    wantsVariation(lineage) && rhythms.file ? rhythms.read(id, bench.meter, layer) : null;
  const hits =
    read && read.bars === 1
      ? variedGroove(read.hits, stepsOf(bench.meter), draw(seed, 'grooveVariation', position))
      : null;
  if (!hits) return { rhythm, layer, playing: lineage };
  const filed = rhythms.file!(layer, {
    hits,
    bench,
    point: stylePoint(style),
    source: COMPOSER,
    created: `song ${seed}, bar ${index * SECTION_BARS}`,
    tags: grooveTags(session),
    varies: id,
  });
  const grooves = lineage.grooves.includes(filed.id)
    ? lineage.grooves
    : [...lineage.grooves, filed.id];
  return {
    rhythm: { ...rhythm, rhythmFragment: filed.id },
    layer: filed.layer,
    playing: { ...lineage, grooves },
  };
}

/**
 * What the Muse files at a section's end (#401): each source's groove heard
 * over the section before, distilled (`distilledGroove`) and filed in the
 * layer at the point that section was asked at, in its meter, created at its
 * first bar on the song's clock, tagged `groove` and the session, and used
 * together with its meter fragment. The layer as it was, and nothing filed,
 * where the repository files nothing or no source played a groove.
 */
export function museFiled(
  { rhythms, heard = [], seed, index, session }: PlanEnv,
  layer: LearnedLayer,
  before: Plan,
  point: StylePoint,
): { readonly layer: LearnedLayer; readonly ids: readonly string[] } {
  if (!rhythms?.file) return { layer, ids: [] };
  let filedLayer = layer;
  const ids: string[] = [];
  for (const { source, bars } of heard) {
    const hits = distilledGroove(bars);
    if (!hits) continue;
    const filed = rhythms.file(filedLayer, {
      hits,
      bench: { meter: before.meter, meterFragment: before.meterFragment },
      point,
      source,
      created: `song ${seed}, bar ${(index - 1) * SECTION_BARS}`,
      tags: grooveTags(session),
    });
    filedLayer = filed.layer;
    if (!ids.includes(filed.id)) ids.push(filed.id);
  }
  return { layer: filedLayer, ids };
}

export const planner: Machine<PlanEnv, PlanCarried, null, Plan> = {
  initial: {
    before: null,
    themes: { A: null, B: null },
    layer: null,
    shortTerm: NO_SHORT_TERM,
    asked: null,
    boredom: NO_BOREDOM,
  },
  advance(given, { before, themes, layer: learned, shortTerm, asked, boredom }) {
    // The layer the song started from, until the first section has learned;
    // with what the Muse heard over the section before filed in it.
    const start = learned ?? given.layer;
    const filed =
      start && before && asked ? museFiled(given, start, before, asked) : { layer: start, ids: [] };
    const layer = filed.layer;
    const memory = remembered(shortTerm, filed.ids);
    const chosen = chosenOf(memory);
    const env = { ...given, layer };
    const { seed, index, style, wish } = env;
    const section = form.advance({ seed, index, style }, before?.section ?? null, null).output;
    const from = before?.key ?? INITIAL_KEY;
    // The players' wish wins: a tonic, or a mode other than the one playing.
    const own =
      before && wish.tonic === null && wish.mode === from.mode ? bandWish(env, from) : null;
    const key = nextKey(from, own ?? wish);
    const melodic =
      wish.melodic !== null && licenceOf(style).melodic.includes(wish.melodic)
        ? wish.melodic
        : melodicDefault(style);
    const kind = themeKind(section.type);
    const held = kind === 'build' ? null : themes[kind];
    const theme =
      held &&
      held.mode === key.mode &&
      Math.abs(held.harm - style.harm) <= THEME_REACH &&
      !chance(draw(seed, 'themeRenewal', index), style.entropy * 0.3)
        ? held
        : buildTheme({
            seed,
            index,
            kind,
            key,
            harm: style.harm,
            entropy: style.entropy,
            a: themes.A,
          });
    const composed = composedSection(env, before, chosen);
    const { meterFragment } = composed.meter;
    const found = sectionRhythm(
      env,
      composed.meter,
      before,
      [...chosen, ...(meterFragment === undefined ? [] : [meterFragment])],
      rejectedOf(boredom),
    );
    // Bored with a groove, the composer varies it, and the variation plays in its place.
    const ladder = layer
      ? climbed(env, layer, boredom, found, { meter: composed.meter.meter, meterFragment })
      : { rhythm: found, layer, playing: null };
    const { rhythm } = ladder;
    const plan = { section, key, ...composed.meter, ...rhythm, melodic, theme };
    const kept = [meterFragment, rhythm.rhythmFragment, rhythm.claveFragment].filter(
      (id) => id !== undefined,
    );
    return {
      carried: {
        before: plan,
        themes: kind === 'build' ? themes : { ...themes, [kind]: theme },
        layer: ladder.layer
          ? rhythmLearned(
              env,
              learnedFrom(env, ladder.layer, composed.found),
              rhythm,
              meterFragment,
            )
          : null,
        shortTerm: remembered(memory, kept, 1),
        asked: stylePoint(style),
        boredom: boredAfter(boredom, ladder.playing, style.entropy),
      },
      output: plan,
    };
  },
};
