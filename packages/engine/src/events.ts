/**
 * Notes as the engine writes them, and as a performer plays them, one bar
 * at a time.
 *
 * A written note is what the score states: a step of the bar, a note and a
 * length in whole steps, and for a drum hit its role in the groove. How it
 * is played, its velocity, the length it sounds and its instrument's
 * colour, is the performer's (`performer.ts`), read from the bar (T4). A
 * dough note is a written note played: a performer's own dough-shaped
 * event (#107, #129), flat, carrying only the keys its part uses.
 *
 * Both are bar-relative: they name a step of the bar, and the transport
 * turns bar and step into clock time, adding swing. A part is one voice:
 * one MIDI channel, and one line of the score (L6). The comp plays two,
 * the pad, held through each chord, and the stab, short and rhythmic, so a
 * stab never cuts a pad that holds its note.
 */

import {
  type Helix,
  METERS,
  type Meter,
  degreeBelow,
  heightOf,
  meterOnSteps,
  mod,
} from '@jambot/theory';

export const PARTS = ['drums', 'bass', 'pad', 'stab', 'lead'] as const;
export type Part = (typeof PARTS)[number];

/**
 * What a drum hit does in the groove, which sets its accent. Where two land
 * on one sound and step, the one listed first stays: of these, only the
 * snare's backbeat, fill and ghost ever meet.
 */
export const DRUM_ROLES = ['kick', 'backbeat', 'fill', 'ghost', 'hat', 'pedal', 'euclid'] as const;
export type DrumRole = (typeof DRUM_ROLES)[number];

export interface WrittenNote {
  readonly part: Part;
  /** For the drums only: what the hit does in the groove. */
  readonly role?: DrumRole;
  /** The step of the bar it starts on, 0–15. */
  readonly step: number;
  /** The MIDI note, 0–127, C4 = 60. */
  readonly note: number;
  /** How long it is written, in whole steps; it may run past the bar. */
  readonly length: number;
  /**
   * A deviation from the level a performer would otherwise play, in either
   * direction: an offset on top of its own reading of the bar, not a
   * replacement for it (#107). A lead note from a motif writes one always,
   * counted from the lead's level (U4); any other part may write one too,
   * where something beyond the bar's own energy and beat needs to be said.
   */
  readonly accent?: number;
}

/** The song's meter: 4/4, in every bar. */
export const SONG_METER: Meter = METERS['4/4'];

/**
 * The song's clock: its meter on the bar's steps, two to an eighth, whose
 * degrees are the beats. A bar is one turn of it, a step's place in the bar
 * a position on it, and a beat a degree, so every reading of bar and beat
 * below is the helix's own (T10), and a meter other than 4/4 changes them
 * all at once.
 */
export const BEATS: Helix = meterOnSteps(SONG_METER);

/**
 * How many steps a bar has: one turn of the song's clock, sixteen 16ths in
 * 4/4. Every bar the band plays has this many, so a step from the song's
 * start is `barStart` of its bar plus its step in the bar.
 */
export const BAR_STEPS = BEATS.cycle;

/** From this bar on, the song is in this meter. */
export interface MeterChange {
  readonly bar: number;
  readonly meter: Meter;
}

/** The readings of a song's clock: where bars and beats fall on its steps. */
export interface SongClock {
  /** The bar a position is in, counted from the song's start. */
  readonly barAt: (position: number) => number;
  /** The step a bar starts on, counted from the song's start. */
  readonly barStart: (bar: number) => number;
  /** How many steps a bar has: one turn of its meter's helix. */
  readonly barSteps: (bar: number) => number;
  /** A position's place in its bar, from 0 up to its bar's steps. */
  readonly stepInBar: (position: number) => number;
  /** The beat a position is in, counted from the song's start. */
  readonly beatAt: (position: number) => number;
  /** The step a beat starts on, counted from the song's start. */
  readonly beatStart: (beat: number) => number;
  /** A position's beat in its bar, from 0. */
  readonly beatInBar: (position: number) => number;
  /** Whether a beat starts at a position. */
  readonly onBeat: (position: number) => boolean;
}

/**
 * The clock of a song whose meter changes: each stretch of one meter is
 * that meter's helix on the steps, two to an eighth, and each stretch
 * starts where the one before ends, at the running sum of its bars'
 * lengths (T14). A key change keeps the cycle and a meter change need not,
 * so the song is one helix only between changes. The first meter reaches
 * back before its bar, and every meter's pulses start on its downbeat.
 */
