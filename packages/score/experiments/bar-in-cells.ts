/**
 * E33: the band writes a whole bar as one cells text and plays it through the
 * cells engine (#359; the seam, #63; rung 3 of #358).
 *
 * E31 stated the drums, E32 the harmony, each alone. This states a bar's
 * drums, bass, comp and harmony together as one text, with `&bar` a
 * `meter(…)` cell that every line taps, and measures what E31 left open:
 * when each step plays, and how long each note sounds. Over all 8 presets in
 * 4/4 and 2 of them (Synth-pop and Bossa nova, both straight, with every
 * non-lead part between them) in 3/4 and 7/8 (3+2+2), seed 0, entropy 0.3,
 * 32 bars each: 384 bars.
 *
 * The bars come from the band's own transport (`transport`, a style held at
 * the preset's, the meter asked for and its bpm counted in that meter's
 * beats), so each onset has the time the
 * transport gives it. What is compared is what is composed, without the
 * performer's licence (T17): each written note's step and pitch, its
 * length as the ensemble articulates it (`baseLengthOf`: the bass and the
 * stab a share of the written length, the drums and the pad as written), in
 * steps, and its velocity as the ensemble's default (`baseVelocityOf`) plus
 * a written accent, which is the velocity the performer plays at feel 0.
 * A step is read off cells' times through the band's own swing undone
 * (`leanMap`'s `written`), so a swung bar's steps compare as a straight
 * one's. A text is played through cells' MIDI out
 * (`channelTable`, `router`, `midiNote`) and read back part by part:
 * channel 10 the drums, 2 the bass, 3 the pad and the stab (the comp), as
 * Jambot's own MIDI out sends them (`DEFAULT_CHANNELS`).
 *
 * The text, one bar, every line on a tap of `&bar`:
 *
 * - the meter, `&bar meter("7/8") step=108bpm`: cells' bpm counts the
 *   meter's beats (decision 040), and so does Jambot's (#367), so the text
 *   states the band's tempo as it is, with no conversion; a swung preset's
 *   meter states its swing, its level and share, as cells' swung meter
 *   fragments do (`&bar meter("4/4") step=84bpm swing=16n:.65`; cells
 *   v0.4.0, yggi/cells#18);
 * - the harmony, the key and the chords as stacks of its degrees (E32's
 *   stacks, the owner's choice of 2026-10-17): `&key scale(aeolian, A)`,
 *   `&harm over=&key step=2n [0,2,4] [4,6#,8]`, each chord stated once;
 *   no part plays it, and the reading plays it on a channel of its own to
 *   read each chord back, a played table turning for the lines read through
 *   it as one nothing plays (cells v0.6.0, yggi/cells#167);
 * - the drums, a line a role on `16n` taps with each hit's level (E31), the
 *   rim one Euclid token on `1m` where the band writes it as `even`;
 * - the bass and the comp, on `16n` taps, read over the chord in force
 *   (`over=&harm`, cells v0.5.0, yggi/cells#125, #387) from their voices (C1
 *   and C3, E32's pins): each note an index into the stack sounding at its
 *   onset (`throughChord`: past the last tone the chord a lap up, an
 *   accidental a degree of the key beside a tone), and a line with a note no
 *   index reaches as degrees of the key (`over=&key`, Swing jazz's approach
 *   notes); each note held `@k` for its written
 *   length and sounding its line's share of it (`legato=`, cells v0.4.0,
 *   yggi/cells#94), one share a line; their velocities a line of levels
 *   (`map=amp`), or one gain where a line has one velocity, through a gate
 *   (`play=`, `level=`);
 * - one MIDI card.
 *
 * Where cells cannot say what a bar does, the probe records a gap with a
 * witness and invents no form; the gaps are in `docs/language-experiments.md`,
 * E33, and the test holds each.
 *
 * It runs under vitest, as E31 and E32. Its test,
 * `bar-in-cells.test.ts`, holds what it found;
 * `E33_REPORT=1 pnpm vitest run --silent=false packages/score/experiments/bar-in-cells.test.ts`
 * prints the table and a witness bar's text.
 */

