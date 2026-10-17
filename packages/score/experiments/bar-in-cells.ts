/**
 * E33: the band writes a whole bar as one cells text and plays it through the
 * cells engine (#359; the seam, #63; rung 3 of #358).
 *
 * E31 stated the drums, E32 the harmony, each alone. This states a bar's
 * drums, bass, comp and harmony together as one text, with `&bar` a
 * `meter(…)` cell that every line taps, and measures what E31 left open:
 * when each step plays. Over all 8 presets in 4/4 and 2 of them (Synth-pop
 * and Bossa nova, both swing 0, with every non-lead part between them) in
 * 3/4 and 7/8 (3+2+2), seed 0, entropy 0.3, 32 bars each: 384 bars.
 *
 * The bars come from the band's own transport (`transport`, a style held at
 * the preset's, the meter asked for and its bpm counted in that meter's
 * beats), so each onset has the time the
 * transport gives it. What is compared is what is composed, without the
 * performer's licence (T17): each written note's step, pitch and written
 * length in whole steps, and its velocity as the ensemble's default
 * (`baseVelocityOf`) plus a written accent, which is the velocity the
 * performer plays at feel 0. A text is played through cells' MIDI out
 * (`channelTable`, `router`, `midiNote`) and read back part by part:
 * channel 10 the drums, 2 the bass, 3 the pad and the stab (the comp), as
 * Jambot's own MIDI out sends them (`DEFAULT_CHANNELS`).
 *
 * The text, one bar, every line on a tap of `&bar`:
 *
 * - the meter, `&bar meter("7/8") step=108bpm`: cells' bpm counts the
 *   meter's beats (decision 040), and so does Jambot's (#367), so the text
 *   states the band's tempo as it is, with no conversion;
 * - the harmony, the key and the chords as stacks of its degrees (E32's
 *   stacks, the owner's choice of 2026-10-17): `&key scale(aeolian, A)`,
 *   `&harm over=&key step=2n [0,2,4] [4,6#,8]`; nothing plays it, and the
 *   reading plays it on a channel of its own to read each chord back;
 * - the drums, a line a role on `16n` taps with each hit's level (E31), the
 *   rim one Euclid token on `1m` where the band writes it as `even`;
 * - the bass and the comp, on `16n` taps, as degrees of the key from their
 *   voices (C1 and C3, E32's pins), each note held `@k` for its written
 *   length; their velocities a line of levels (`map=amp`), or one gain where
 *   a line has one velocity, through a gate (`play=`, `level=`);
 * - one MIDI card.
 *
 * Where cells cannot say what a bar does, the probe records a gap with a
 * witness and invents no form; the gaps are in `docs/language-experiments.md`,
 * E33, and the test holds each.
 *
 * It runs under vitest, not node, as E31 and E32. Its test,
 * `bar-in-cells.test.ts`, holds what it found;
 * `E33_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/bar-in-cells.test.ts`
 * prints the table and a witness bar's text.
 */