export function clockOf(changes: readonly MeterChange[]): SongClock {
  if (changes.length === 0) throw new Error('clockOf: a song needs a meter');
  interface Stretch {
    readonly bar: number;
    readonly step: number;
    readonly beat: number;
    readonly helix: Helix;
    readonly beats: number;
  }
  const stretches: Stretch[] = [];
  for (const { bar, meter } of [...changes].sort((x, y) => x.bar - y.bar)) {
    if (meter.heights[0] !== 0) throw new Error('clockOf: a meter starts on its downbeat');
    const helix = meterOnSteps(meter);
    const before = stretches.at(-1);
    const passed = before ? bar - before.bar : bar;
    stretches.push({
      bar,
      step: before ? before.step + passed * before.helix.cycle : passed * helix.cycle,
      beat: before ? before.beat + passed * before.beats : passed * helix.heights.length,
      helix,
      beats: helix.heights.length,
    });
  }
  const last = (from: (s: Stretch) => number, at: number) =>
    stretches.findLast((s) => from(s) <= at) ?? stretches[0]!;
  const barStart = (bar: number) => {
    const s = last((x) => x.bar, bar);
    return s.step + (bar - s.bar) * s.helix.cycle;
  };
  const barAt = (position: number) => {
    const s = last((x) => x.step, position);
    return s.bar + Math.floor(degreeBelow(s.helix, position - s.step) / s.beats);
  };
  const beatAt = (position: number) => {
    const s = last((x) => x.step, position);
    return s.beat + degreeBelow(s.helix, position - s.step);
  };
  const beatStart = (beat: number) => {
    const s = last((x) => x.beat, beat);
    return s.step + heightOf(s.helix, beat - s.beat);
  };
  return {
    barAt,
    barStart,
    barSteps: (bar) => last((x) => x.bar, bar).helix.cycle,
    stepInBar: (position) => position - barStart(barAt(position)),
    beatAt,
    beatStart,
    beatInBar: (position) => {
      const s = last((x) => x.step, position);
      return mod(degreeBelow(s.helix, position - s.step), s.beats);
    },
    onBeat: (position) => beatStart(beatAt(position)) === position,
  };
}

/** The song's clock: its one meter, from its start (T10). */
export const SONG_CLOCK: SongClock = clockOf([{ bar: 0, meter: SONG_METER }]);

export const { barAt, barStart, stepInBar, beatAt, beatStart, beatInBar, onBeat } = SONG_CLOCK;

/**
 * A pitched voice's colour, as the style shapes it (C1, C2): only the
 * fields its part uses, the way `WrittenNote` carries `role` and `accent`.
 */
export interface Timbre {
  /** In seconds, for the lead and the chords. */
  readonly attack?: number;
  /** In seconds, for the chords. */
  readonly release?: number;
  /** The lowpass filter's cutoff: hertz for the lead, a factor for the bass. */
  readonly cutoff?: number;
  /** The filter's Q, for the bass. */
  readonly resonance?: number;
  /** The mix of each waveform, where a voice blends more than one. */
  readonly triangle?: number;
  readonly square?: number;
  readonly saw?: number;
}

/**
 * A written note as a performer plays it: dough's keys, flat (#129). What
 * a `WrittenNote` states passes through unchanged (`part`, `step`, `note`,
 * `role`, `accent`); `length`, `velocity`, `gain` and the timbre are the
 * performer's own, read from the bar (T4, L7).
 */
export interface DoughNote extends Timbre {
  readonly part: Part;
  /** For the drums only: what the hit does in the groove, as written. */
  readonly role?: DrumRole;
  /** The step of the bar it starts on, 0–15. */
  readonly step: number;
  /** The MIDI note, 0–127, C4 = 60. */
  readonly note: number;
  /** How long it sounds, in steps; it may run past the bar. */
  readonly length: number;
  /** The written accent (#107), as written, passed through unchanged. */
  readonly accent?: number;
  /** The MIDI velocity, 1–127. */
  readonly velocity: number;
  /** The synth's loudness, 0–1. */
  readonly gain: number;
}

const isIntegerIn = (x: number, lo: number, hi: number) =>
  Number.isInteger(x) && x >= lo && x <= hi;

/** What is wrong with a dough note, if anything, one line per problem. */
export function doughProblems(note: DoughNote): string[] {
  const problems: string[] = [];
  const { part, role, step, note: pitch, length, accent, velocity, gain } = note;
  if (!isIntegerIn(step, 0, 15)) problems.push(`step ${step} is not a step 0–15`);
  if (!isIntegerIn(pitch, 0, 127)) problems.push(`note ${pitch} is not a MIDI note 0–127`);
  if (!(length > 0 && Number.isFinite(length)))
    problems.push(`length ${length} is not a positive, finite length`);
  if (!isIntegerIn(velocity, 1, 127)) problems.push(`velocity ${velocity} is not a velocity 1–127`);
  if (!(gain >= 0 && gain <= 1)) problems.push(`gain ${gain} is not a gain 0–1`);
  if (part === 'drums' && role === undefined) problems.push('a drum hit has a role');
  if (part === 'drums' && role !== undefined && !DRUM_ROLES.includes(role))
    problems.push(`role ${role} is not a drum role`);
  if (part !== 'drums' && role !== undefined) problems.push(`a ${part} note has no role`);
  if (accent !== undefined && !Number.isInteger(accent))
    problems.push(`accent ${accent} is not a whole number`);
  return problems;
}

/** What is wrong with a written note, if anything, one line per problem. */
export function writtenProblems(written: WrittenNote): string[] {
  const problems: string[] = [];
  const { part, role, step, note, length, accent } = written;
  if (!isIntegerIn(step, 0, 15)) problems.push(`step ${step} is not a step 0–15`);
  if (!isIntegerIn(note, 0, 127)) problems.push(`note ${note} is not a MIDI note 0–127`);
  if (!(Number.isInteger(length) && length > 0))
    problems.push(`length ${length} is not a whole number of steps`);
  if ('velocity' in written) problems.push('a written note has no velocity');
  if (part === 'drums' && role === undefined) problems.push('a drum hit has a role');
  if (part === 'drums' && role !== undefined && !DRUM_ROLES.includes(role))
    problems.push(`role ${role} is not a drum role`);
  if (part !== 'drums' && role !== undefined) problems.push(`a ${part} note has no role`);
  if (accent !== undefined && !Number.isInteger(accent))
    problems.push(`accent ${accent} is not a whole number`);
  return problems;
}
