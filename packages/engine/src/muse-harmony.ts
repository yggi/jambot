/**
 * The Muse's ear for progressions (#425): what a player played as chords
 * over a section, read as degrees of each bar's key, which the composer
 * files in the learned layer (`facet.ts`'s `filedHeard`; stated as cells
 * text by `progressions.ts`'s `progressionText`), as her ear for bass and
 * lead lines does (`muse-line.ts`, `muse-lead.ts`).
 *
 * A source is a player she heard here (not the band: its own themes are
 * the tables', and a player's progression is what she files). One path:
 *
 * - **a bar's chords** (`chordsOf`): a chord is struck where
 *   `CHORD_FEWEST` pitch classes or more sound on one step, as she rounds
 *   it; each half of the bar (step 0, and its half, `slotStepOn`) reads as
 *   the first chord struck in it, its lowest note settling the root
 *   (`chordOf`, the chord reader's), and its root as a degree of
 *   the bar's key. A half with no chord struck holds the one before; a bar
 *   whose first half has none, or a root off the key, isn't read.
 * - **distilled** (`distilledProgression`): the section's eight bars, a
 *   bar not read holding the chord before it, where its first bar is read
 *   and `PROGRESSION_FEWEST` of the eight are.
 *
 * A source heard as a bass in the bar isn't heard as chords there, and a
 * session's clients send no chords yet: only her own players' are read.
 */

import { type Meter, alteredDegree, stepsOf, wrap } from '@jambot/theory';
import { chordOf } from './chord-reading.ts';
import { slotStepOn } from './chords.ts';
import type { SongClock } from './events.ts';
import { SECTION_BARS } from './form.ts';
import { type HarmonySlot, SLOT_BAR } from './harmony-query.ts';
import { type Key, keyHelix } from './key.ts';
import { type HeardNote, heardStep } from './muse.ts';

/** The fewest pitch classes struck on one step to be a chord: a triad's. */
export const CHORD_FEWEST = 3;

/** The fewest bars of a section a progression is read in to be filed: half of them. */
export const PROGRESSION_FEWEST = 4;

/** The half of a bar a slot starts on, as a theme counts it. */
const HALF = SLOT_BAR / 2;

/** A note as the Muse hears a chord: its step in the bar and its pitch. */
export interface ChordStep {
  readonly step: number;
  readonly note: number;
}

/**
 * A bar's chords as slots of a key: on step 0 the chord struck in the
 * bar's first half, and on its half (8, as a theme counts it) the one
 * struck in its second where it is another; null where none is struck in
 * the first, a chord reads as no quality, or its root is off the key.
 */
export function chordsOf(
  notes: readonly ChordStep[],
  meter: Meter,
  key: Key,
): HarmonySlot[] | null {
  const half = slotStepOn(meter, HALF);
  const steps = stepsOf(meter);
  const byStep = new Map<number, number[]>();
  for (const { step, note } of notes)
    if (step >= 0 && step < steps) byStep.set(step, [...(byStep.get(step) ?? []), note]);
  const struck = [...byStep].filter(
    ([, ns]) => new Set(ns.map((n) => wrap(n, 12))).size >= CHORD_FEWEST,
  );
  const degreeIn = (from: number, to: number): number | null | undefined => {
    // (the first chord struck in the half: a slot starts with its half, and a passing chord after it is the player's own)
    const here = struck.filter(([s]) => s >= from && s < to).sort(([a], [b]) => a - b)[0]?.[1];
    if (!here) return undefined;
    const chord = chordOf(new Set(here.map((n) => wrap(n, 12))), wrap(Math.min(...here), 12));
    if (!chord) return null;
    const found = alteredDegree(keyHelix(key), 60 + chord.root);
    return found && found.accidental === 0 ? wrap(found.degree, 7) : null;
  };
  const first = degreeIn(0, half);
  if (first === undefined || first === null) return null;
  const second = degreeIn(half, steps);
  if (second === null) return null;
  return second === undefined || second === first
    ? [{ step: 0, degree: first }]
    : [
        { step: 0, degree: first },
        { step: HALF, degree: second },
      ];
}

/**
 * A section's progression from its bars as heard (eight, each a bar's
 * slots or null where it wasn't read): each bar not read holding the last
 * chord of the bar before; null where the first isn't read or fewer than
 * `PROGRESSION_FEWEST` are. Slots from the section's start, `SLOT_BAR` a bar.
 */
export function distilledProgression(
  bars: readonly (readonly HarmonySlot[] | null)[],
): readonly HarmonySlot[] | null {
  if (bars.length !== SECTION_BARS || !bars[0]) return null;
  if (bars.filter((b) => b !== null).length < PROGRESSION_FEWEST) return null;
  const slots: HarmonySlot[] = [];
  let last = bars[0][0]!.degree;
  bars.forEach((bar, b) => {
    if (!bar) {
      slots.push({ step: b * SLOT_BAR, degree: last });
      return;
    }
    for (const s of bar) slots.push({ step: b * SLOT_BAR + s.step, degree: s.degree });
    last = bar.at(-1)!.degree;
  });
  return slots;
}

/** What a player played as chords in one bar, read as slots of its key (`heardHarmony`). */
export interface HeardHarmonyBar {
  readonly source: string;
  readonly bar: number;
  readonly slots: readonly HarmonySlot[];
}

/**
 * Each source's chords in a bar, as the Muse hears them: each note on the
 * step her nearest reading rounds it to (`heardStep`), in the bar, read as
 * slots of the bar's key (`chordsOf`), of a source not among `bass`, those
 * heard as a bass in the bar. Sources in the order their first notes
 * arrived; none whose bar doesn't read.
 */
export function heardHarmony(
  notes: readonly HeardNote[],
  bar: number,
  key: Key,
  meter: Meter,
  clock: SongClock,
  bass: ReadonlySet<string> = new Set(),
): HeardHarmonyBar[] {
  const inBar = notes.filter((n) => clock.barAt(heardStep(n)) === bar && !bass.has(n.source));
  const sources = [...new Set(inBar.map((n) => n.source))];
  return sources.flatMap((source) => {
    const placed = inBar
      .filter((n) => n.source === source)
      // (`+ 0`: a note a hair before the downbeat rounds to -0)
      .map((n) => ({ step: clock.stepInBar(heardStep(n)) + 0, note: n.note }));
    const slots = chordsOf(placed, meter, key);
    return slots ? [{ source, bar, slots }] : [];
  });
}

/**
 * Each source's bars of a section, as `distilledProgression` takes them:
 * the eight bars from `first`, each its slots where the source was heard
 * then, else null. Sources in the order first heard.
 */
export function sectionHarmony(
  heard: readonly HeardHarmonyBar[],
  first: number,
): { readonly source: string; readonly bars: readonly (readonly HarmonySlot[] | null)[] }[] {
  const inSection = heard.filter((h) => h.bar >= first && h.bar < first + SECTION_BARS);
  const sources = [...new Set(inSection.map((h) => h.source))];
  return sources.map((source) => ({
    source,
    bars: Array.from(
      { length: SECTION_BARS },
      (_, b) => inSection.find((h) => h.source === source && h.bar === first + b)?.slots ?? null,
    ),
  }));
}
