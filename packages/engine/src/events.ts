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

/**
 * How many steps a bar has: sixteen 16ths, a bar of 4/4. Every bar the band
 * plays has this many, so a step from the song's start is the bar's times
 * this plus the step in the bar.
 */
export const BAR_STEPS = 16;

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
