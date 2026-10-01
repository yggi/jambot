/**
 * The view model: what the screen shows, as one plain snapshot.
 *
 * `hudOf` reads the bars ahead (`forecast`), the step heard and the style
 * track. It returns plain data, so the same snapshot could be sent to
 * another screen: names as text, spelled in their key, and quantities as
 * numbers. The components lay it out and read nothing else.
 *
 * Every bar is shown the same way, whether it is heard, ahead or in the
 * song map: a `BarView`, and a section is its `SECTION_BARS`. Before anything is
 * heard, the bar shown is the one the band opens on, from the same
 * forecast that then plays.
 *
 * The Muse's view is the motif on offer, as notes to draw, and its log in
 * the prototype's words; the judgement's reasons are data, and this is
 * where they become sentences.
 *
 * A style is named by the preset it matches on every axis the preset sets
 * but energy, which a player rides within a genre. So the name follows the
 * track alone: a preset chosen names itself at once, and any other move
 * leaves the style unnamed, custom.
 */

import {
  SECTION_BARS,
  SONG_CLOCK,
  type Axis,
  type ForecastBar,
  type Judgement,
  type Key,
  type DroppedJudgement,
  type MelodicScale,
  type MuseOutput,
  MUSE,
  type Offer,
  PRESETS,
  type Remembered,
  type SectionType,
  type SongClock,
  type Style,
  type StyleTrack,
  chordAt,
  chordName,
  chordNumeral,
  keyHelix,
  leadRests,
  memoryAt,
  melodicHelix,
  styleAt,
} from '@jambot/engine';
import { type Meter, positions, recognise } from '@jambot/theory';
import { sourceName } from '@jambot/session';
import { type Attribution, type Credit, credit } from './attribution.ts';
import { targetOf, unnudged } from './conductor.ts';
import { meterLabel } from './meter-choice.ts';
import { keyName } from './noteNames.ts';
import { CHORD_BARS, FAR_SECTIONS, NEAR_SECTIONS } from './planView.ts';

/**
 * The most bars shown after the one heard: the chords card shows `CHORD_BARS`
 * in all, the one heard and these.
 */
export const NEXT_BARS = CHORD_BARS - 1;

/** How many sections the plan shows, from the one heard: its two rows. */
export const SECTIONS = NEAR_SECTIONS + FAR_SECTIONS;

export interface ChordView {
  /** The step of its bar it starts on. */
  readonly step: number;
  /** As a lead sheet names it: `Am`, `E7`. */
  readonly symbol: string;
  /** As a degree of its key: `i`, `V7`, `V7/iv`. */
  readonly numeral: string;
}

export interface BarView {
  /** Counted from the song's start. */
  readonly bar: number;
  /** From 0 to `SECTION_BARS` - 1. */
  readonly barInSection: number;
  readonly section: string;
  /** The meter it is in, which its bar's steps and pulses are of. */
  readonly meter: Meter;
  /** As the screen says it: "4/4", "7/8 2+2+3". */
  readonly meterName: string;
  readonly key: string;
  /** The key's tonic, as a pitch class 0–11, C = 0. */
  readonly tonic: number;
  /** The key's notes, as pitch classes 0–11, C = 0. */
  readonly scale: readonly number[];
  /**
   * The notes of the melodic scale the lead walks over the key (#209), as
   * pitch classes 0–11: the key's own where it is plain, the pentatonic's or
   * the blues' where not, which are safe notes to play along on.
   */
  readonly melodic: readonly number[];
  /** Which melodic scale that is. */
  readonly melodicName: MelodicScale;
  readonly chords: readonly ChordView[];
  /** The energy it plays at, 0 to 1. */
  readonly energy: number;
  /** Whether the lead rests in it, improvises (`leadRests`), or plays a motif the Muse offers. */
  readonly lead: 'resting' | 'improvising' | 'motif';
  /**
   * Whose motif the lead plays in it, credited, and the bar it was heard in,
   * or null. A bar ahead holds the offer standing now, which it plays unless
   * another comes.
   */
  readonly motif: Credit | null;
}

export interface SectionView {
  /** Counted from the song's start. */
  readonly index: number;
  readonly section: string;
  /** The meter it is in, as the screen says it, from its first bar: a section has one (#261). */
  readonly meterName: string;
  /** Whether its meter differs from the section's before it; never for the section heard. */
  readonly newMeter: boolean;
  readonly key: string;
  /** Whether its key differs from the section's before it; never for the section heard. */
  readonly newKey: boolean;
  readonly bars: readonly BarView[];
}

