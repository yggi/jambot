/**
 * Notes as the engine writes them, and as they are played, one bar at a
 * time.
 *
 * A written note is what the score states: a step of the bar, a note and a
 * length in whole steps, and for a drum hit its role in the groove. How it
 * is played, its velocity and the length it sounds, is the performance's
 * (`perform.ts`), read from the bar (T4). A note event is a written note
 * played.
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
   * For a lead note from a motif only: its accent, how much louder or
   * softer than the lead's level it plays, as the motif writes it (U4).
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

export interface NoteEvent {
  readonly part: Part;
  /** The step of the bar it starts on, 0–15. */
  readonly step: number;
  /** The MIDI note, 0–127, C4 = 60. */
  readonly note: number;
  /** The MIDI velocity, 1–127. */
  readonly velocity: number;
  /** How long it sounds, in steps; it may run past the bar. */
  readonly length: number;
}

const isIntegerIn = (x: number, lo: number, hi: number) =>
  Number.isInteger(x) && x >= lo && x <= hi;

/** What is wrong with an event, if anything, one line per problem. */
export function eventProblems(event: NoteEvent): string[] {
  const problems: string[] = [];
  const { step, note, velocity, length } = event;
  if (!isIntegerIn(step, 0, 15)) problems.push(`step ${step} is not a step 0–15`);
  if (!isIntegerIn(note, 0, 127)) problems.push(`note ${note} is not a MIDI note 0–127`);
  if (!isIntegerIn(velocity, 1, 127)) problems.push(`velocity ${velocity} is not a velocity 1–127`);
  if (!(length > 0 && Number.isFinite(length)))
    problems.push(`length ${length} is not a positive, finite length`);
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
  if (part !== 'lead' && accent !== undefined) problems.push(`a ${part} note has no accent`);
  return problems;
}