import {
  type BandBar,
  DRUM_ROLES,
  type DrumRole,
  LOOKAHEAD,
  type MelodicScale,
  PRESETS,
  type TimedEvent,
  type TransportCarried,
  type TransportEnv,
  STRAIGHT,
  baseLengthOf,
  baseVelocityOf,
  clockOfTransport,
  holding,
  holdingSwing,
  leanMap,
  leansOf,
  stepSeconds,
  transport,
} from '@jambot/engine';
import { METERS, type MeterName, formatNumeral, parseNumeral, stepsOf } from '@jambot/theory';
import { planOf, windowAt } from '@yggi/cells';
import { channelTable, midiNote, router, routesOf } from '@yggi/cells/engine/midi';
import { lowerNumeral } from '../src/score.ts';
import {
  PIN_VOICES,
  type StatedChord,
  type Tone,
  VOICE_OF_NOTE,
  barMeterName as meterName,
  chordTones,
  degreeText,
  euclidOf,
  indexOf,
  keyText,
  levelOf,
  numeralOfNotes,
  pinTone,
  rhythmText,
  statedChords,
  swingText,
} from '../src/section-text.ts';

/** The meter, the swing, the chords stated and the indices into the chord in force E33 found, which the section's builder holds (`../src/section-text.ts`). */
export {
  type ChordIndex,
  type StatedChord,
  barMeterName as meterName,
  indexOf,
  shareText,
  statedChords,
  swingText,
  throughChord,
} from '../src/section-text.ts';

/** The run every bar comes from, as E31's and E32's. */
export const SEED = 0;
export const ENTROPY = 0.3;
export const BARS = 32;

/** The meters other than 4/4, and the two presets they run on: straight, and every non-lead part between them. */
export const OTHER_METERS: readonly MeterName[] = ['3/4', '7/8'];
export const METER_PRESETS: readonly string[] = ['Synth-pop', 'Bossa nova'];

