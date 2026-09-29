/**
 * The view model: what the screen shows, as one plain snapshot.
 *
 * `hudOf` reads the bars ahead (`forecast`), the step heard and the style
 * track. It returns plain data, so the same snapshot could be sent to
 * another screen: names as text, spelled in their key, and quantities as
 * numbers. The components lay it out and read nothing else.
 *
 * Every bar is shown the same way, whether it is heard, ahead or in the
 * song map: a `BarView`, and a section is its eight. Before anything is
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
  BAR_STEPS,
  SECTION_BARS,
  type Axis,
  type ForecastBar,
  type Judgement,
  type Key,
  type DroppedJudgement,
  type MuseOutput,
  type Offer,
  PRESETS,
  type SectionType,
  type Style,
  type StyleTrack,
  barAt,
  beatInBar,
  chordAt,
  chordName,
  chordNumeral,
  keyHelix,
  keyName,
  leadRests,
  stepInBar,
  styleAt,
} from '@jambot/engine';
import { positions } from '@jambot/theory';
import { sourceName } from '@jambot/session';
import { targetOf, unnudged } from './conductor.ts';

/** How many bars after the one heard are shown. */
export const NEXT_BARS = 4;

/** How many sections the song map shows, from the one heard. */
export const SECTIONS = 4;

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
  /** 0 to 7. */
  readonly barInSection: number;
  readonly section: string;
  readonly key: string;
  /** The key's tonic, as a pitch class 0–11, C = 0. */
  readonly tonic: number;
  /** The key's notes, as pitch classes 0–11, C = 0. */
  readonly scale: readonly number[];
  readonly chords: readonly ChordView[];
  /** The energy it plays at, 0 to 1. */
  readonly energy: number;
  /** Whether the lead rests in it, improvises (`leadRests`), or plays a motif the Muse offers. */
  readonly lead: 'resting' | 'improvising' | 'motif';
  /**
   * Whose motif the lead plays in it, named, and the bar it was heard in, or
   * null. A bar ahead holds the offer standing now, which it plays unless
   * another comes.
   */
  readonly motif: Attribution | null;
}

/**
 * Where a motif the lead plays came from: its source, and the bar it was
 * heard in, counted from the song's start. It is the bar's own `Offer`
 * less the motif itself: the cell and where it was heard, not how the lead
 * realises it. `Pattern` keeps the source's id, and the views name it
 * (`sourceName`), as `BarView` and `PerformerView` do.
 */
export interface Attribution {
  readonly source: string;
  readonly bar: number;
}