import {
  type BandBar,
  DRUM_ROLES,
  type DrumRole,
  LOOKAHEAD,
  PRESETS,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  baseVelocityOf,
  chordNumeral,
  clockOfTransport,
  holding,
  holdingSwing,
  sameMeter,
  slotStepOn,
  stepSeconds,
  transport,
} from '@jambot/engine';
import { METERS, type MeterName, formatNumeral, parseNumeral, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { lowerNumeral } from '../src/score.ts';
import { VOICE_OF_NOTE, euclidOf, levelOf } from './drums-in-cells.ts';
import {
  PIN_VOICES,
  chordTones,
  degreeText,
  keyText,
  numeralOfNotes,
  pinTone,
  rhythmText,
} from './pitch-in-cells.ts';

/** The run every bar comes from, as E31's and E32's. */
export const SEED = 0;
export const ENTROPY = 0.3;
export const BARS = 32;

/** The meters other than 4/4, and the two presets they run on: swing 0, so their times are compared, and every non-lead part between them. */
export const OTHER_METERS: readonly MeterName[] = ['3/4', '7/8'];
export const METER_PRESETS: readonly string[] = ['Synth-pop', 'Bossa nova'];

/** One run: a preset in a meter. */
export interface RunKey {
  readonly preset: string;
  readonly meter: MeterName;
}

/** Every run: the 8 presets in 4/4, then the two in 3/4 and 7/8. */
export const RUNS: readonly RunKey[] = [
  ...PRESETS.map((p) => ({ preset: p.name, meter: '4/4' as const })),
  ...METER_PRESETS.flatMap((preset) => OTHER_METERS.map((meter) => ({ preset, meter }))),
];

/** The parts compared: the band's channels, the comp being the pad and the stab on one. */
export const PARTS = ['drums', 'bass', 'comp', 'harmony'] as const;
export type ComparedPart = (typeof PARTS)[number];
type NotePart = Exclude<ComparedPart, 'harmony'>;

const CHANNEL_OF: Readonly<Record<NotePart, number>> = { drums: 10, bass: 2, comp: 3 };

/** A note as composed or as cells plays it: its part, step, MIDI note, length in steps and velocity. */
export interface Note {
  readonly part: NotePart;
  readonly step: number;
  readonly note: number;
  readonly length: number;
  readonly velocity: number;
}

/** A chord the harmony states, at its step, as Jambot's numeral. */
export interface StatedChord {
  readonly step: number;
  readonly numeral: string;
}

/** The transport's clock starts here, in seconds. */
const START = 1;
/** How often the transport is ticked: under its lookahead, so no step is missed. */
const TICK = 0.1;

/** A run of the band through its own transport: the bars it composed and the onsets it timed. */
export interface Run extends RunKey {
  readonly bars: readonly BandBar[];
  readonly events: readonly TimedEvent[];
  /** When each bar starts, in seconds from the song's start. */
  readonly barStarts: readonly number[];
  readonly missed: number;
}

const presetOf = (name: string) => PRESETS.find((p) => p.name === name)!;

/** The band's transport over a preset held, in a meter, until 32 bars are laid. */
export function runOf({ preset: name, meter }: RunKey): Run {
  const preset = presetOf(name);
  const env: TransportEnv = {
    seed: SEED,
    start: START,
    track: holding({ ...preset.style, entropy: ENTROPY }),
    swing: holdingSwing(preset.swing),
    wish: { tonic: null, mode: preset.mode, melodic: null },
    meter: METERS[meter],
    tempoMeter: METERS[meter],
  };
  let carried: TransportCarried | null = transport.initial;
  const events: TimedEvent[] = [];
  const bars: BandBar[] = [];
  const stepAt = new Map<number, number>();
  let missed = 0;
  for (let now = START - TICK; ; now += TICK) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried!;
    events.push(...next.output.events);
    bars.push(...next.output.composed);
    for (const s of next.output.steps) stepAt.set(s.step, s.seconds - START);
    missed += next.output.missed;
    if (bars.length > BARS && carried.head.step > clockOfTransport(carried).barStart(BARS)) break;
  }
  const clock = clockOfTransport(carried);
  return {
    preset: name,
    meter,
    bars: bars.slice(0, BARS),
    events: events.filter((e) => e.bar < BARS && e.event.part !== 'lead'),
    barStarts: Array.from({ length: BARS }, (_, bar) => stepAt.get(clock.barStart(bar))!),
    missed,
  };
}

/** A meter's name, as cells writes it in `meter("…")`. */
export function meterName(bar: BandBar): MeterName {
  return (Object.keys(METERS) as MeterName[]).find((name) => sameMeter(METERS[name], bar.meter))!;
}

const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

/** A bar's composed notes, the lead left out: the step, pitch and written length, and the velocity the performer plays at feel 0. */
export function composedNotes(bar: BandBar): Note[] {
  return sortNotes(
    bar.written.flatMap((w): Note[] =>
      w.part === 'lead'
        ? []
        : [
            {
              part: w.part === 'pad' || w.part === 'stab' ? 'comp' : w.part,
              step: w.step,
              note: w.note,
              length: w.length,
              velocity: clampVelocity(baseVelocityOf(bar, w) + (w.accent ?? 0)),
            },
          ],
    ),
  );
}