/** One run: a preset in a meter; a seed and a length other than E33's where another experiment asks (E35). */
export interface RunKey {
  readonly preset: string;
  readonly meter: MeterName;
  readonly seed?: number;
  readonly barCount?: number;
  /** The melodic scale the players wish for (none, the style's default, unless asked). */
  readonly melodic?: MelodicScale;
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

/** A note as composed or as cells plays it: its part, step, MIDI note, the length it sounds in steps, and velocity. */
export interface Note {
  readonly part: NotePart;
  readonly step: number;
  readonly note: number;
  readonly length: number;
  readonly velocity: number;
}

/** A note as composed: the length it sounds, and the length written. */
export interface Composed extends Note {
  readonly written: number;
}

/** The transport's clock starts here, in seconds. */
export const START = 1;
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

/** The band's transport over a preset held, in a meter, until its bars are laid (E33's 32 at seed 0, unless asked); every part's onsets, the lead's too. */
export function runOf({
  preset: name,
  meter,
  seed = SEED,
  barCount: count = BARS,
  melodic,
}: RunKey): Run {
  const preset = presetOf(name);
  const env: TransportEnv = {
    seed,
    start: START,
    track: holding({ ...preset.style, entropy: ENTROPY }),
    swing: holdingSwing(preset.swing),
    wish: { tonic: null, mode: preset.mode, melodic: melodic ?? null },
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
    if (bars.length > count && carried.head.step > clockOfTransport(carried).barStart(count)) break;
  }
  const clock = clockOfTransport(carried);
  return {
    preset: name,
    meter,
    bars: bars.slice(0, count),
    events: events.filter((e) => e.bar < count),
    barStarts: Array.from({ length: count }, (_, bar) => stepAt.get(clock.barStart(bar))!),
    missed,
  };
}

const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

/** A bar's composed notes, the lead left out: the step, pitch, articulated and written length, and the velocity the performer plays at feel 0. */
export function composedNotes(bar: BandBar): Composed[] {
  return sortNotes(
    bar.written.flatMap((w): Composed[] =>
      w.part === 'lead'
        ? []
        : [
            {
              part: w.part === 'pad' || w.part === 'stab' ? 'comp' : w.part,
              step: w.step,
              note: w.note,
              length: baseLengthOf(bar, w),
              written: w.length,
              velocity: clampVelocity(baseVelocityOf(bar, w) + (w.accent ?? 0)),
            },
          ],
    ),
  );
}

const sortNotes = <N extends Note>(notes: readonly N[]): N[] =>
  [...notes].sort((a, b) => a.part.localeCompare(b.part) || a.step - b.step || a.note - b.note);

/** A line of the text, and which part it states. */
export interface Line {
  readonly part: 'meter' | 'key' | ComparedPart | 'card';
  readonly text: string;
}

/** A line's share of its written length, as `legato=` states it: none where it is 1. */
export function legatoText(notes: readonly Composed[]): string {
  const shares = [...new Set(notes.map((n) => Number((n.length / n.written).toPrecision(12))))];
  if (shares.length !== 1)
    throw new Error(
      `a line sounds ${shares.length} shares of its written length: ${shares.join(' ')}`,
    );
  return shares[0] === 1 ? '' : ` legato=${String(shares[0]).replace(/^0/, '')}`;
}

/** What could not be stated as composed: a note held shorter than written, and why. */
export interface Cut {
  readonly part: NotePart;
  readonly step: number;
  readonly written: number;
  readonly stated: number;
  readonly why: 'next onset' | 'bar line';
}

/** The table a pitched line reads: the chord in force (`over=&harm`, cells v0.5.0), or the key's degrees (`over=&key`). */
export type PitchTable = 'harm' | 'key';

/** A pitched line of the text: the part it states, the table it reads, and the notes no index into the chord in force reaches. */
export interface PitchedLine {
  readonly part: 'bass' | 'pad' | 'stab';
  readonly table: PitchTable;
  /** Over the chord: how many notes take an accidental on their index (a degree of the key beside a chord tone). */
  readonly accidentals: number;
  /** Over the key, where the chord was asked for: the notes that kept it there. */
  readonly unreached: readonly { readonly step: number; readonly note: number }[];
}

/** A bar as one cells text: its lines, what the text had to cut, and the table each pitched line reads. */
export interface BarText {
  readonly lines: readonly Line[];
  readonly cuts: readonly Cut[];
  readonly pitched: readonly PitchedLine[];
}

export const textOf = (b: BarText) => b.lines.map((l) => l.text).join('\n');

/** The steps of a bar, each mapped. */
const eachStep = (steps: number, f: (step: number) => string) =>
  Array.from({ length: steps }, (_, step) => f(step)).join(' ');

/** A hit's own level after its voice, none at full velocity. */
const hitLevel = (velocity: number) => (velocity >= 127 ? '' : `:0:${levelOf(velocity)}`);

/**
 * The drums: a line a role on 16ths, the rim one Euclid token where `even`
 * wrote it (where `euclid` allows); and the mix's terms.
 */
function drumLines(
  bar: BandBar,
  notes: readonly Note[],
  euclid: boolean,
): { lines: string[]; terms: string[] } {
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
    const rim =
      euclid && role === 'euclid' && sounds.size === 1
        ? euclidOf(
            hits.map((h) => h.step),
            steps,
          )
        : null;
    if (rim) {
      const voice = VOICE_OF_NOTE.get(hits[0]!.note)!;
      lines.push(`&${role} step=1m &${voice}(${rim.k},${steps},${rim.r})`);
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

/** The stack each step of a bar reads as the chord in force: the last chord stated at or before it, none before the first. */
function chordsInForce(bar: BandBar): (step: number) => readonly Tone[] | null {
  const key = bar.plan.key;
  const stated = statedChords(bar).map((c) => ({
    step: c.step,
    tones: chordTones(key, lowerNumeral(key, parseNumeral(c.numeral)!)),
  }));
  return (step) => stated.findLast((c) => c.step <= step)?.tones ?? null;
}

/**
 * A pitched line on 16ths: each onset its notes as indices into the chord in
 * force from the part's voice (`over=&harm`), or, where `table` asks for the
 * key or a note has no index, as degrees of the key (`over=&key`); a chord a
 * stack, held for its written length, cut at the next onset or the bar line,
 * and sounding the line's share of it (`legato=`); and its levels, as a line
 * or one gain.
 */
function pitchedLine(
  bar: BandBar,
  name: 'bass' | 'pad' | 'stab',
  notes: readonly Composed[],
  voice: 'comp' | 'bass',
  cuts: Cut[],
  table: PitchTable,
): { lines: string[]; level: string; pitched: PitchedLine } {
  const steps = stepsOf(bar.meter);
  const key = bar.plan.key;
  const onsets = [...new Set(notes.map((n) => n.step))].sort((a, b) => a - b);
  const inForce = chordsInForce(bar);
  const words: string[] = [];
  const overChord: string[] = [];
  const unreached: { step: number; note: number }[] = [];
  let accidentals = 0;
  const levels: string[] = [];
  let at = 0;
  for (const [i, step] of onsets.entries()) {
    if (step > at) {
      words.push(held('~', step - at));
      overChord.push(held('~', step - at));
      levels.push(held('~', step - at));
    }
    const here = notes.filter((n) => n.step === step);
    const written = Math.max(...here.map((n) => n.written));
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
    const word = (tones: readonly string[]) =>
      held(tones.length === 1 ? tones[0]! : `[${tones.join(',')}]`, length);
    words.push(
      word(
        here.map((n) => {
          const t = pinTone(key, n.note, voice);
          return degreeText(t.degree, t.accidental);
        }),
      ),
    );
    const chord = inForce(step);
    overChord.push(
      word(
        here.map((n) => {
          const index = chord && indexOf(key, chord, n.note, voice);
          if (!index) {
            // (the line then reads the key, and this word is never written)
            unreached.push({ step, note: n.note });
            return '?';
          }
          if (index.alter !== 0) accidentals++;
          return degreeText(index.n, index.alter);
        }),
      ),
    );
    levels.push(held(levelOf(here[0]!.velocity), length));
    at = step + length;
  }
  if (at < steps) {
    words.push(held('~', steps - at));
    overChord.push(held('~', steps - at));
    levels.push(held('~', steps - at));
  }
  const velocities = new Set(notes.map((n) => n.velocity));
  const one = velocities.size === 1;
  const over: PitchTable = table === 'harm' && unreached.length === 0 ? 'harm' : 'key';
  return {
    lines: [
      `&${name} over=&${over} step=16n${legatoText(notes)} ${(over === 'harm' ? overChord : words).join(' ')}`,
      ...(one ? [] : [`&${name}Level map=amp step=16n ${levels.join(' ')}`]),
    ],
    level: one ? levelOf(notes[0]!.velocity) : `&${name}Level`,
    pitched: {
      part: name,
      table: over,
      accidentals: over === 'harm' ? accidentals : 0,
      unreached: table === 'harm' ? unreached : [],
    },
  };
}

/** How a bar is stated: the rim as one Euclid or a line, and the table the bass and the comp read. */
export interface Statement {
  readonly euclid?: boolean;
  readonly table?: PitchTable;
}

/**
 * A bar's drums, bass, comp and harmony as one cells text. The rim is one
 * Euclid token on `1m` only where the meter is straight, unless `euclid`
 * asks for it anyway: a Euclid's hits are even parts of its step, which the
 * meter's swing doesn't reach (E33's gap 4, yggi/cells#121), so under swing the rim is a line
 * on `16n` as every other role is. The bass and the comp read the chord in
 * force (`over=&harm`), unless `table` asks for the key, as E33 stated them
 * before cells v0.5.0.
 */
export function barAsCells(
  bar: BandBar,
  { euclid = bar.swing.share === STRAIGHT.share, table = 'harm' }: Statement = {},
): BarText {
  const key = bar.plan.key;
  const notes = composedNotes(bar);
  const cuts: Cut[] = [];
  const pitched: PitchedLine[] = [];
  const lines: Line[] = [
    {
      part: 'meter',
      text: `&bar meter("${meterName(bar)}") step=${bar.style.bpm}bpm${swingText(bar.meter, bar.swing)}`,
    },
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
    euclid,
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
      table,
    );
    pitched.push(line.pitched);
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
    const line = pitchedLine(bar, part, own, 'comp', cuts, table);
    pitched.push(line.pitched);
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
  return { lines, cuts, pitched };
}

/** What a bar's text plays through cells: its notes by part, its chords read back, its bar's length, and what cells said. */
export interface Played {
  readonly notes: Note[];
  readonly chords: StatedChord[];
  /** How long cells holds the bar, in seconds: where its `1m` tap comes round. */
  readonly barSeconds: number;
  /** Each note's onset in seconds from the bar's start, in the order of `notes`. */
  readonly at: number[];
  /** How long each note sounds, in seconds, in the order of `notes`. */
  readonly seconds: number[];
  readonly diagnostics: string[];
}

/**
 * The reading's own lines, not counted: the bar's lap and the harmony, each on a channel of its own (15 and 16).
 * The harmony heard is `&harm` itself: a played table turns for the lines read through it (cells v0.6.0, yggi/cells#167).
 */
const READING = [
  '&lap step=1m 0',
  '&readV loop=C4',
  '&read map=midi ~!14 [&lap * &readV] [&harm * &readV]',
].join('\n');

/**
 * A text played through cells' MIDI out for its first bar, read back; `estimate` is about how long its bar is.
 * Each time is read as a step through the band's swing undone, its bar's (`leanMap`'s `written`).
 */
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
  const unswung = leanMap(leansOf(bar.swing), bar.meter);
  const stepOf = (seconds: number) => unswung.written(seconds / step);
  const inBar = out.filter((n) => n.at < barSeconds - 1e-9);
  const timed = inBar.flatMap((n) => {
    const part = (Object.keys(CHANNEL_OF) as NotePart[]).find((p) => CHANNEL_OF[p] === n.channel);
    if (!part) return [];
    const at = stepOf(n.at);
    return [
      {
        seconds: n.at,
        sounds: n.end - n.at,
        note: { part, step: at, note: n.note, length: stepOf(n.end) - at, velocity: n.velocity },
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
    seconds: timed.map((t) => t.sounds),
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

/** How far a note's sounding length in cells is from the band's: in steps (through the band's swing undone) and in seconds. */
export interface Length {
  readonly part: NotePart;
  readonly steps: number;
  readonly seconds: number;
}

/** One bar measured: its text, what cells played, and per part whether it is the band's. */
export interface Measured {
  readonly run: RunKey;
  readonly bar: BandBar;
  readonly text: BarText;
  readonly played: Played;
  readonly equal: Readonly<Record<ComparedPart, boolean>>;
  readonly mismatches: Readonly<Record<NotePart, string[]>>;
  /** Each onset's distance from the transport's, in seconds. */
  readonly offsets: readonly number[];
  /** Each bass, pad and stab note's sounding length against the band's articulated one, in the order of `composedNotes`. */
  readonly lengths: readonly Length[];
}

/** Whether a run's meter swings: its preset's, held. */
export const swung = (run: RunKey) => presetOf(run.preset).swing.share !== STRAIGHT.share;

/** Every bar of a run, stated, played (its text edited first, if asked) and compared; its onsets timed against the transport's. */
export function measureRun(
  run: Run,
  edit: (text: string) => string = (t) => t,
  state: (bar: BandBar) => BarText = (bar) => barAsCells(bar),
): Measured[] {
  let cellsStart = 0;
  return run.bars.map((bar) => {
    const text = state(bar);
    const played = cellsPlays(edit(textOf(text)), bar);
    const band = composedNotes(bar);
    const of = (notes: readonly Note[], part: NotePart) => notes.filter((n) => n.part === part);
    const found = {
      drums: mismatches(of(band, 'drums'), of(played.notes, 'drums')),
      bass: mismatches(of(band, 'bass'), of(played.notes, 'bass')),
      comp: mismatches(of(band, 'comp'), of(played.notes, 'comp')),
    };
    const offsets: number[] = [];
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
    // The band sounds a note from its step's time to its articulated end's, both through its swing.
    const swing = leanMap(leansOf(bar.swing), bar.meter);
    const stepSecs = played.barSeconds / stepsOf(bar.meter);
    const lengths: Length[] = [];
    const sortedPlayed = played.notes
      .map((n, j) => ({ n, seconds: played.seconds[j]! }))
      .filter(({ n }) => n.part !== 'drums');
    const sortedBand = band.filter((n) => n.part !== 'drums');
    if (sortedPlayed.length === sortedBand.length)
      for (const [j, b] of sortedBand.entries()) {
        const c = sortedPlayed[j]!;
        const seconds = (swing.played(b.step + b.length) - swing.played(b.step)) * stepSecs;
        lengths.push({ part: b.part, steps: c.n.length - b.length, seconds: c.seconds - seconds });
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
      lengths,
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

/** Characters by part over some bars' texts, each line with its newline. */
export function characters(
  measured: readonly { readonly text: BarText }[],
): Record<Line['part'] | 'total', number> {
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