/** A glide between styles under way: the preset it left, if any, and its bar heard, from 1, of how many. */
export interface GlideView {
  readonly from: string | null;
  readonly bar: number;
  readonly bars: number;
}

/** The six axes a style is drawn and set on: tempo has its own card. */
export const STYLE_AXES = ['swing', 'sync', 'harm', 'artic', 'energy', 'entropy'] as const;
export type StyleAxis = (typeof STYLE_AXES)[number];
export type AxisValues = Readonly<Record<StyleAxis, number>>;

/** The six axes of a style, 0 to 1. */
export const axesOf = (style: Style): AxisValues =>
  Object.fromEntries(STYLE_AXES.map((axis) => [axis, style[axis]])) as AxisValues;

export interface StyleView {
  /** The preset the style is at or heading for, or null for a custom style. */
  readonly preset: string | null;
  readonly glide: GlideView | null;
  /** The six axes where the band is at the step heard, so a glide moves them. */
  readonly axes: AxisValues;
}

/** A motif on offer, as the Muse panel draws it, credited to its source and the bar it was heard in. */
export interface MotifView extends Credit {
  /** How many steps its cycle has: the bar it was judged in (`Motif.cycle`). */
  readonly cycle: number;
  /** The steps its bar's pulses start on, where that bar is known to the clock; else every four steps. */
  readonly pulses: readonly number[];
  /** How many rows of degrees it spans. */
  readonly rows: number;
  /** Each note: its step, how long it is held, its row from the lowest, and whether it is altered. */
  readonly notes: readonly {
    readonly step: number;
    readonly length: number;
    readonly row: number;
    readonly altered: boolean;
  }[];
}

/** One line of the Muse's log. */
export interface MuseLine {
  /** The bar it is about, counted from the song's start. */
  readonly bar: number;
  readonly text: string;
  /** Whether a motif was taken. */
  readonly taken: boolean;
}

/** A motif the Muse remembers, as the card draws it: whose, how strongly, how often heard. */
export interface MemoryView extends MotifView {
  /** How much it weighs, from 0 to 1 (a motif heard twice in a row is near 0.9). */
  readonly strength: number;
  /** In how many bars it was heard. */
  readonly heard: number;
  /** Heard in two bars or more. */
  readonly confirmed: boolean;
  /** Whether it is the motif on offer. */
  readonly offered: boolean;
}

/** Bars of silence the Muse has kept an offer through, of the bars she keeps it. */
export interface QuietView {
  readonly bars: number;
  readonly of: number;
}

export interface MuseView {
  readonly motif: MotifView | null;
  /** What she remembers, the strongest first. */
  readonly memory: readonly MemoryView[];
  /** How long since anyone played, while she holds an offer; null otherwise. */
  readonly quiet: QuietView | null;
  /** The latest first. */
  readonly log: readonly MuseLine[];
}

export interface Hud {
  /** The bar heard, or before anything is heard the bar the band plays first; null past the forecast. */
  readonly bar: BarView | null;
  /** The beat heard in its bar, from 0 (`beatInBar`, on the song's clock), or null before anything is heard. */
  readonly beat: number | null;
  /** The chord sounding, or before anything is heard the bar's first. */
  readonly chord: ChordView | null;
  /** The bars after it, at most `NEXT_BARS`, as far as the bars reach. */
  readonly next: readonly BarView[];
  /** Its section and those after, up to `SECTIONS`, as far as the bars reach them in full. */
  readonly sections: readonly SectionView[];
  readonly style: StyleView;
  /** The key the band is heading for: the last bar decided's, since a wish is met in one step. */
  readonly heading: Key | null;
  /** The melodic scale the band is heading for, the last bar decided's likewise (#209). */
  readonly headingMelodic: MelodicScale | null;
  /** The meter the band is heading for, the last bar decided's likewise: a client's host's asking, as far as it is heard (#305). */
  readonly headingMeter: Meter | null;
  readonly muse: MuseView;
}

export interface HudInput {
  /** The step heard, or null before anything is. */
  readonly heard: number | null;
  /** The song's clock as far as the bars reach (`clockThrough`); the song's 4/4 where none is given. */
  readonly clock?: SongClock;
  /** The bars decided, from the first of the section heard on (`forecast`). */
  readonly bars: readonly ForecastBar[];
  readonly track: StyleTrack;
  /**
   * The players' tempo nudge, in octaves (`conductor.ts`): the style is named
   * by its own tempo, so a nudge within its licence keeps its name.
   */
  readonly tempoNudge?: number;
  /**
   * The motif on offer and the Muse's latest judgements, the latest last,
   * the bars judged elsewhere that it dropped, and in a session each
   * player's name by id, which its sources are read by; none before
   * anything is played.
   */
  readonly muse?: {
    readonly offer: Offer | null;
    readonly log: readonly MuseOutput[];
    readonly dropped?: readonly DroppedJudgement[];
    readonly players?: Readonly<Record<string, string>>;
    /** The motifs she remembers, weighed as of the bar `asOf` (`memoryAt`). */
    readonly memory?: readonly Remembered[];
    readonly asOf?: number | null;
    /** The last bar anyone played in. */
    readonly lastPlayed?: number | null;
  };
}

