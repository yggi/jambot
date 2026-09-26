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
 * turns bar and step into clock time, adding swing. Their parts are the
 * MIDI channels a band plays on. The chords part plays either as a pad,
 * held through the chord, or as a stab, short and rhythmic.
 */

export const PARTS = ['drums', 'bass', 'chords', 'lead'] as const;
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
  /** For the chords part only: held through the chord, or short and rhythmic. */
  readonly comp?: 'pad' | 'stab';
  /** For the drums only: what the hit does in the groove. */
  readonly role?: DrumRole;
  /** The step of the bar it starts on, 0–15. */
  readonly step: number;
  /** The MIDI note, 0–127, C4 = 60. */
  readonly note: number;
  /** How long it is written, in whole steps; it may run past the bar. */
  readonly length: number;
}

export interface NoteEvent {
  readonly part: Part;
  /** For the chords part only: held through the chord, or short and rhythmic. */
  readonly comp?: 'pad' | 'stab';
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
  const { part, comp, step, note, velocity, length } = event;
  if (!isIntegerIn(step, 0, 15)) problems.push(`step ${step} is not a step 0–15`);
  if (!isIntegerIn(note, 0, 127)) problems.push(`note ${note} is not a MIDI note 0–127`);
  if (!isIntegerIn(velocity, 1, 127)) problems.push(`velocity ${velocity} is not a velocity 1–127`);
  if (!(length > 0 && Number.isFinite(length)))
    problems.push(`length ${length} is not a positive, finite length`);
  if (part === 'chords' && comp === undefined) problems.push('a chords event is a pad or a stab');
  if (part !== 'chords' && comp !== undefined)
    problems.push(`a ${part} event is not a pad or a stab`);
  return problems;
}

/** What is wrong with a written note, if anything, one line per problem. */
export function writtenProblems(written: WrittenNote): string[] {
  const problems: string[] = [];
  const { part, comp, role, step, note, length } = written;
  if (!isIntegerIn(step, 0, 15)) problems.push(`step ${step} is not a step 0–15`);
  if (!isIntegerIn(note, 0, 127)) problems.push(`note ${note} is not a MIDI note 0–127`);
  if (!(Number.isInteger(length) && length > 0))
    problems.push(`length ${length} is not a whole number of steps`);
  if ('velocity' in written) problems.push('a written note has no velocity');
  if (part === 'drums' && role === undefined) problems.push('a drum hit has a role');
  if (part === 'drums' && role !== undefined && !DRUM_ROLES.includes(role))
    problems.push(`role ${role} is not a drum role`);
  if (part !== 'drums' && role !== undefined) problems.push(`a ${part} note has no role`);
  if (part === 'chords' && comp === undefined) problems.push('a chords note is a pad or a stab');
  if (part !== 'chords' && comp !== undefined)
    problems.push(`a ${part} note is not a pad or a stab`);
  return problems;
}
