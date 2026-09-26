/**
 * The view model: what the screen shows, as one plain snapshot.
 *
 * `hudOf` reads the bars ahead (`forecast`), the step heard and the style
 * track. It returns plain data, so the same snapshot could be sent to
 * another screen: names as text, spelled in their key, and quantities as
 * numbers. The components lay it out and read nothing else.
 *
 * Every bar is shown the same way, whether it is heard or ahead: a
 * `BarView`. Before anything is heard, the bar shown is the one the band
 * opens on, from the same forecast that then plays.
 *
 * A style is named by the preset it matches on every axis the preset sets
 * but energy, which a player rides within a genre. So the name follows the
 * track alone: a preset chosen names itself at once, and any other move
 * leaves the style unnamed, custom.
 */

import {
  type Axis,
  type ForecastBar,
  PRESETS,
  type SectionType,
  type Style,
  type StyleTrack,
  chordAt,
  chordName,
  chordNumeral,
  keyName,
  styleAt,
} from '@jambot/engine';

/** How many bars after the one heard are shown. */
export const NEXT_BARS = 4;

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
  readonly chords: readonly ChordView[];
  /** The energy it plays at, 0 to 1. */
  readonly energy: number;
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
  readonly style: StyleView;
}

export interface HudInput {
  /** The step heard, or null before anything is. */
  readonly heard: number | null;
  /** The bars decided, from the one heard on (`forecast`). */
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
    style: styleView(track, heard ?? 0),
  };
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
    chords: bar.chords.map((c) => chordView(c, bar)),
    energy: bar.barEnergy,
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
