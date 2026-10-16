/**
 * The Song view's reading of the plan, from where a person plays along
 * (#327): the section heard bar by bar (those played, the one heard, those
 * ahead, each by its chords and the motif it plays), the sections after it
 * as their bars' first chords, and the notes that sit over the bar heard.
 */

import type { Credit } from './attribution.ts';
import type { BarView, SectionView } from './hud.ts';
import { scaleNoteNames } from './noteNames.ts';
import { blockName } from './planView.ts';

/** How many sections after the one heard the view shows. */
export const AHEAD_SECTIONS = 2;

export interface SongBar {
  /** Counted from the song's start. */
  readonly bar: number;
  /** In its section, from 1. */
  readonly number: number;
  /** Its chords, as a lead sheet names them, in order. */
  readonly chords: string;
  /** Its first chord as a degree of its key. */
  readonly numeral: string;
  readonly state: 'played' | 'heard' | 'ahead';
  /** Whose motif the lead plays in it, or null. */
  readonly motif: Credit | null;
}

/** The section heard, or before anything is the one the song opens on, bar by bar. */
export function sectionBars(sections: readonly SectionView[], heard: number | null): SongBar[] {
  const section = sections[0];
  if (!section) return [];
  return section.bars.map((bar) => ({
    bar: bar.bar,
    number: bar.barInSection + 1,
    chords: bar.chords.map((c) => c.symbol).join(' '),
    numeral: bar.chords[0]?.numeral ?? '',
    state: heard === null || bar.bar > heard ? 'ahead' : bar.bar === heard ? 'heard' : 'played',
    motif: bar.motif,
  }));
}

export interface SectionAhead {
  /** Counted from the song's start. */
  readonly index: number;
  readonly name: string;
  /** Its new key and meter where they change, else empty. */
  readonly change: string;
  /** Each bar's first chord. */
  readonly chords: readonly string[];
}

/** The sections after the one heard. */
export function sectionsAhead(sections: readonly SectionView[]): SectionAhead[] {
  return sections.slice(1, 1 + AHEAD_SECTIONS).map((section) => ({
    index: section.index,
    name: section.section,
    change: blockName(section).slice(section.section.length).replace(/^, /, ''),
    chords: section.bars.map((bar) => bar.chords[0]?.symbol ?? ''),
  }));
}

/** The notes of the melodic scale over the bar heard, spelled in its key, and the scale where it isn't plain. */
export function overThis(bar: Pick<BarView, 'melodic' | 'tonic' | 'melodicName'> | null): string {
  if (!bar) return '';
  const notes = scaleNoteNames(bar.melodic, bar.tonic).join(' ');
  return bar.melodicName === 'plain' ? notes : `${notes} · ${bar.melodicName}`;
}
