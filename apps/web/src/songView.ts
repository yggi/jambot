/**
 * The Song view's reading of the plan, from where a person plays along
 * (#327): the sections from the one heard on, each as its bars in one row,
 * a bar as its chords laid where they start in it (those played, the one
 * heard, those ahead, and the motif a bar plays), and the notes that sit over
 * the bar heard. One form for every section, so the section heard and those
 * after it read alike, and as many fit as the room allows.
 */

import { stepsOf } from '@jambot/theory';
import type { Credit } from './attribution.ts';
import type { BarView, SectionView } from './hud.ts';
import { scaleNoteNames } from './noteNames.ts';
import { blockName } from './planView.ts';

/** How many sections the view shows, the one heard first. */
export const SONG_SECTIONS = 4;

export interface SongChord {
  /** As a lead sheet names it. */
  readonly symbol: string;
  /** As a degree of its key. */
  readonly numeral: string;
  /** How much of its bar it holds, 0 to 1, from where it starts to the next. */
  readonly share: number;
}

export interface SongBar {
  /** Counted from the song's start. */
  readonly bar: number;
  readonly chords: readonly SongChord[];
  readonly state: 'played' | 'heard' | 'ahead';
  /** Whose motif the lead plays in it, or null. */
  readonly motif: Credit | null;
}

export interface SongSection {
  /** Counted from the song's start. */
  readonly index: number;
  readonly name: string;
  /** Its new key and meter where they change from the section before, else empty. */
  readonly change: string;
  readonly bars: readonly SongBar[];
}

/** A bar's chords, each holding its share of the bar from where it starts. */
export function chordsOf(bar: Pick<BarView, 'chords' | 'meter'>): SongChord[] {
  const steps = stepsOf(bar.meter);
  return bar.chords.map((chord, i) => ({
    symbol: chord.symbol,
    numeral: chord.numeral,
    share: ((bar.chords[i + 1]?.step ?? steps) - chord.step) / steps,
  }));
}

/**
 * The sections from the one heard on (before anything is, from the one the
 * song opens on), as many as are decided, to `count`.
 */
export function songSections(
  sections: readonly SectionView[],
  heard: number | null,
  count = SONG_SECTIONS,
): SongSection[] {
  return sections.slice(0, count).map((section) => ({
    index: section.index,
    name: section.section,
    change: blockName(section).slice(section.section.length).replace(/^, /, ''),
    bars: section.bars.map((bar) => ({
      bar: bar.bar,
      chords: chordsOf(bar),
      state: heard === null || bar.bar > heard ? 'ahead' : bar.bar === heard ? 'heard' : 'played',
      motif: bar.motif,
    })),
  }));
}

/** The notes of the melodic scale over the bar heard, spelled in its key, and the scale where it isn't plain. */
export function overThis(bar: Pick<BarView, 'melodic' | 'tonic' | 'melodicName'> | null): string {
  if (!bar) return '';
  const notes = scaleNoteNames(bar.melodic, bar.tonic).join(' ');
  return bar.melodicName === 'plain' ? notes : `${notes} · ${bar.melodicName}`;
}
