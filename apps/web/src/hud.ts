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
 * A style is named by the preset it matches on every axis the preset sets
 * but energy, which a player rides within a genre. So the name follows the
 * track alone: a preset chosen names itself at once, and any other move
 * leaves the style unnamed, custom.
 */

import {
  type Axis,
  type ForecastBar,
  type Key,
  PRESETS,
  type SectionType,
  type Style,
  type StyleTrack,
  chordAt,
  chordName,
  chordNumeral,
  keyHelix,
  keyName,
  leadRests,
  styleAt,
} from '@jambot/engine';
import { positions } from '@jambot/theory';

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
  /** The key's notes, as pitch classes 0–11, C = 0. */
  readonly scale: readonly number[];
  readonly chords: readonly ChordView[];
  /** The energy it plays at, 0 to 1. */
  readonly energy: number;
  /** Whether the lead rests in it or improvises (`leadRests`). */
  readonly lead: 'resting' | 'improvising';
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
}

export interface HudInput {
  /** The step heard, or null before anything is. */
  readonly heard: number | null;
  /** The bars decided, from the first of the section heard on (`forecast`). */
  readonly bars: readonly ForecastBar[];
  readonly track: StyleTrack;
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

export function hudOf({ heard, bars, track }: HudInput): Hud {
  const at = heard === null ? 0 : bars.findIndex((b) => b.bar === Math.floor(heard / 16));
  const here = at >= 0 ? bars[at] : undefined;
  const step = heard === null ? 0 : heard % 16;
  const sounding = here && chordAt(here.chords, step);
  return {
    bar: here ? barView(here) : null,
    beat: heard === null ? null : Math.floor(step / 4),
    chord: here && sounding ? chordView(sounding, here) : null,
    next: here ? bars.slice(at + 1, at + 1 + NEXT_BARS).map(barView) : [],
    sections: here ? sectionViews(bars, Math.floor(here.bar / 8)) : [],
    style: styleView(track, heard ?? 0),
    heading: bars.at(-1)?.plan.key ?? null,
  };
}

/** The sections from `first` on, as far as the bars hold all eight of each. */
function sectionViews(bars: readonly ForecastBar[], first: number): SectionView[] {
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

function barView(bar: ForecastBar): BarView {
  return {
    bar: bar.bar,
    barInSection: bar.bar % 8,
    section: SECTION_NAMES[bar.plan.section.type],
    key: keyName(bar.plan.key),
    scale: positions(keyHelix(bar.plan.key)),
    chords: bar.chords.map((c) => chordView(c, bar)),
    energy: bar.barEnergy,
    lead: leadRests(bar.plan.section.type, bar.barEnergy) ? 'resting' : 'improvising',
  };
}

/**
 * The style's name, and the glide under way at a step, over the axes that
 * name it. A glide counts from its start even where the step heard still
 * lags behind it.
 */
function styleView(track: StyleTrack, step: number): StyleView {
  const target = Object.fromEntries(
    Object.entries(track).map(([axis, glide]) => [axis, glide.to]),
  ) as Style;
  const moving = NAMING_AXES.map((axis) => track[axis]).filter(
    (g) => g.length > 0 && step < g.start + g.length && (g.from !== g.to || g.slope !== 0),
  );
  if (moving.length === 0) return { preset: presetOf(target), glide: null };
  const start = Math.min(...moving.map((g) => g.start));
  const end = Math.max(...moving.map((g) => g.start + g.length));
  const bars = Math.ceil((end - start) / 16);
  const bar = Math.min(bars, Math.max(1, Math.floor((step - start) / 16) + 1));
  return {
    preset: presetOf(target),
    glide: { from: presetOf(styleAt(track, start)), bar, bars },
  };
}