const sortNotes = (notes: readonly Note[]): Note[] =>
  [...notes].sort((a, b) => a.part.localeCompare(b.part) || a.step - b.step || a.note - b.note);

/** A bar's chords as its harmony states them: the step on its meter and the numeral in its key. */
export function statedChords(bar: BandBar): StatedChord[] {
  return bar.chords.map((chord) => ({
    step: slotStepOn(bar.meter, chord.slot.step),
    numeral: formatNumeral(parseNumeral(chordNumeral(chord, bar.plan.key))!),
  }));
}

/** A line of the text, and which part it states. */
export interface Line {
  readonly part: 'meter' | 'key' | ComparedPart | 'card';
  readonly text: string;
}

/** What could not be stated as composed: a note held shorter than written, and why. */
export interface Cut {
  readonly part: NotePart;
  readonly step: number;
  readonly written: number;
  readonly stated: number;
  readonly why: 'next onset' | 'bar line';
}

/** A bar as one cells text: its lines, and what the text had to cut. */
export interface BarText {
  readonly lines: readonly Line[];
  readonly cuts: readonly Cut[];
}

export const textOf = (b: BarText) => b.lines.map((l) => l.text).join('\n');

/** The steps of a bar, each mapped. */
const eachStep = (steps: number, f: (step: number) => string) =>
  Array.from({ length: steps }, (_, step) => f(step)).join(' ');

/** A hit's own level after its voice, none at full velocity. */
const hitLevel = (velocity: number) => (velocity >= 127 ? '' : `:0:${levelOf(velocity)}`);

/** The drums: a line a role on 16ths, the rim one Euclid token where `even` wrote it; and the mix's terms. */
function drumLines(bar: BandBar, notes: readonly Note[]): { lines: string[]; terms: string[] } {
  const steps = stepsOf(bar.meter);
  const lines: string[] = [];
  const terms: string[] = [];
  const written = bar.written.filter((w) => w.part === 'drums');
  for (const role of DRUM_ROLES as readonly DrumRole[]) {
    const hits = notes.filter((n) =>
      written.some((w) => w.role === role && w.step === n.step && w.note === n.note),
    );
    if (hits.length === 0) continue;
    const sounds = new Set(hits.map((h) => h.note));
    const euclid =
      role === 'euclid' && sounds.size === 1
        ? euclidOf(
            hits.map((h) => h.step),
            steps,
          )
        : null;
    if (euclid) {
      const voice = VOICE_OF_NOTE.get(hits[0]!.note)!;
      lines.push(`&${role} step=1m &${voice}(${euclid.k},${steps},${euclid.r})`);
      const velocities = new Set(hits.map((h) => h.velocity));
      if (velocities.size === 1) {
        const v = hits[0]!.velocity;
        terms.push(v >= 127 ? `&${role}` : `&${role} * ${levelOf(v)}`);
      } else {
        const level = (s: number) => hits.find((h) => h.step === s)?.velocity;
        lines.push(
          `&${role}Level map=amp step=16n ${eachStep(steps, (s) => (level(s) ? levelOf(level(s)!) : '0'))}`,
        );
        terms.push(`&${role} * &${role}Level`);
      }
      continue;
    }
    const braid = eachStep(steps, (step) => {
      const words = hits
        .filter((h) => h.step === step)
        .map((h) => `&${VOICE_OF_NOTE.get(h.note)!}${hitLevel(h.velocity)}`);
      return words.length === 0 ? '~' : words.length === 1 ? words[0]! : `[${words.join(',')}]`;
    });
    lines.push(`&${role} step=16n ${braid}`);
    terms.push(`&${role}`);
  }
  return { lines, terms };
}

/** A held token: `x`, or `x@k` for k steps. */
const held = (text: string, length: number) => (length === 1 ? text : `${text}@${length}`);

/**
 * A pitched line on 16ths: each onset its notes as degrees of the key from
 * the part's voice (a chord a stack), held for its written length, cut at the
 * next onset or the bar line; and its levels, as a line or one gain.
 */
