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
 * of a rhythm it plays, a seed rhythm or a groove filed (#411, #414,
 * `novelty.ts`): bored, it varies it and files the variation (`climbed`),
 * and past that it rejects it, with the clave first chosen with it, so the next
 * nearest plays, or the drummer invents where nothing else fits. After the
 * rhythm, the composer asks for the section's bass line the same way (#423,
 * the loop of `facet.ts` for the facet `bass`, `sectionLine`): it climbs the
 * same ladder, and where it finds none the bass plays its own, which the Muse
 * files with a player's bass at the section's end (`museFiledLines`). After
 * the bass line, the lead's (#424, the facet `lead`, `sectionLead`): a line
 * the Muse filed of a player's motif, or of the lead's own on a miss
 * (`museFiledLeads`), which the lead plays as its phrase's shape. The band
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
 * the harmony has moved more than 0.2 from the one it was built for, at
 * random, the more often the higher the entropy (at most three times in
 * ten), or when the composer has rejected its progression. A build is always
 * built afresh. Where it builds one, the composer asks the repository for a
 * progression (#425, `sectionTheme`, the loop of `facet.ts` for the facet
 * `harmony`), A and B each with the other chosen; on a miss the mode's
 * tables write it (`buildTheme`). The Muse files the progressions players
 * play a section after their own ends, once its last bars are heard
 * (`museFiledHarmonies`).
 */

