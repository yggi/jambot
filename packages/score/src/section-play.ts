/**
 * A section's cells text played through cells' engine and read back bar by
 * bar (E35's reading, #395), which the experiment and the app share (#399).
 *
 * The text is compiled (`planOf`), its notes worked out over the section
 * (`windowAt`) and sent through cells' MIDI out (`channelTable`, `router`,
 * `midiNote`), as Jambot's own MIDI out would hear them: 1 the lead, 2 the
 * bass, 3 the pad and the stab, 10 the drums. Two lines of the reading's own
 * go beside the text, on channels of their own: each bar's lap (15), which
 * says where cells holds each bar, and the harmony (16), so each chord is
 * read back too. A note's step, and a chord's, is read off cells' time
 * through the band's swing undone (`leanMap`'s `written`), and a note's
 * written length as its sounding length in those steps over the share its
 * line reads at its onset (cells' own `legato=` tracks), since cells sounds a
 * share of the written steps and swings its end as its onset (cells v0.6.0,
 * yggi/cells#120).
 *
 * A negative gain is phase inversion (cells v0.7.0), and MIDI has no phase:
 * cells' MIDI out strikes a note at its gain's size, so a note read back is
 * struck as hard inverted as upright. The built-in synth plays the notes
 * read back, and so ignores the sign (#413): inverting a voice alone is not
 * heard, and the band writes no voice beside its own inversion.
 *
 * Each note also says where it falls in its bar as played: its onset and
 * end in the bar's steps through the swing (`onsets`, `ends`), which a host
 * lays on its own clock, and which line and drum role it comes from (cells
 * names each note's output by its line, `lines` and `roles`).
 */

import {
  type BandBar,
  type DrumRole,
  type Key,
  type MeterSwing,
  leanMap,
  leansOf,
  stepSeconds,
} from '@jambot/engine';
import { type Meter, formatNumeral, joinChord, stepsOf } from '@jambot/theory';
import { type Plan, planOf, windowAt } from '@yggi/cells';
import { resolveSeed } from '@yggi/cells/repository/library';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { heldAt } from '@yggi/cells/engine/series';
import {
  type NotePart,
  type PitchedName,
  type SectionNote,
  type StatedChord,
  noteOrder,
  numeralOfNotes,
  sortNotes,
  statedChords,
} from './section-text.ts';

const CHANNEL_OF: Readonly<Record<NotePart, number>> = { lead: 1, bass: 2, comp: 3, drums: 10 };

/** A chord as the harmony states it: its step, its numeral, and its notes as pitch classes, low to high. */
export interface HeardChord extends StatedChord {
  readonly pitchClasses: readonly number[];
}

/** A chord's notes as pitch classes, each once, low to high. */
export const pitchClassesOf = (notes: readonly number[]) =>
  [...new Set(notes.map((n) => ((n % 12) + 12) % 12))].sort((a, b) => a - b);

/** A bar's chords as the band writes them: each one's step, numeral and pitch classes. */
export const bandChords = (bar: BandBar): HeardChord[] =>
  statedChords(bar).map((c, i) => ({
    ...c,
    pitchClasses: pitchClassesOf(joinChord(bar.chords[i]!.chord)),
  }));

/** One bar of what cells played: its notes, and for each, in the same order, where and how it sounds. */
export interface PlayedBar {
  /** In the order of `sortNotes`. */
  readonly notes: SectionNote[];
  /** Each onset in seconds from the section's start, on cells' own clock. */
  readonly at: number[];
  /** The share of its held length each note sounds. */
  readonly shares: number[];
  /** Each onset in the bar's steps as played, through the swing: 0 is the bar's first step. */
  readonly onsets: number[];
  /** Each end in the bar's steps as played, through the swing: past the bar's last step where it runs on. */
  readonly ends: number[];
  /** The line each note comes from: a pitched line, or the drums. */
  readonly lines: (PitchedName | 'drums')[];
  /** Each drum hit's role, as its line names it; none for a pitched note. */
  readonly roles: (DrumRole | undefined)[];
}

/** What a section's text plays through cells: its notes and chords bar by bar, each bar's length, and what cells said. */
export interface PlayedSection {
  readonly bars: readonly PlayedBar[];
  readonly chords: readonly HeardChord[][];
  /** Where each bar starts and the section ends, in seconds: where its `1m` tap comes round. */
  readonly laps: readonly number[];
  readonly diagnostics: string[];
}

/**
 * The reading's own lines, not counted: each bar's lap and the harmony, each on a channel of its own (15 and 16).
 * The harmony heard is `&harm` itself: a played table turns for the lines read through it (cells v0.6.0, yggi/cells#167).
 */
const READING = [
  '&lap step=1m 0',
  '&readV loop=C4',
  '&read map=midi ~!14 [&lap * &readV] [&harm * &readV]',
].join('\n');

/** The share of its held length a note sounds, as cells reads its line's `legato=` at its onset. */
function shareOf(plan: Plan, output: string | undefined, at: number): number {
  const track = plan.tracks.find((t) => t.output.id === output);
  if (!track) return 1;
  const l = track.share;
  if (typeof l === 'number') return l;
  const x = l.series.reduce((a, m) => {
    const e = heldAt(plan, m, at);
    return a * (e ? e.value + e.alter : 1);
  }, 1);
  return l.range ? l.range[0] + (l.range[1] - l.range[0]) * x : x;
}

/**
 * The line a note comes from, by the output cells names it with: a gate's
 * voice, then its line (`compV:pad:…`), or a kit's member, then its role
 * (`kit:voices:hat:…`).
 */