const SECTION_NAMES: Record<SectionType, string> = {
  intro: 'Intro',
  groove: 'Groove',
  bridge: 'Bridge',
  build: 'Build',
  drop: 'Drop',
  breakdown: 'Breakdown',
};

/** The axes that name a style: those a preset sets, but energy. */
const NAMING_AXES = (Object.keys(PRESETS[0]!.style) as Axis[]).filter((a) => a !== 'energy');

/** The preset a style is, or null for a custom style. */
export function presetOf(style: Style): string | null {
  const preset = PRESETS.find((p) =>
    NAMING_AXES.every((axis) => style[axis] === p.style[axis as keyof typeof p.style]),
  );
  return preset?.name ?? null;
}

/** What the lead is doing, in the prototype's words, reused by the chords and the tracks. */
export function leadStatus(hud: Pick<Hud, 'bar' | 'beat'>): string {
  if (hud.beat === null || !hud.bar) return 'The band plays on its own once started.';
  if (hud.bar.lead === 'motif' && hud.bar.motif)
    return `Lead is playing the motif from ${hud.bar.motif.name}, heard in bar ${hud.bar.motif.bar + 1}.`;
  return hud.bar.lead === 'resting' ? 'Lead is resting.' : 'Lead is improvising.';
}

/** The word for an axis at its low or its high end, for a style no preset names. */
const AXIS_WORDS: Record<StyleAxis, readonly [string, string]> = {
  swing: ['straight', 'swung'],
  sync: ['on the beat', 'syncopated'],
  harm: ['static', 'rich'],
  artic: ['legato', 'staccato'],
  energy: ['sparse', 'dense'],
  entropy: ['predictable', 'surprising'],
};

/** How near an end an axis is to be worth a word: a quarter of its range. */
const WORTH_A_WORD = 0.25;

/** The most telling words for a custom style: up to two axes furthest from the middle, in axis order on a tie. */
export function styleWords(axes: AxisValues): string[] {
  return STYLE_AXES.map((axis, i) => ({ axis, i, far: Math.abs(axes[axis] - 0.5) }))
    .filter(({ far }) => far >= 0.5 - WORTH_A_WORD)
    .sort((a, b) => b.far - a.far || a.i - b.i)
    .slice(0, 2)
    .sort((a, b) => a.i - b.i)
    .map(({ axis }) => AXIS_WORDS[axis][axes[axis] < 0.5 ? 0 : 1]);
}

/** The style card's main element: the closest named style. */
export const styleName = ({ preset }: StyleView): string => preset ?? 'Custom';

/**
 * The style card's sub element: what the band is doing now, or for a client
 * whose host sets it, that too.
 */
export function styleSub(view: StyleView, following = false): string {
  const { preset, glide, axes } = view;
  const state =
    preset === null
      ? ['Custom', styleWords(axes).join(', ')].filter(Boolean).join(' · ')
      : glide
        ? `Gliding to ${preset}`
        : `Playing ${preset}`;
  return following ? `${state} · the host sets it` : state;
}

/** Where a style is, in the prototype's words, reused by the tracks. */
export function styleStatus({ preset, glide }: StyleView): string {
  if (preset === null) return 'Custom style. Pick a preset to glide somewhere named.';
  if (!glide) return `Playing ${preset}.`;
  return `Moving from ${glide.from ?? 'Custom'} to ${preset}, bar ${glide.bar} of ${glide.bars}.`;
}