function pitchedLine(
  bar: BandBar,
  name: string,
  notes: readonly Note[],
  voice: 'comp' | 'bass',
  cuts: Cut[],
): { lines: string[]; level: string } {
  const steps = stepsOf(bar.meter);
  const key = bar.plan.key;
  const onsets = [...new Set(notes.map((n) => n.step))].sort((a, b) => a - b);
  const words: string[] = [];
  const levels: string[] = [];
  let at = 0;
  for (const [i, step] of onsets.entries()) {
    if (step > at) {
      words.push(held('~', step - at));
      levels.push(held('~', step - at));
    }
    const here = notes.filter((n) => n.step === step);
    const written = Math.max(...here.map((n) => n.length));
    const room = (onsets[i + 1] ?? steps) - step;
    const length = Math.min(written, room);
    if (length < written)
      cuts.push({
        part: here[0]!.part,
        step,
        written,
        stated: length,
        why: onsets[i + 1] === undefined ? 'bar line' : 'next onset',
      });
    const tones = here.map((n) => {
      const t = pinTone(key, n.note, voice);
      return degreeText(t.degree, t.accidental);
    });
    words.push(held(tones.length === 1 ? tones[0]! : `[${tones.join(',')}]`, length));
    levels.push(held(levelOf(here[0]!.velocity), length));
    at = step + length;
  }
  if (at < steps) {
    words.push(held('~', steps - at));
    levels.push(held('~', steps - at));
  }
  const velocities = new Set(notes.map((n) => n.velocity));
  const one = velocities.size === 1;
  return {
    lines: [
      `&${name} over=&key step=16n ${words.join(' ')}`,
      ...(one ? [] : [`&${name}Level map=amp step=16n ${levels.join(' ')}`]),
    ],
    level: one ? levelOf(notes[0]!.velocity) : `&${name}Level`,
  };
}

/** A bar's drums, bass, comp and harmony as one cells text. */
export function barAsCells(bar: BandBar): BarText {
  const key = bar.plan.key;
  const notes = composedNotes(bar);
  const cuts: Cut[] = [];
  const lines: Line[] = [
    { part: 'meter', text: `&bar meter("${meterName(bar)}") step=${bar.style.bpm}bpm` },
    { part: 'key', text: `&key ${keyText(key)}` },
  ];
  const chords = statedChords(bar);
  const stack = (numeral: string) => {
    const tones = chordTones(key, lowerNumeral(key, parseNumeral(numeral)!));
    return `[${tones.map((t) => degreeText(t.degree, t.accidental)).join(',')}]`;
  };
  lines.push({
    part: 'harmony',
    text: `&harm over=&key ${rhythmText(chords, (i) => stack(chords[i]!.numeral), stepsOf(bar.meter))}`,
  });
  const drums = drumLines(
    bar,
    notes.filter((n) => n.part === 'drums'),
  );
  const voices = [
    ...new Set(notes.filter((n) => n.part === 'drums').map((n) => VOICE_OF_NOTE.get(n.note)!)),
  ];
  lines.push(
    ...drums.lines.map((text) => ({ part: 'drums' as const, text })),
    ...(drums.terms.length
      ? [{ part: 'drums' as const, text: `&drums [${drums.terms.join(', ')}]` }]
      : []),
    ...voices.map((voice) => ({ part: 'drums' as const, text: `&${voice} s=white` })),
  );
  const bass = bar.written.some((w) => w.part === 'bass');
  if (bass) {
    const line = pitchedLine(
      bar,
      'bass',
      notes.filter((n) => n.part === 'bass'),
      'bass',
      cuts,
    );
    lines.push(
      ...line.lines.map((text) => ({ part: 'bass' as const, text })),
      { part: 'bass', text: `&bassOut play=&bass level=${line.level} &bassV` },
      { part: 'bass', text: `&bassV loop=${PIN_VOICES.bass}` },
    );
  }
  const comp = (['pad', 'stab'] as const).filter((p) => bar.written.some((w) => w.part === p));
  for (const part of comp) {
    const own = composedNotes({
      ...bar,
      written: bar.written.filter((w) => w.part === part),
    });
    const line = pitchedLine(bar, part, own, 'comp', cuts);
    lines.push(...line.lines.map((text) => ({ part: 'comp' as const, text })), {
      part: 'comp',
      text: `&${part}Out play=&${part} level=${line.level} &compV`,
    });
  }
  if (comp.length) lines.push({ part: 'comp', text: `&compV loop=${PIN_VOICES.comp}` });
  const compEntry =
    comp.length === 0
      ? '~'
      : comp.length === 1
        ? `&${comp[0]}Out`
        : `[${comp.map((p) => `&${p}Out`).join(', ')}]`;
  lines.push({
    part: 'card',
    text: `&out map=midi ~ ${bass ? '&bassOut' : '~'} ${compEntry} ~!6 ${drums.terms.length ? '&drums' : '~'}`,
  });
  return { lines, cuts };
}

