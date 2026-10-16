/**
 * How far ahead the plan is read, and readings of it apart from the views:
 * where a change of section, key or meter is labelled, the chord that comes
 * next and the beats until it, and a section's name with what changes in it.
 * The Song view (`songView.ts`) reads the plan through these. Each reads what
 * `hudOf` gives and decides nothing of the music.
 */

import type { BarView, ChordView, Hud, SectionView } from './hud.ts';

/** How many bars the plan is read to, the bar heard among them. */
export const CHORD_BARS = 8;

/** How many sections are read near: the section heard and the next. */
export const NEAR_SECTIONS = 2;

/** How many sections are read after those. */
export const FAR_SECTIONS = 3;

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

/** A block's name in the plan: its section, and its key and its meter where they change. */
export const blockName = (section: SectionView): string =>
  [
    section.section,
    section.newKey ? section.key : null,
    section.newMeter ? section.meterName : null,
  ]
    .filter((part) => part !== null)
    .join(', ');
