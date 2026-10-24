/**
 * The homeostat's sensor (#237, step 6; yggi/cells decision 055): whether
 * what each band member played in a bar is a fragment the repository holds,
 * and the share of bars recognised over the last `SHARE_BARS`, per member
 * and over all of them. It measures; nothing here moves what plays.
 *
 * A member is one of the loop's facets (`LOOP_FACETS`, the facets of
 * `facet.ts`): the drums (`rhythm`), the bass, the lead and the harmony.
 * What one played in a bar is stated as cells text by its own text function
 * (`barTexts`): the drums' hits by `grooveText`, the clave aside, since a
 * clave is a fragment of its own the drum bar layers with; the bass's notes
 * as a line over the bar's chords by `lineText`; the lead's as a line in the
 * bar's key by `leadText`; and the harmony's by `progressionText`, of its
 * section's eight bars, since a progression is a section's (`progressions.ts`),
 * so every bar of a section states the theme it plays, which the composer
 * knows from the section's start. A member that plays no note in a bar, or
 * a theme with a slot no text states (a secondary dominant, a slot off a
 * bar's start and half), states nothing there.
 *
 * A text is recognised (`recognisedBar`) where cells' recogniser
 * (`createRecogniser().recognise`) finds it among the member's library
 * (`libraryOf`: cells' seed fragments of its facet, and those the learned
 * layer filed as it), exactly (a tolerance of 0 notes, cells' default;
 * E44 tries more, which #237's step 1 takes from the licence) or by one of
 * the operators the composer varies that member by (depth 1, cells'
 * default): the rhythm operators on every line but the fill, the bass's
 * transpose, invert and reverse, the lead's lift and turn over, and none on
 * a harmony, which cells has none for (yggi/cells#208). Each is read on the
 * workbench the member's fragments are read and varied on, with the
 * instruments its voices sound through (`recogniseOptionsOf`), so a
 * fragment and the bar it plays read alike; one recogniser warmed on a
 * library compiles only the heard text.
 *
 * The share (`shareOf`) is over a window of the last `SHARE_BARS` bars'
 * recognitions (`heardInto`, the owner's ruling of 2026-10-22): for a
 * member, the bars it played in that are recognised, over those it played
 * in; over all members, pooled, every member's bar played counting once. A
 * window none played in has no share. Over all members is the share the
 * homeostat controls (E44: each member's alone is pinned at 0 or 1 in most
 * sections). Pure: the recogniser is cells'.
 */

import { stepsOf } from '@jambot/theory';
import { type Operator, PITCHED_OPERATORS, RHYTHM_OPERATORS } from '@yggi/cells/engine/vary/index';
import type { Fragment } from '@yggi/cells/repository/fragments';
import { type RecogniseOptions, type Recogniser } from '@yggi/cells/repository/recognise';
import type { BandBar } from './band.ts';
import { BASS_VOICE, lineText, readingBench } from './bass-lines.ts';
import { chordsOn } from './chords.ts';
import type { Bench } from './facet.ts';
import { SECTION_BARS } from './form.ts';
import { type HarmonySlot, SLOT_BAR } from './harmony-query.ts';
import { instrumentsFor } from './instruments.ts';
import type { LearnedLayer } from './layer.ts';
import { LEAD_OPERATORS, LIFT, leadBench, leadText } from './lead-lines.ts';
import { nameOf } from './line-repository.ts';
import { GROOVE_FEWEST, VOICE_OF_NOTE, grooveText } from './muse-groove.ts';
import { lineOf } from './muse-line.ts';
import { leadOf } from './muse-lead.ts';
import { GROOVE_KEEP } from './novelty.ts';
import { harmonyBench, progressionText } from './progressions.ts';
import { SEED_FRAGMENTS } from './repository.ts';
import { benchText } from './rhythms.ts';
import type { Theme } from './themes.ts';

/** The band members in the loop, by facet: the drums, the bass, the lead and the harmony (`facet.ts`). */
export const LOOP_FACETS = ['rhythm', 'bass', 'lead', 'harmony'] as const;
export type LoopFacet = (typeof LOOP_FACETS)[number];

/** The bars a share is taken over: the last eight (the owner's ruling, #237, 2026-10-22). */
export const SHARE_BARS = 8;

/** What each member played in a bar, as cells text; a member absent where it stated nothing. */
export type BarTexts = Readonly<Partial<Record<LoopFacet, string>>>;

/** Whether each member that played in a bar was recognised; a member absent where it stated nothing. */
export type BarRecognition = Readonly<Partial<Record<LoopFacet, boolean>>>;

/** The recognitions of the last bars, oldest first, at most `SHARE_BARS`. */
export type RecognitionWindow = readonly BarRecognition[];

/** Nothing heard yet. */
export const NOTHING_RECOGNISED: RecognitionWindow = [];

/** Whether a fragment is associated as a facet. */
const isOf = (facet: LoopFacet) => (fragment: Fragment) =>
  fragment.association.some((p) => p.facet === facet);

/** A member's library: cells' seed fragments of its facet, then those the layer filed as it, in the layer's order. */
export function libraryOf(facet: LoopFacet, layer?: LearnedLayer): Fragment[] {
  return [
    ...SEED_FRAGMENTS.filter(isOf(facet)),
    ...(layer?.filed ?? []).map((f) => f.fragment).filter(isOf(facet)),
  ];
}

/** Every drum voice the band's kit strikes, as a line reads them, so a workbench brings each one's instrument. */
const KIT_VOICES = [...new Set(VOICE_OF_NOTE.values())].map((v) => `&${v}`).join(' ');