/** What a bar's text plays through cells: its notes by part, its chords read back, its bar's length, and what cells said. */
export interface Played {
  readonly notes: Note[];
  readonly chords: StatedChord[];
  /** How long cells holds the bar, in seconds: where its `1m` tap comes round. */
  readonly barSeconds: number;
  /** Each note's onset in seconds from the bar's start, in the order of `notes`. */
  readonly at: number[];
  readonly diagnostics: string[];
}

/** The reading's own lines, not counted: the bar's lap and the harmony, each on a channel of its own (15 and 16). */
const READING = [
  '&lap step=1m 0',
  '&readV loop=C4',
  '&read map=midi ~!14 [&lap * &readV] [&harm * &readV]',
].join('\n');

/** A text played through cells' MIDI out for its first bar, read back; `estimate` is about how long its bar is. */
export function cellsPlays(text: string, bar: BandBar): Played {
  const steps = stepsOf(bar.meter);
  const estimate = steps * stepSeconds(bar.style.bpm, bar.meter);
  const plan = planOf(`${text}\n${READING}`);
  const route = router(plan.result, channelTable(plan.result));
  const out = windowAt(plan, 0, estimate * 1.5).events.flatMap((e) =>
    routesOf(route(e)).flatMap((r) => {
      const n = midiNote(e, r);
      return n ? [n] : [];
    }),
  );
  const laps = out.filter((n) => n.channel === 15).map((n) => n.at);
  const barSeconds = laps.find((at) => at > 0)!;
  const step = barSeconds / steps;
  const inBar = out.filter((n) => n.at < barSeconds - 1e-9);
  const timed = inBar.flatMap((n) => {
    const part = (Object.keys(CHANNEL_OF) as NotePart[]).find((p) => CHANNEL_OF[p] === n.channel);
    if (!part) return [];
    const at = n.at / step;
    return [
      {
        seconds: n.at,
        note: { part, step: at, note: n.note, length: n.end / step - at, velocity: n.velocity },
      },
    ];
  });
  timed.sort(
    (a, b) =>
      a.note.part.localeCompare(b.note.part) ||
      a.note.step - b.note.step ||
      a.note.note - b.note.note,
  );
  const harmony = new Map<number, number[]>();
  for (const n of inBar.filter((x) => x.channel === 16)) {
    const s = Math.round(n.at / step);
    harmony.set(s, [...(harmony.get(s) ?? []), n.note]);
  }
  const key = bar.plan.key;
  const chords = [...harmony]
    .sort(([a], [b]) => a - b)
    .map(([s, notes]) => {
      const numeral = numeralOfNotes(
        key,
        notes.sort((a, b) => a - b),
      );
      return { step: s, numeral: numeral ? formatNumeral(numeral) : '?' };
    });
  return {
    notes: timed.map((t) => t.note),
    chords,
    barSeconds,
    at: timed.map((t) => t.seconds),
    diagnostics: plan.result.diagnostics.map((d) => d.message),
  };
}

/** Within a millionth of a step. */
const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Where two lists of a part's notes part, one line each; none when they are the same notes. */
export function mismatches(band: readonly Note[], cells: readonly Note[]): string[] {
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
      !same(a.length, b.length) ||
      a.velocity !== b.velocity
    )
      out.push(`band ${JSON.stringify(a)}, cells ${JSON.stringify(b)}`);
  }
  return out;
}