export function hudOf({
  heard,
  clock = SONG_CLOCK,
  bars,
  track,
  tempoNudge = 0,
  muse,
}: HudInput): Hud {
  const players = muse?.players ?? {};
  const named = (source: string) => sourceName(source, players);
  const credited = (attribution: Attribution) => credit(attribution, players);
  const barView = (bar: ForecastBar) => barViewOf(bar, credited);
  const at = heard === null ? 0 : bars.findIndex((b) => b.bar === clock.barAt(heard));
  const here = at >= 0 ? bars[at] : undefined;
  const step = heard === null ? 0 : clock.stepInBar(heard);
  const sounding = here && chordAt(here.chords, step);
  return {
    bar: here ? barView(here) : null,
    beat: heard === null ? null : clock.beatInBar(heard),
    chord: here && sounding ? chordView(sounding, here) : null,
    next: here ? bars.slice(at + 1, at + 1 + NEXT_BARS).map(barView) : [],
    sections: here ? sectionViews(bars, Math.floor(here.bar / SECTION_BARS), barView) : [],
    style: styleView(track, heard ?? 0, tempoNudge, clock),
    heading: bars.at(-1)?.plan.key ?? null,
    headingMelodic: bars.at(-1)?.plan.melodic ?? null,
    headingMeter: bars.at(-1)?.plan.meter ?? null,
    muse: museView(muse, named, credited, heard === null ? null : clock.barAt(heard), clock),
  };
}

/** The Muse's view, each source read by its player's name. */
function museView(
  muse: HudInput['muse'],
  named: (source: string) => string,
  credited: (attribution: Attribution) => Credit,
  heardBar: number | null,
  clock: SongClock,
): MuseView {
  const asOf = muse?.asOf ?? null;
  const offer = muse?.offer ?? null;
  // Faded to the bar heard, or held at the bar she read while that is ahead.
  const at = Math.max(asOf ?? 0, heardBar ?? 0);
  const silent = muse?.lastPlayed == null ? null : Math.max(0, at - muse.lastPlayed);
  return {
    motif: offer ? motifView(offer, credited, clock) : null,
    memory:
      asOf === null
        ? []
        : memoryAt(muse?.memory ?? [], asOf, at)
            .sort((a, b) => b.weight - a.weight)
            .map((e) => ({
              ...motifView(
                { motif: e.motif, source: e.source, bar: e.bar, level: 0 },
                credited,
                clock,
              ),
              strength: Math.min(1, e.weight / 2),
              heard: e.heard,
              confirmed: e.heard >= 2,
              offered: offer !== null && recognise(offer.motif, e.motif) !== null,
            })),
    quiet:
      offer && silent !== null
        ? { bars: Math.min(silent, MUSE.forgetAfter), of: MUSE.forgetAfter }
        : null,
    log: [
      ...(muse?.log ?? []).flatMap((j) => museLines(j, named)),
      ...(muse?.dropped ?? []).map((d) => droppedLine(d, named)),
    ]
      .sort((a, b) => a.bar - b.bar)
      .reverse(),
  };
}

function motifView(
  { motif, source, bar }: Offer,
  credited: (attribution: Attribution) => Credit,
  clock: SongClock,
): MotifView {
  const { onsets, degrees, accidentals, cycle } = motif;
  // Its pulses are those of the bar it was heard in, when that bar has the motif's length.
  const start = clock.barStart(bar);
  const pulses: number[] = [];
  if (clock.barStart(bar + 1) - start === cycle)
    for (let beat = clock.beatAt(start); clock.beatStart(beat) < start + cycle; beat++)
      pulses.push(clock.beatStart(beat) - start);
  else for (let step = 0; step < cycle; step += 4) pulses.push(step);
  const notes = onsets.flatMap((step, i) => {
    const degree = degrees[i];
    if (degree === null || degree === undefined) return [];
    return [
      { step, length: (onsets[i + 1] ?? cycle) - step, degree, altered: accidentals[i] !== 0 },
    ];
  });
  const lowest = Math.min(...notes.map((n) => n.degree));
  const highest = Math.max(...notes.map((n) => n.degree));
  return {
    ...credited({ source, bar }),
    cycle,
    pulses,
    rows: highest - lowest + 1,
    notes: notes.map(({ step, length, degree, altered }) => ({
      step,
      length,
      row: degree - lowest,
      altered,
    })),
  };
}

/** Why a bar gave no motif, as the prototype says it. */
function reason(judgement: Judgement): string | null {
  switch (judgement.kind) {
    case 'mashing':
      return `${judgement.count} notes in one bar reads as mashing. Ignored.`;
    case 'too few':
      return `Heard ${judgement.count} note${judgement.count === 1 ? '' : 's'}. A motif needs at least 3.`;
    case 'too wide':
      return `The leaps span ${judgement.range} semitones, too wide to reuse.`;
    case 'motif':
      return null;
  }
}

/** A bar judged elsewhere that the Muse dropped, and why, so a player can tell. */
function droppedLine(
  { bar, judgement, why }: DroppedJudgement,
  named: (source: string) => string,
): MuseLine {
  const source = named(judgement.source);
  const text = {
    late: `What ${source} played came too late to be heard.`,
    ahead: `${source} sent a bar not yet played. Ignored.`,
    inadmissible: `${source} sent what no ear would have judged. Ignored.`,
  }[why];
  return { bar, text, taken: false };
}