import { type Meter, fifthsIndex, mod, stepsOf } from '@jambot/theory';
import { leaning } from './fading.ts';
import { type Section, form } from './form.ts';
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
import { BASS_FACET, type LineNote, type LineRepository, composedLine } from './bass-query.ts';
import { LEAD_FACET, type LeadNote, type LeadRepository, composedLead } from './lead-query.ts';
import { distilledLead } from './muse-lead.ts';
import {
  HARMONY_FACET,
  type HarmonyRepository,
  type HarmonySlot,
  composedHarmony,
  themeOf,
} from './harmony-query.ts';
import { distilledProgression } from './muse-harmony.ts';
import {
  type Bench,
  type FilingAt,
  type HeardBars,
  climbedFigure,
  figureLearned,
  filedHeard,
} from './facet.ts';
import { type HeardGroove, distilledGroove } from './muse-groove.ts';
import { distilledLine } from './muse-line.ts';
import {
  type Boredom,
  type ClaveOwners,
  type Lineage,
  NO_BOREDOM,
  NO_CLAVE_OWNERS,
  boredAfter,
  pullOf,
  rejectedOf,
  ownedWith,
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
import { type Theme, type ThemeKind, buildTheme, themeKind } from './themes.ts';

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
  /** The share the meter asked for swings at where the section starts, which a section's meter from the repository replaces with its own (#360); straight where none. */
  readonly share?: number | undefined;
  /**
   * The repository the composer asks for the section's bass line, with its
   * meter as the bench (#423, `bass-query.ts`); with none, or on a miss, the
   * bass plays its own.
   */
  readonly bassLines?: LineRepository | undefined;
  /**
   * What the Muse heard played as a bass over the section before (#423): the
   * bass's own bars where it played its own on a miss, and each player's;
   * she files each source's line at the section's end, as she does a groove.
   */
  readonly bassHeard?: readonly HeardBars<readonly LineNote[]>[] | undefined;
  /**
   * The repository the composer asks for the section's lead line, with its
   * meter as the bench (#424, `lead-query.ts`); with none, or on a miss, the
   * lead plays its own.
   */
  readonly leads?: LeadRepository | undefined;
  /**
   * What the Muse heard played as a lead over the section before (#424): the
   * lead's own bars where it played its own on a miss, and each player's
   * motifs; she files each source's line at the section's end.
   */
  readonly leadHeard?: readonly HeardBars<readonly LeadNote[]>[] | undefined;
  /**
   * The repository the composer asks for a theme where it builds one (#425,
   * `harmony-query.ts`); with none, or on a miss, the mode's tables write it
   * (`buildTheme`).
   */
  readonly harmonies?: HarmonyRepository | undefined;
  /**
   * What the Muse heard players play as chords over the section before the
   * one before (#425): each player's eight bars, each its slots where she
   * read it, else null. A section's last bars are heard only once the next
   * is planned, so she files a progression a section later than a line.
   */
  readonly harmonyHeard?: readonly HeardBars<readonly HarmonySlot[] | null>[] | undefined;
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
  /** The drum bar each clave was first chosen to layer on (#430, `novelty.ts`): the lineage it is rejected with. */
  readonly claveOwners: ClaveOwners;
  /**
   * The bass line the section before plays from (#423, `bass-query.ts`), by
   * id; null where it found none, and the bass plays its own. Carried here,
   * not on the plan: a plan travels to a session's clients as protocol 14
   * has it, and a client plays the bass's notes it is sent.
   */
  readonly bassFragment: string | null;
  /** The lead line the section before plays from (#424, `lead-query.ts`), by id, carried as the bass line is; null where it found none, and the lead plays its own. */
  readonly leadFragment: string | null;
  /** The progression each returning theme plays (#425, `harmony-query.ts`), by id; null where the tables wrote it. */
  readonly themeFragments: { readonly A: string | null; readonly B: string | null };
  /** The point the section before the one before was asked at, and its bench: where a progression heard in it is filed (#425); null before it. */
  readonly earlier: { readonly point: StylePoint; readonly bench: Bench } | null;
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

/** The tag every groove the Muse files carries, beside the session's name where there is one. */
export const GROOVE_TAG = 'groove';

/**
 * Where, when and by whom a section's filings are made (`facet.ts`): the
 * section's seed and index, the point it is asked at, and the tags a filing
 * carries.
 */
const filingAt = (
  { seed, index, session }: Pick<PlanEnv, 'seed' | 'index' | 'session'>,
  point: StylePoint,
  tag: string = GROOVE_TAG,
): FilingAt => ({ seed, index, point, tags: [tag, ...(session === undefined ? [] : [session])] });

/** The tag every bass line the Muse or the composer files carries, beside the session's name where there is one (#423). */
export const LINE_TAG = 'bass line';

/**
 * The novelty ladder where a section's rhythm is found (#411, #414,
 * `facet.ts`'s `climbedFigure` for the facet `rhythm`, its variations drawn
 * from `grooveVariation`): bored enough, the composer varies the drum bar
 * and the variation plays in its place, the clave beside it.
 */
function climbed(
  env: Pick<PlanEnv, 'rhythms' | 'style' | 'seed' | 'index' | 'session'>,
  layer: LearnedLayer,
  boredom: Boredom,
  rhythm: SectionRhythm,
  bench: RhythmBench,
): {
  readonly rhythm: SectionRhythm;
  readonly layer: LearnedLayer;
  readonly playing: Lineage | null;
} {
  const climb = climbedFigure(
    env.rhythms,
    'rhythm',
    'grooveVariation',
    filingAt(env, stylePoint(env.style)),
    layer,
    boredom,
    rhythm.rhythmFragment,
    bench,
  );
  return {
    rhythm: climb.id === rhythm.rhythmFragment ? rhythm : { ...rhythm, rhythmFragment: climb.id! },
    layer: climb.layer,
    playing: climb.playing,
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
  given: PlanEnv,
  layer: LearnedLayer,
  before: Plan,
  point: StylePoint,
): { readonly layer: LearnedLayer; readonly ids: readonly string[] } {
  return filedHeard(
    given.rhythms,
    given.heard ?? [],
    (bars) => {
      const hits = distilledGroove(bars);
      return hits && { hits };
    },
    { meter: before.meter, meterFragment: before.meterFragment },
    filingAt({ ...given, index: given.index - 1 }, point),
    layer,
  );
}

/** What the Muse files of the bass at a section's end (#423): each source's recurring line heard over the section before (`distilledLine`), as `museFiled` files a groove. */
export function museFiledLines(
  given: PlanEnv,
  layer: LearnedLayer,
  before: Plan,
  point: StylePoint,
): { readonly layer: LearnedLayer; readonly ids: readonly string[] } {
  return filedHeard(
    given.bassLines,
    given.bassHeard ?? [],
    (bars) => {
      const notes = distilledLine(bars);
      return notes && { notes };
    },
    { meter: before.meter, meterFragment: before.meterFragment },
    filingAt({ ...given, index: given.index - 1 }, point, LINE_TAG),
    layer,
  );
}

/**
 * The bass line a section takes where it starts, after its meter and
 * rhythm (#423): the one the composer finds in the repository at the style,
 * read under the section's meter (`composedLine`), the section before's
 * held, none of those `rejected`, a walk only under a meter that swings its
 * 8ths; none with no repository or on a miss, where the bass plays its own.
 * It asks with the pull of use together its entropy sets (#389, `pullOf`).
 */
/**
 * The layer with a section's progression learned (#425): a use at the
 * section's point, counted as used together with those `alongside` (the
 * section's meter fragment, and the other returning theme's progression,
 * so A and B pull each other), which this use doesn't move; as it was where
 * the tables wrote the theme, or the repository learns nothing.
 */
function harmonyLearned(
  repository: HarmonyRepository | undefined,
  layer: LearnedLayer,
  id: string | null,
  alongside: readonly string[],
  point: StylePoint,
): LearnedLayer {
  return id !== null && repository?.used ? repository.used(layer, [id], point, alongside) : layer;
}

/** The tag every lead line the Muse or the composer files carries, beside the session's name where there is one (#424). */
export const LEAD_TAG = 'lead line';

/**
 * What the Muse files of the lead at a section's end (#424): each source's recurring line heard over the section before
 * (`distilledLead`), as `museFiledLines` files a bass line, its notes those within a bar of the section's meter: a note
 * past it is the next bar's, which the line's text can't hold (a 4/4 motif heard in a bar of 3/4, `leadText`).
 */
export function museFiledLeads(
  given: PlanEnv,
  layer: LearnedLayer,
  before: Plan,
  point: StylePoint,
): { readonly layer: LearnedLayer; readonly ids: readonly string[] } {
  return filedHeard(
    given.leads,
    given.leadHeard ?? [],
    (bars) => {
      const notes = distilledLead(bars)?.filter((n) => n.step < stepsOf(before.meter));
      return notes?.length ? { notes } : null;
    },
    { meter: before.meter, meterFragment: before.meterFragment },
    filingAt({ ...given, index: given.index - 1 }, point, LEAD_TAG),
    layer,
  );
}

/**
 * The lead line a section takes where it starts, after its bass line
 * (#424): the one the composer finds in the repository at the style, a bar
 * it can read under the section's meter (`composedLead`), the section
 * before's held, none of those `rejected`; none with no repository or on a
 * miss, where the lead plays its own. It asks with the pull of use together
 * its entropy sets (#389, `pullOf`).
 */
export function sectionLead(
  { leads, style, layer }: Pick<PlanEnv, 'leads' | 'style' | 'layer'>,
  meter: SectionMeter,
  before: string | undefined,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
): string | undefined {
  return leads
    ? composedLead(
        leads,
        style,
        { meter: meter.meter, meterFragment: meter.meterFragment },
        before,
        layer,
        chosen,
        rejected,
        pullOf(style.entropy),
      )
    : undefined;
}

/** The tag every progression the Muse files carries, beside the session's name where there is one (#425). */
export const HARMONY_TAG = 'progression';

/**
 * What the Muse files of the harmony at a section's start (#425): each
 * player's progression heard over the section before the one before
 * (`distilledProgression`), filed at the point that section was asked at,
 * on its bench, created at its first bar.
 */
export function museFiledHarmonies(
  given: PlanEnv,
  layer: LearnedLayer,
  earlier: { readonly point: StylePoint; readonly bench: Bench },
): { readonly layer: LearnedLayer; readonly ids: readonly string[] } {
  return filedHeard(
    given.harmonies,
    given.harmonyHeard ?? [],
    (bars) => {
      const notes = distilledProgression(bars);
      return notes && { notes };
    },
    earlier.bench,
    filingAt({ ...given, index: given.index - 2 }, earlier.point, HARMONY_TAG),
    layer,
  );
}

/** A section's theme, and the progression it plays where the composer found one. */
export interface SectionTheme {
  readonly theme: Theme;
  readonly fragment: string | null;
}

/**
 * The theme a section builds (#425): the progression the composer finds in
 * the repository at the style (`composedHarmony`), A and B each asked with
 * the other chosen, as strongly as its entropy sets (#389, `pullOf`), none
 * of those `rejected`, read as a theme (`themeOf`); with no repository or
 * on a miss, the one the mode's tables write (`buildTheme`).
 */
export function sectionTheme(
  {
    harmonies,
    style,
    layer,
    seed,
    index,
  }: Pick<PlanEnv, 'harmonies' | 'style' | 'layer' | 'seed' | 'index'>,
  kind: ThemeKind,
  key: Key,
  bench: Bench,
  themes: PlanCarried['themes'],
  fragments: PlanCarried['themeFragments'],
  rejected: readonly string[] = [],
): SectionTheme {
  const at = { kind, index, mode: key.mode, harm: style.harm };
  const other = kind === 'A' ? fragments.B : kind === 'B' ? fragments.A : null;
  const id = harmonies
    ? composedHarmony(harmonies, style, bench, {
        at,
        draw: draw(seed, 'theme', index, 0),
        a: fragments.A ?? undefined,
        chosen: other === null ? [] : [other],
        rejected,
        layer,
        pull: pullOf(style.entropy),
      })
    : undefined;
  const read = id === undefined ? null : harmonies!.read(id, bench.meter, layer);
  if (id !== undefined && read) return { theme: themeOf(read, at), fragment: id };
  return {
    theme: buildTheme({
      seed,
      index,
      kind,
      key,
      harm: style.harm,
      entropy: style.entropy,
      a: themes.A,
    }),
    fragment: null,
  };
}

export function sectionLine(
  { bassLines, style, layer, share }: Pick<PlanEnv, 'bassLines' | 'style' | 'layer' | 'share'>,
  meter: SectionMeter,
  before: string | undefined,
  chosen: readonly string[] = [],
  rejected: readonly string[] = [],
): string | undefined {
  return bassLines
    ? composedLine(
        bassLines,
        style,
        { meter: meter.meter, meterFragment: meter.meterFragment },
        { level: meter.swing, share: meter.share ?? share ?? 0.5 },
        stepsOf(meter.meter),
        before,
        layer,
        chosen,
        rejected,
        pullOf(style.entropy),
      )
    : undefined;
}

export const planner: Machine<PlanEnv, PlanCarried, null, Plan> = {
  initial: {
    before: null,
    themes: { A: null, B: null },
    layer: null,
    shortTerm: NO_SHORT_TERM,
    asked: null,
    boredom: NO_BOREDOM,
    claveOwners: NO_CLAVE_OWNERS,
    bassFragment: null,
    leadFragment: null,
    themeFragments: { A: null, B: null },
    earlier: null,
  },
  advance(
    given,
    {
      before,
      themes,
      layer: learned,
      shortTerm,
      asked,
      boredom,
      claveOwners,
      bassFragment,
      leadFragment,
      themeFragments,
      earlier,
    },
  ) {
    // The layer the song started from, until the first section has learned;
    // with what the Muse heard over the section before filed in it.
    const start = learned ?? given.layer;
    const grooves =
      start && before && asked ? museFiled(given, start, before, asked) : { layer: start, ids: [] };
    const filed =
      grooves.layer && before && asked
        ? museFiledLines(given, grooves.layer, before, asked)
        : { layer: grooves.layer, ids: [] };
    const motifs =
      filed.layer && before && asked
        ? museFiledLeads(given, filed.layer, before, asked)
        : { layer: filed.layer, ids: [] };
    const progressions =
      motifs.layer && earlier
        ? museFiledHarmonies(given, motifs.layer, earlier)
        : { layer: motifs.layer, ids: [] };
    const layer = progressions.layer;
    // (a progression filed isn't remembered short-term: the harmony is pulled by its other theme alone)
    const memory = remembered(shortTerm, [...grooves.ids, ...filed.ids, ...motifs.ids]);
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
    const composed = composedSection(env, before, chosen);
    const { meterFragment } = composed.meter;
    const bench = { meter: composed.meter.meter, meterFragment };
    const rejected = rejectedOf(boredom, claveOwners);
    const kind = themeKind(section.type);
    const held = kind === 'build' ? null : themes[kind];
    const heldFragment = kind === 'build' ? null : themeFragments[kind];
    // (a theme returns unless the mode or the harmony moved, at random, or the composer tired of its progression)
    const returns =
      held &&
      held.mode === key.mode &&
      Math.abs(held.harm - style.harm) <= THEME_REACH &&
      !chance(draw(seed, 'themeRenewal', index), style.entropy * 0.3) &&
      (heldFragment === null || !rejected.includes(heldFragment));
    const built = returns
      ? { theme: held, fragment: heldFragment }
      : sectionTheme(env, kind, key, bench, themes, themeFragments, rejected);
    const { theme } = built;
    // Its ladder: a progression is eight bars, which the composer doesn't vary; tired of one, it rejects it.
    const harmonyLadder = layer
      ? climbedFigure(
          env.harmonies,
          HARMONY_FACET,
          'harmonyVariation',
          filingAt(env, stylePoint(style), HARMONY_TAG),
          layer,
          boredom,
          built.fragment ?? undefined,
          bench,
        )
      : { playing: null };
    const found = sectionRhythm(
      env,
      composed.meter,
      before,
      [...chosen, ...(meterFragment === undefined ? [] : [meterFragment])],
      rejectedOf(boredom, claveOwners),
    );
    // Bored with a groove, the composer varies it, and the variation plays in its place.
    const ladder = layer
      ? climbed(env, layer, boredom, found, { meter: composed.meter.meter, meterFragment })
      : { rhythm: found, layer, playing: null };
    const { rhythm } = ladder;
    // The bass line, on the same bench, its ladder climbed as the rhythm's is (`facet.ts`).
    const line = sectionLine(
      env,
      composed.meter,
      bassFragment ?? undefined,
      [...chosen, ...(meterFragment === undefined ? [] : [meterFragment])],
      rejectedOf(boredom, claveOwners),
    );
    const lineLadder = ladder.layer
      ? climbedFigure(
          env.bassLines,
          BASS_FACET,
          'lineVariation',
          filingAt(env, stylePoint(style), LINE_TAG),
          ladder.layer,
          boredom,
          line,
          { meter: composed.meter.meter, meterFragment },
        )
      : { id: line, layer: ladder.layer, playing: null };
    const bassKept = lineLadder.id;
    // The lead line, on the same bench, its ladder climbed as the bass line's is.
    const motif = sectionLead(
      env,
      composed.meter,
      leadFragment ?? undefined,
      [...chosen, ...(meterFragment === undefined ? [] : [meterFragment])],
      rejectedOf(boredom, claveOwners),
    );
    const leadLadder = lineLadder.layer
      ? climbedFigure(
          env.leads,
          LEAD_FACET,
          'leadLineVariation',
          filingAt(env, stylePoint(style), LEAD_TAG),
          lineLadder.layer,
          boredom,
          motif,
          { meter: composed.meter.meter, meterFragment },
        )
      : { id: motif, layer: lineLadder.layer, playing: null };
    const leadKept = leadLadder.id;
    const plan = { section, key, ...composed.meter, ...rhythm, melodic, theme };
    const kept = [
      meterFragment,
      rhythm.rhythmFragment,
      rhythm.claveFragment,
      bassKept,
      leadKept,
    ].filter((id) => id !== undefined);
    return {
      carried: {
        before: plan,
        themes: kind === 'build' ? themes : { ...themes, [kind]: theme },
        layer: leadLadder.layer
          ? harmonyLearned(
              env.harmonies,
              figureLearned(
                env.leads,
                figureLearned(
                  env.bassLines,
                  figureLearned(
                    env.rhythms,
                    learnedFrom(env, leadLadder.layer, composed.found),
                    [rhythm.rhythmFragment, rhythm.claveFragment],
                    stylePoint(style),
                    meterFragment,
                  ),
                  [bassKept],
                  stylePoint(style),
                  meterFragment,
                ),
                [leadKept],
                stylePoint(style),
                meterFragment,
              ),
              built.fragment,
              [
                ...(meterFragment === undefined ? [] : [meterFragment]),
                ...((kind === 'A' ? themeFragments.B : kind === 'B' ? themeFragments.A : null) ??
                  []),
              ].filter((id) => id !== built.fragment),
              stylePoint(style),
            )
          : null,
        shortTerm: remembered(memory, kept, 1),
        asked: stylePoint(style),
        boredom: boredAfter(
          boredom,
          [ladder.playing, lineLadder.playing, leadLadder.playing, harmonyLadder.playing].filter(
            (l) => l !== null,
          ),
          style.entropy,
        ),
        // (a clave is the drum bar's it was first chosen to layer on, where the ladder climbs)
        claveOwners: ladder.playing ? ownedWith(claveOwners, found) : claveOwners,
        bassFragment: bassKept ?? null,
        leadFragment: leadKept ?? null,
        themeFragments:
          kind === 'build' ? themeFragments : { ...themeFragments, [kind]: built.fragment },
        // (a section's bench as JSON keeps it: no meter fragment where it has none)
        earlier:
          asked && before
            ? {
                point: asked,
                bench: {
                  meter: before.meter,
                  ...(before.meterFragment === undefined
                    ? {}
                    : { meterFragment: before.meterFragment }),
                },
              }
            : null,
      },
      output: plan,
    };
  },
};