export interface SectionView {
  /** Counted from the song's start. */
  readonly index: number;
  readonly section: string;
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

export interface StyleView {
  /** The preset the style is at or heading for, or null for a custom style. */
  readonly preset: string | null;
  readonly glide: GlideView | null;
}

/** A motif on offer, as the Muse panel draws it. */
export interface MotifView {
  readonly source: string;
  /** The bar it was heard in, counted from the song's start. */
  readonly bar: number;
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

export interface MuseView {
  readonly motif: MotifView | null;
  /** The latest first. */
  readonly log: readonly MuseLine[];
}

export interface Hud {
  /** The bar heard, or before anything is heard the bar the band plays first; null past the forecast. */
  readonly bar: BarView | null;
  /** The beat heard, 0 to 3, or null before anything is heard. */
  readonly beat: number | null;
  /** The chord sounding, or before anything is heard the bar's first. */
  readonly chord: ChordView | null;
  /** The bars after it, up to `NEXT_BARS`. */
  readonly next: readonly BarView[];
  /** Its section and those after, up to `SECTIONS`, as far as the bars reach them in full. */
  readonly sections: readonly SectionView[];
  readonly style: StyleView;
  /** The key the band is heading for: the last bar decided's, since a wish is met in one step. */
  readonly heading: Key | null;
  readonly muse: MuseView;
}

export interface HudInput {
  /** The step heard, or null before anything is. */
  readonly heard: number | null;
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

/** What the lead is doing, in the prototype's words, reused by the stage and its tracks. */
export function leadStatus(hud: Pick<Hud, 'bar' | 'beat'>): string {
  if (hud.beat === null || !hud.bar) return 'The band plays on its own once started.';
  if (hud.bar.lead === 'motif' && hud.bar.motif)
    return `Lead is playing the motif from ${hud.bar.motif.source}, heard in bar ${hud.bar.motif.bar + 1}.`;
  return hud.bar.lead === 'resting' ? 'Lead is resting.' : 'Lead is improvising.';
}

/** Where a style is, in the prototype's words, reused by the style panel and the tracks. */
export function styleStatus({ preset, glide }: StyleView): string {
  if (preset === null) return 'Custom style. Pick a preset to glide somewhere named.';
  if (!glide) return `Playing ${preset}.`;
  return `Moving from ${glide.from ?? 'Custom'} to ${preset}, bar ${glide.bar} of ${glide.bars}.`;
}

export function hudOf({ heard, bars, track, tempoNudge = 0, muse }: HudInput): Hud {
  const players = muse?.players ?? {};
  const named = (source: string) => sourceName(source, players);
  const barView = (bar: ForecastBar) => barViewOf(bar, named);
  const at = heard === null ? 0 : bars.findIndex((b) => b.bar === barAt(heard));
  const here = at >= 0 ? bars[at] : undefined;
  const step = heard === null ? 0 : stepInBar(heard);
  const sounding = here && chordAt(here.chords, step);
  return {
    bar: here ? barView(here) : null,
    beat: heard === null ? null : beatInBar(step),
    chord: here && sounding ? chordView(sounding, here) : null,
    next: here ? bars.slice(at + 1, at + 1 + NEXT_BARS).map(barView) : [],
    sections: here ? sectionViews(bars, Math.floor(here.bar / SECTION_BARS), barView) : [],
    style: styleView(track, heard ?? 0, tempoNudge),
    heading: bars.at(-1)?.plan.key ?? null,
    muse: museView(muse, named),
  };
}

/** The Muse's view, each source read by its player's name. */
function museView(muse: HudInput['muse'], named: (source: string) => string): MuseView {
  return {
    motif: muse?.offer ? motifView(muse.offer, named) : null,
    log: [
      ...(muse?.log ?? []).flatMap((j) => museLines(j, named)),
      ...(muse?.dropped ?? []).map((d) => droppedLine(d, named)),
    ]
      .sort((a, b) => a.bar - b.bar)
      .reverse(),
  };
}

function motifView({ motif, source, bar }: Offer, named: (source: string) => string): MotifView {
  const { onsets, degrees, accidentals, cycle } = motif;
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
    source: named(source),
    bar,
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

/** The sections from `first` on, as far as the bars hold all eight of each. */
function sectionViews(
  bars: readonly ForecastBar[],
  first: number,
  barView: (bar: ForecastBar) => BarView,
): SectionView[] {
  const byBar = new Map(bars.map((b) => [b.bar, b]));
  const sections: SectionView[] = [];
  for (let index = first; sections.length < SECTIONS; index++) {
    const own = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => byBar.get(index * 8 + i));
    if (!own.every((b) => b !== undefined)) break;
    const views = own.map(barView);
    const before = sections.at(-1);
    sections.push({
      index,
      section: views[0]!.section,
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

function barViewOf(bar: ForecastBar, named: (source: string) => string): BarView {
  return {
    bar: bar.bar,
    barInSection: bar.bar % SECTION_BARS,
    section: SECTION_NAMES[bar.plan.section.type],
    key: keyName(bar.plan.key),
    tonic: bar.plan.key.tonic,
    scale: positions(keyHelix(bar.plan.key)),
    chords: bar.chords.map((c) => chordView(c, bar)),
    energy: bar.barEnergy,
    lead: bar.offer
      ? 'motif'
      : leadRests(bar.plan.section.type, bar.barEnergy)
        ? 'resting'
        : 'improvising',
    motif: bar.offer && { source: named(bar.offer.source), bar: bar.offer.bar },
  };
}

/**
 * The style's name, and the glide under way at a step, over the axes that
 * name it. A glide counts from its start even where the step heard still
 * lags behind it.
 */
function styleView(track: StyleTrack, step: number, nudge: number): StyleView {
  const target = unnudged(targetOf(track), nudge);
  const moving = NAMING_AXES.map((axis) => track[axis]).filter(
    (g) => g.length > 0 && step < g.start + g.length && (g.from !== g.to || g.slope !== 0),
  );
  if (moving.length === 0) return { preset: presetOf(target), glide: null };
  const start = Math.min(...moving.map((g) => g.start));
  const end = Math.max(...moving.map((g) => g.start + g.length));
  const bars = Math.ceil((end - start) / BAR_STEPS);
  const bar = Math.min(bars, Math.max(1, Math.floor((step - start) / BAR_STEPS) + 1));
  return {
    preset: presetOf(target),
    glide: { from: presetOf(unnudged(styleAt(track, start), nudge)), bar, bars },
  };
}