/** A judged bar's lines, in the order they happened: a forget, then what was taken or why not. */
function museLines(
  { bar, judgements, offer, forgot }: MuseOutput,
  named: (source: string) => string,
): MuseLine[] {
  const lines: MuseLine[] = [];
  if (forgot === 'asked') lines.push({ bar, text: 'Forgot the motif, as asked.', taken: false });
  if (forgot === 'silence')
    lines.push({ bar, text: 'Nobody has played for 16 bars. Back to improvising.', taken: false });
  if (offer?.bar === bar) {
    const notes = offer.motif.degrees.filter((d) => d !== null).length;
    lines.push({
      bar,
      text: `Took a ${notes}-note motif from ${named(offer.source)}.`,
      taken: true,
    });
  } else {
    const why = judgements.map(reason).find((r) => r !== null);
    if (why) lines.push({ bar, text: why, taken: false });
  }
  return lines;
}

/** The sections from `first` on, as far as the bars hold all of each. */
function sectionViews(
  bars: readonly ForecastBar[],
  first: number,
  barView: (bar: ForecastBar) => BarView,
): SectionView[] {
  const byBar = new Map(bars.map((b) => [b.bar, b]));
  const sections: SectionView[] = [];
  for (let index = first; sections.length < SECTIONS; index++) {
    const own = Array.from({ length: SECTION_BARS }, (_, i) => byBar.get(index * SECTION_BARS + i));
    if (!own.every((b) => b !== undefined)) break;
    const views = own.map(barView);
    const before = sections.at(-1);
    sections.push({
      index,
      section: views[0]!.section,
      meterName: views[0]!.meterName,
      newMeter: before !== undefined && before.meterName !== views[0]!.meterName,
      key: views[0]!.key,
      newKey: before !== undefined && before.key !== views[0]!.key,
      bars: views,
    });
  }
  return sections;
}

function chordView(
  chord: ForecastBar['chords'][number],
  { plan: { key } }: ForecastBar,
): ChordView {
  return {
    step: chord.slot.step,
    symbol: chordName(chord, key),
    numeral: chordNumeral(chord, key),
  };
}

function barViewOf(bar: ForecastBar, credited: (attribution: Attribution) => Credit): BarView {
  return {
    bar: bar.bar,
    barInSection: bar.bar % SECTION_BARS,
    section: SECTION_NAMES[bar.plan.section.type],
    meter: bar.plan.meter,
    meterName: meterLabel(bar.plan.meter),
    key: keyName(bar.plan.key),
    tonic: bar.plan.key.tonic,
    scale: positions(keyHelix(bar.plan.key)),
    melodic: positions(melodicHelix(bar.plan.key, bar.plan.melodic)),
    melodicName: bar.plan.melodic,
    chords: bar.chords.map((c) => chordView(c, bar)),
    energy: bar.barEnergy,
    lead: bar.offer
      ? 'motif'
      : leadRests(bar.plan.section.type, bar.barEnergy)
        ? 'resting'
        : 'improvising',
    motif: bar.offer && credited(bar.offer),
  };
}

/**
 * The style's name, and the glide under way at a step, over the axes that
 * name it. A glide counts from its start even where the step heard still
 * lags behind it.
 */
function styleView(track: StyleTrack, step: number, nudge: number, clock: SongClock): StyleView {
  const target = unnudged(targetOf(track), nudge);
  const moving = NAMING_AXES.map((axis) => track[axis]).filter(
    (g) => g.length > 0 && step < g.start + g.length && (g.from !== g.to || g.slope !== 0),
  );
  const axes = axesOf(styleAt(track, step));
  if (moving.length === 0) return { preset: presetOf(target), glide: null, axes };
  const start = Math.min(...moving.map((g) => g.start));
  const end = Math.max(...moving.map((g) => g.start + g.length));
  /** A position as a count of bars, the part of a bar as a fraction of its own length. */
  const barsAt = (at: number) =>
    clock.barAt(at) + clock.stepInBar(at) / clock.barSteps(clock.barAt(at));
  const bars = Math.ceil(barsAt(end) - barsAt(start));
  const bar = Math.min(bars, Math.max(1, Math.floor(barsAt(step) - barsAt(start)) + 1));
  return {
    preset: presetOf(target),
    glide: { from: presetOf(unnudged(styleAt(track, start), nudge)), bar, bars },
    axes,
  };
}