/** One bar measured: its text, what cells played, and per part whether it is the band's. */
export interface Measured {
  readonly run: RunKey;
  readonly bar: BandBar;
  readonly text: BarText;
  readonly played: Played;
  readonly equal: Readonly<Record<ComparedPart, boolean>>;
  readonly mismatches: Readonly<Record<NotePart, string[]>>;
  /** Each onset's distance from the transport's, in seconds: where the run's times are compared. */
  readonly offsets: readonly number[];
}

/** Whether a run's times are compared: its preset's meter is straight (cells has no swing on the bar yet, yggi/cells#18). */
export const timesCompared = (run: RunKey) => presetOf(run.preset).swing.share === 0.5;

/** Every bar of a run, stated, played (its text edited first, if asked) and compared; its onsets timed against the transport's where its swing is 0. */
export function measureRun(run: Run, edit: (text: string) => string = (t) => t): Measured[] {
  let cellsStart = 0;
  return run.bars.map((bar) => {
    const text = barAsCells(bar);
    const played = cellsPlays(edit(textOf(text)), bar);
    const band = composedNotes(bar);
    const of = (notes: readonly Note[], part: NotePart) => notes.filter((n) => n.part === part);
    const found = {
      drums: mismatches(of(band, 'drums'), of(played.notes, 'drums')),
      bass: mismatches(of(band, 'bass'), of(played.notes, 'bass')),
      comp: mismatches(of(band, 'comp'), of(played.notes, 'comp')),
    };
    const offsets: number[] = [];
    if (timesCompared(run)) {
      for (const [j, n] of played.notes.entries()) {
        const event = run.events.find(
          (e) =>
            e.bar === bar.bar &&
            (n.part === 'comp'
              ? e.event.part === 'pad' || e.event.part === 'stab'
              : e.event.part === n.part) &&
            e.event.note === n.note &&
            same(e.event.step, n.step),
        );
        if (event) offsets.push(cellsStart + played.at[j]! - (event.seconds - START));
      }
    }
    cellsStart += played.barSeconds;
    return {
      run: { preset: run.preset, meter: run.meter },
      bar,
      text,
      played,
      equal: {
        drums: found.drums.length === 0,
        bass: found.bass.length === 0,
        comp: found.comp.length === 0,
        harmony: JSON.stringify(played.chords) === JSON.stringify(statedChords(bar)),
      },
      mismatches: found,
      offsets,
    };
  });
}

/** Every run measured. */
export const measureAll = (): Measured[] => RUNS.flatMap((key) => measureRun(runOf(key)));

/** A run's row: bars equal per part, characters per part, onsets timed and within 1 ms, and the largest distance. */
export function table(measured: readonly Measured[]) {
  return RUNS.map((run) => {
    const bars = measured.filter((m) => m.run.preset === run.preset && m.run.meter === run.meter);
    const offsets = bars.flatMap((m) => m.offsets);
    return {
      preset: run.preset,
      meter: run.meter,
      equal: Object.fromEntries(PARTS.map((p) => [p, bars.filter((m) => m.equal[p]).length])),
      characters: characters(bars),
      timed: offsets.length,
      within1ms: offsets.filter((o) => Math.abs(o) < 0.001).length,
      largest: offsets.reduce((a, o) => Math.max(a, Math.abs(o)), 0),
    };
  });
}

/** Characters by part over some bars, each line with its newline. */
export function characters(measured: readonly Measured[]): Record<Line['part'] | 'total', number> {
  const out: Record<string, number> = { total: 0 };
  for (const m of measured)
    for (const line of m.text.lines) {
      out[line.part] = (out[line.part] ?? 0) + line.text.length + 1;
      out.total! += line.text.length + 1;
    }
  return out as Record<Line['part'] | 'total', number>;
}

/** A bar to read: the run, the bar, what is equal, and its text. */
export function report(m: Measured): string {
  return [
    `${m.run.preset} ${m.run.meter}, bar ${m.bar.bar}: ${PARTS.map((p) => `${p} ${m.equal[p] ? 'equal' : 'differs'}`).join(', ')}`,
    ...textOf(m.text)
      .split('\n')
      .map((line) => `  ${line}`),
  ].join('\n');
}