/** The instruments a member's voices sound through: its seeds', and those its own texts read. */
const INSTRUMENTS: Readonly<Record<LoopFacet, readonly string[]>> = {
  rhythm: instrumentsFor(
    [`&kit ${KIT_VOICES}`, ...SEED_FRAGMENTS.filter(isOf('rhythm')).map((f) => f.text)].join('\n'),
  ),
  bass: instrumentsFor(
    [...BASS_VOICE, ...SEED_FRAGMENTS.filter(isOf('bass')).map((f) => f.text)].join('\n'),
  ),
  lead: [],
  harmony: [],
};

/** The operators each member is recognised by: those the composer varies it by. */
const OPERATORS: Readonly<Record<LoopFacet, readonly Operator[]>> = {
  rhythm: RHYTHM_OPERATORS,
  bass: PITCHED_OPERATORS,
  lead: LEAD_OPERATORS,
  harmony: [],
};

/**
 * What a member's bar is recognised under on a bench: the workbench its
 * fragments are read and varied on, with its instruments, and the
 * operators and policy the composer varies it by. Null where the bench's
 * meter has no workbench (none cells names).
 */
export function recogniseOptionsOf(facet: LoopFacet, bench: Bench): RecogniseOptions | null {
  const name = nameOf(bench.meter);
  if (name === null) return null;
  const bench_ =
    facet === 'rhythm'
      ? benchText(bench)
      : facet === 'bass'
        ? readingBench(name)
        : facet === 'lead'
          ? leadBench(name)
          : harmonyBench(name);
  if (bench_ === null) return null;
  const workbench = [bench_, ...INSTRUMENTS[facet]].join('\n');
  const operators = OPERATORS[facet];
  if (facet === 'rhythm') return { workbench, operators, keep: GROOVE_KEEP, fewest: GROOVE_FEWEST };
  if (facet === 'lead') return { workbench, operators, degrees: [LIFT] };
  return { workbench, operators };
}

/**
 * Whether each member that stated a bar is recognised among its library,
 * on the bench: by cells' recogniser, under `recogniseOptionsOf`, with as
 * many notes differing as `tolerance` (a whole number; 0, exactly, by
 * default). A member on a bench with no workbench is not recognised.
 */
export function recognisedBar(
  recogniser: Recogniser,
  texts: BarTexts,
  bench: Bench,
  layer?: LearnedLayer,
  tolerance = 0,
): BarRecognition {
  const out: Partial<Record<LoopFacet, boolean>> = {};
  for (const facet of LOOP_FACETS) {
    const text = texts[facet];
    if (text === undefined) continue;
    const options = recogniseOptionsOf(facet, bench);
    out[facet] =
      options !== null &&
      recogniser.recognise(text, libraryOf(facet, layer), { ...options, tolerance }).length > 0;
  }
  return out;
}

/** A theme's eight bars as a progression's slots, or null where a slot is none a progression states. */
function themeSlots(theme: Theme): HarmonySlot[] | null {
  const slots: HarmonySlot[] = [];
  for (const [b, bar] of theme.bars.entries())
    for (const slot of bar) {
      if (!('degree' in slot) || (slot.step !== 0 && slot.step !== SLOT_BAR / 2)) return null;
      slots.push({ step: b * SLOT_BAR + slot.step, degree: ((slot.degree % 7) + 7) % 7 });
    }
  return theme.bars.length === SECTION_BARS ? slots : null;
}

/**
 * What each member played in a bar as the band plays it, as cells text:
 * the drums' hits but the clave's, the bass's notes over the bar's chords,
 * the lead's in the bar's key, and the section's theme; each where it
 * states anything.
 */
export function barTexts(bar: BandBar): BarTexts {
  const steps = stepsOf(bar.meter);
  const out: Partial<Record<LoopFacet, string>> = {};
  const hits = bar.written.flatMap((n, i) =>
    n.part === 'drums' && n.role !== undefined && n.role !== 'clave' && VOICE_OF_NOTE.has(n.note)
      ? [{ role: n.role, note: n.note, step: n.step, velocity: bar.dough[i]!.velocity }]
      : [],
  );
  if (hits.length) out.rhythm = grooveText(hits, steps);
  const bass = bar.written.filter((n) => n.part === 'bass' && n.step < steps);
  if (bass.length)
    out.bass = lineText(
      lineOf(bass, chordsOn(bar.chords, bar.meter), chordsOn(bar.next, bar.meter)),
      steps,
    );
  const lead = bar.written.filter((n) => n.part === 'lead' && n.step < steps);
  if (lead.length) out.lead = leadText(leadOf(lead, bar.plan.key), steps);
  const slots = themeSlots(bar.plan.theme);
  if (slots) out.harmony = progressionText(slots);
  return out;
}

/** The window with a bar's recognition heard last: the last `SHARE_BARS` bars. */
export const heardInto = (window: RecognitionWindow, bar: BarRecognition): RecognitionWindow =>
  [...window, bar].slice(-SHARE_BARS);

/**
 * The share of the window's bars recognised: of a member's, those it
 * played in; over all members (no facet given), every member's bar played,
 * pooled. Null where none played in the window.
 */
export function shareOf(window: RecognitionWindow, facet?: LoopFacet): number | null {
  const heard = window.flatMap((bar) =>
    (facet === undefined ? LOOP_FACETS : [facet]).flatMap((f) => {
      const recognised = bar[f];
      return recognised === undefined ? [] : [recognised];
    }),
  );
  return heard.length ? heard.filter(Boolean).length / heard.length : null;
}
