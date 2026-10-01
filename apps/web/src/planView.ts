/**
 * What the plan and the chords cards lay out, apart from the components: the
 * chords card's bars as tiles (the bar heard, the next, and six more), where a
 * change of section or key is labelled, the chord that comes next, and the
 * plan's sections in its two rows. Each reads what `hudOf` gives and decides
 * nothing of the music.
 */

import type { BarView, ChordView, Hud, SectionView } from './hud.ts';

/** How many bars the chords card shows, the bar heard among them. */
export const CHORD_BARS = 8;

/** How many of them are large: the bar heard and the next. */
export const LARGE_TILES = 2;

/** How many sections the plan's first row shows, large: the section heard and the next. */
export const NEAR_SECTIONS = 2;

/** How many sections the plan's second row shows, smaller: those after the next. */
export const FAR_SECTIONS = 3;

export interface Tile {
  readonly bar: BarView;
  /** Where the section, key or meter changes, at this bar: "Drop", "D dorian", "Bridge, C major, 7/8". */
  readonly cue: string;
  readonly large: boolean;
}

/**
 * The label a bar carries where the section, the key or the meter changes
 * from the bar before it. The bar heard has none before it, so it is labelled
 * only where it starts its section.
 */
export function cueOf(bar: BarView, before: BarView | null): string {
  if (before === null) return bar.barInSection === 0 ? bar.section : '';
  return [
    bar.section !== before.section ? bar.section : null,
    bar.key !== before.key ? bar.key : null,
    bar.meterName !== before.meterName ? bar.meterName : null,
  ]
    .filter((part) => part !== null)
    .join(', ');
}

/** The chords card's bars: the bar heard and those after it, as many as are decided, to `CHORD_BARS`. */
export function chordTiles(heard: BarView | null, next: readonly BarView[]): Tile[] {
  if (heard === null) return [];
  const bars = [heard, ...next].slice(0, CHORD_BARS);
  return bars.map((bar, i) => ({
    bar,
    cue: cueOf(bar, i === 0 ? null : bars[i - 1]!),
    large: i < LARGE_TILES,
  }));
}

/**
 * The chord after the one sounding: the next in its bar, else the first of the
 * next bar, none past what is decided.
 */
export function nextChord(hud: Pick<Hud, 'bar' | 'chord' | 'next'>): ChordView | null {
  const { bar, chord, next } = hud;
  if (bar === null || chord === null) return null;
  const here = bar.chords.findIndex((c) => c.step === chord.step);
  return bar.chords[here + 1] ?? next[0]?.chords[0] ?? null;
}

/**
 * How many beats until the next chord: counted from the beat heard to the beat
 * the next chord starts on (or, for one between beats, the next beat after it),
 * so a bar of one chord counts 4, 3, 2, 1 to the bar after. None before
 * anything is heard, or past what is decided. `beatSteps` are the steps the
 * bar's beats fall on, and `span` its steps.
 */
export function beatsToNext(
  hud: Pick<Hud, 'bar' | 'beat' | 'chord' | 'next'>,
  beatSteps: readonly number[],
  span: number,
): number | null {
  const { bar, beat, chord, next } = hud;
  if (bar === null || beat === null || chord === null) return null;
  const here = bar.chords.findIndex((c) => c.step === chord.step);
  const inBar = bar.chords[here + 1];
  if (inBar === undefined && next[0]?.chords[0] === undefined) return null;
  const at = inBar === undefined ? span : inBar.step;
  const start = beatSteps.findIndex((step) => step >= at);
  return (start === -1 ? beatSteps.length : start) - beat;
}

/** The plan's sections in its two rows: the section heard and the next, then those after. */
export function planRows(sections: readonly SectionView[]): {
  near: SectionView[];
  far: SectionView[];
} {
  return { near: sections.slice(0, NEAR_SECTIONS), far: sections.slice(NEAR_SECTIONS) };
}

/** A block's name in the plan: its section, and its key and its meter where they change. */
export const blockName = (section: SectionView): string =>
  [
    section.section,
    section.newKey ? section.key : null,
    section.newMeter ? section.meterName : null,
  ]
    .filter((part) => part !== null)
    .join(', ');