export function lineOf(output: string | undefined): {
  line: PitchedName | 'drums';
  role?: DrumRole;
} {
  const [first, second, third] = (output ?? '').split(':');
  if (first === 'kit') return { line: 'drums', role: third as DrumRole };
  return { line: second as PitchedName };
}

/**
 * What of a bar cells' reading of a text needs beside the text (`playSection`): its meter and swing, which each
 * time is read through, its tempo, which sizes the window read, and its key, which names a chord's numeral.
 * A `BandBar` is one; a host that sends a section's text sends one frame for its bars, as one text states one
 * meter, swing and key (`hostOf`), and its first bar's tempo (`tempo: 'first'`) (#446).
 */
export interface SectionFrame {
  readonly meter: Meter;
  readonly swing: MeterSwing;
  readonly style: { readonly bpm: number };
  readonly plan: { readonly key: Key };
}

/**
 * A section's text compiled with the reading's own lines beside it: what `playSection` plays. Its `use` lines (the
 * drums' `use * from "core kit"`) read through cells' seed library (`resolveSeed`, cells v0.10.1's engine host).
 */
export const compileSection = (text: string): Plan =>
  planOf(`${text}\n${READING}`, undefined, { resolve: resolveSeed });

/**
 * A section's text played through cells' MIDI out, read back bar by bar
 * (compiled first, unless given compiled).
 * Each time is read as a step of its bar through the band's swing undone
 * (`leanMap`'s `written`), and a note's written length as its sounding
 * length in those steps over the share its line reads at its onset.
 */
export function playSection(
  text: string,
  bars: readonly SectionFrame[],
  plan: Plan = compileSection(text),
): PlayedSection {
  const steps = stepsOf(bars[0]!.meter);
  const estimate = bars.length * steps * stepSeconds(bars[0]!.style.bpm, bars[0]!.meter);
  const route = router(plan.result, channelTable(plan.result));
  const out = windowAt(plan, 0, estimate * 1.25).events.flatMap((e) =>
    routesOf(route(e)).flatMap((r) => {
      const n = midiNote(e, r);
      return n ? [{ ...n, share: shareOf(plan, e.output, e.at), ...lineOf(e.output) }] : [];
    }),
  );
  const laps = [...new Set(out.filter((n) => n.channel === 15).map((n) => n.at))]
    .sort((a, b) => a - b)
    .slice(0, bars.length + 1);
  const end = laps[bars.length]!;
  const barOf = (at: number) => laps.findLastIndex((l) => l <= at + 1e-9);
  type Timed = {
    note: SectionNote;
    at: number;
    share: number;
    onset: number;
    end: number;
    line: PitchedName | 'drums';
    role: DrumRole | undefined;
  };
  const read = bars.map(() => ({ timed: [] as Timed[] }));
  const harmony = bars.map(() => new Map<number, number[]>());
  for (const n of out) {
    if (n.at >= end - 1e-9) continue;
    const i = barOf(n.at);
    const bar = bars[i]!;
    const from = laps[i]!;
    const step = (laps[i + 1]! - from) / steps;
    const unswung = leanMap(leansOf(bar.swing), bar.meter);
    const stepOf = (seconds: number) => unswung.written((seconds - from) / step);
    if (n.channel === 16) {
      const s = Math.round(stepOf(n.at));
      harmony[i]!.set(s, [...(harmony[i]!.get(s) ?? []), n.note]);
      continue;
    }
    const part = (Object.keys(CHANNEL_OF) as NotePart[]).find((p) => CHANNEL_OF[p] === n.channel);
    if (!part) continue;
    const onset = stepOf(n.at);
    read[i]!.timed.push({
      at: n.at,
      share: n.share,
      onset: (n.at - from) / step,
      end: (n.end - from) / step,
      line: n.line,
      role: n.role,
      note: {
        part,
        step: onset,
        note: n.note,
        velocity: n.velocity,
        written: (stepOf(n.end) - onset) / n.share,
        length: stepOf(n.end) - onset,
      },
    });
  }
  return {
    bars: read.map(({ timed }) => {
      timed.sort((a, b) => noteOrder(a.note, b.note));
      return {
        notes: timed.map((t) => t.note),
        at: timed.map((t) => t.at),
        shares: timed.map((t) => t.share),
        onsets: timed.map((t) => t.onset),
        ends: timed.map((t) => t.end),
        lines: timed.map((t) => t.line),
        roles: timed.map((t) => t.role),
      };
    }),
    chords: harmony.map((h, i) =>
      [...h]
        .sort(([a], [b]) => a - b)
        .map(([s, notes]) => {
          const numeral = numeralOfNotes(
            bars[i]!.plan.key,
            notes.sort((a, b) => a - b),
          );
          return {
            step: s,
            numeral: numeral ? formatNumeral(numeral) : '?',
            pitchClasses: pitchClassesOf(notes),
          };
        }),
    ),
    laps,
    diagnostics: plan.result.diagnostics.map((d) => d.message),
  };
}

/** Within a millionth of a step. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Where two lists of a part's notes part on the written layer (step, pitch, velocity, written length), one line each; with `sounding`, on the sounding length too. */
export function mismatches(
  band: readonly SectionNote[],
  cells: readonly SectionNote[],
  sounding = false,
): string[] {
  const [left, right] = [sortNotes(band), sortNotes(cells)];
  const out =
    left.length === right.length
      ? []
      : [`${left.length} notes in the band, ${right.length} in cells`];
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const [a, b] = [left[i]!, right[i]!];
    if (
      a.part !== b.part ||
      a.note !== b.note ||
      !same(a.step, b.step) ||
      !same(a.written, b.written) ||
      a.velocity !== b.velocity ||
      (sounding && !same(a.length, b.length))
    )
      out.push(`band ${JSON.stringify(a)}, cells ${JSON.stringify(b)}`);
  }
  return out;
}
