/**
 * Note events: what the engine writes, one bar at a time.
 *
 * An event is bar-relative: it names a step of the bar, and the transport
 * turns bar and step into clock time, adding swing. Its parts are the MIDI
 * channels a band plays on. The chords part plays either as a pad, held
 * through the chord, or as a stab, short and rhythmic.
 */

export const PARTS = ['drums', 'bass', 'chords', 'lead'] as const;
export type Part = (typeof PARTS)[number];

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
