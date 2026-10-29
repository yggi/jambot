/**
 * The performer: how a written note is played (T4), as a dough-shaped
 * event (#107, #129).
 *
 * What a part writes is the score: a step, a note, a length in whole steps
 * and, for a drum hit, its role. How loud it plays and how long it sounds
 * are read from the bar, so the score states neither. Both build on a
 * chain of three layers, the performer's own only the last of them
 * (T18, T19):
 *
 * - the base (`dynamics.ts`): each part's own reading of its role, step,
 *   beat, energy or articulation — the ensemble's default, not the
 *   performer's, wherever it is computed;
 * - a written accent, where one is given: an offset on top of the base,
 *   never a replacement — except a lead note from a motif, whose accent
 *   replaces the beat's own, counted from the lead's level instead (U4);
 *   the level so composed is clamped to MIDI's 1 to 127 before the licence
 *   (#433), so a text states the level the feel plays on;
 * - the licence: every part's velocity, and every part's length, loosens as
 *   the feel rises (`feelOf`, T17) and holds exactly still when
 *   it is 0 — a seeded draw per part, the same shape drums always had
 *   (#147), added last, since it alone is the performer's own hand. Width, not direction: velocity can
 *   land louder or softer; length only ever gates a little shorter, never
 *   longer than the base already set;
 * - the performer's own accent (#170), which rides with the licence: a
 *   seeded velocity delta, ghost notes on off-beat 16ths and a push on the
 *   off-beat 8th, as wide as the feel and exactly 0 at feel 0.
 *
 * The instrument's colour is the style's own, shaped continuously
 * (`sound.ts`, C1, C2). Swing and tempo, the performance of time, are the
 * transport's time maps (`swing.ts`, `tempo.ts`). These are the
 * prototype's accents and gates.
 *
 * A note as a cells text states it is played by the same hand
 * (`performStated`, #405): on top of the level and length the text states.
 * That hand is the family's feel contract (yggi/music-commons
 * `contracts/feel`, version 1), whose rule a frontend implements to play a
 * session as its host does; `contracts.test.ts` runs its vectors (#474).
 *
 * A drum hit's role and a lead note's written accent pass through onto the
 * dough note unchanged, for whatever reads a performer's notes (L7);
 * whether they are notation or the performer's own is #116's open question
 * (m), not this file's to decide.
 */

import type { BarEnv } from './bar.ts';
import {
  type DoughNote,
  type DrumRole,
  PARTS,
  type Part,
  type VoiceSound,
  type WrittenNote,
} from './events.ts';
import { baseLengthOf, baseVelocityOf } from './dynamics.ts';
import { feelOf } from './licence.ts';
import { draw, type Stream } from './random.ts';
import { timbreOf } from './sound.ts';

const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

/**
 * A level within MIDI's 1 to 127 as MIDI rounds it (#433): one whose
 * velocity lies past them is clamped by whole velocities, so the fraction
 * a part's base gives it, which MIDI's rounding takes, is kept; one within
 * them is as it is.
 */
function withinMidi(level: number): number {
  const velocity = Math.round(level);
  return velocity >= 1 && velocity <= 127 ? level : level - velocity + clampVelocity(velocity);
}

/**
 * A part's velocity licence: how far a written note's velocity may drift,
 * up or down, as the feel rises. 0 at feel 0, every part (#107, #147, T17).
 * Never keyed by the note's pitch for a pitched part: only its register may
 * differ between a whole and a resumed band (S2), and the licence must not
 * tell those apart. A drum hit's sound is its identity, not a register, so
 * it keeps its own note in its key, as it always has.
 */
function velocityLooseness(
  seed: number,
  stream: Stream,
  feel: number,
  ...keys: readonly number[]
): number {
  return (draw(seed, stream, ...keys) - 0.5) * feel * 24;
}

/**
 * A part's length licence: how much a written note's gated length may gate
 * a little shorter still, as the feel rises. Never longer than what
 * articulation already set, and exactly 1 (no change) at feel 0. Keyed the
 * same way as `velocityLooseness`, for the same reason.
 */
function lengthLooseness(
  seed: number,
  stream: Stream,
  feel: number,
  ...keys: readonly number[]
): number {
  return 1 - draw(seed, stream, ...keys) * feel * 0.15;
}

/** How far a ghost note on an off-beat 16th may fall, at feel 1. */
const GHOST_DEPTH = 14;
/** How far a push on the off-beat 8th may rise, at feel 1. */
const PUSH_HEIGHT = 10;
/** How far a note on the beat may lean either way, at feel 1. */
const BEAT_LEAN = 4;

/**
 * The performer's own accent on a note (#170): a velocity delta drawn from
 * its bar and step, in the direction a player leans by feel: a ghost note
 * softer on an off-beat 16th, a push louder on the off-beat 8th, a slight
 * lean either way on the beat. Its width is the feel's, so it is exactly 0
 * at feel 0. Keyed like the licence (a drum adds its note, a pitched part
 * never does, S2, S3), and added on top of the base and any written accent
 * (T18), so a written accent is never lost. The base's own beat reading
 * (`roleAccent`, `dynamics.ts`) stays the base's.
 */
function ownAccent(
  seed: number,
  part: WrittenNote['part'],
  feel: number,
  bar: number,
  step: number,
  ...rest: readonly number[]
): number {
  const d = draw(seed, 'ownAccent', PARTS.indexOf(part), bar, step, ...rest);
  if (step % 2 === 1) return -d * GHOST_DEPTH * feel;
  if (step % 4 === 2) return d * PUSH_HEIGHT * feel;
  return (d - 0.5) * 2 * BEAT_LEAN * feel;
}

/**
 * The lead's level, which a motif's accents are counted from when it plays:
 * the midpoint of its accents on and off the beat, 100 and 82. Ahead of the
 * evidence (#79).
 */
export const LEAD_LEVEL = 91;

/** Each pitched part's own streams, for its licence on velocity and on length. */
const VELOCITY_STREAM = {
  bass: 'bassVelocity',
  stab: 'stabVelocity',
  pad: 'padVelocity',
  lead: 'leadVelocity',
} as const satisfies Record<Exclude<Part, 'drums'>, Stream>;
const LENGTH_STREAM = {
  bass: 'bassLength',
  stab: 'stabLength',
  pad: 'padLength',
  lead: 'leadLength',
} as const satisfies Record<Exclude<Part, 'drums'>, Stream>;

/**
 * The level a written note is composed at, before the performer's own hand,
 * unrounded: its part's base with its written accent on top, or, for a lead
 * note with an accent, the accent on the lead's level, which replaces the
 * beat's own (U4); within MIDI's 1 to 127 as MIDI rounds it (`withinMidi`,
 * #433), so a motif's note accented past them plays at the level a text
 * states, and breathes with the feel as every other note does. At feel 0 a
 * note plays at this level, rounded: what a cells text states
 * (`writtenNotes`, #399).
 */
export function composedLevel(env: BarEnv, written: WrittenNote): number {
  const { accent } = written;
  if (written.part === 'lead')
    return withinMidi(accent !== undefined ? LEAD_LEVEL + accent : baseVelocityOf(env, written));
  return withinMidi(baseVelocityOf(env, written) + (accent ?? 0));
}

/**
 * How loud a note plays from its composed level, at the style's feel: the
 * licence and the performer's own accent added, the drums keyed by their
 * note too, then rounded and clamped. The sums keep the order they always
 * had, the drums' one term at a time and a pitched part's two together,
 * since a last bit's difference would round a half the other way.
 */
function velocityOn(
  env: BarEnv,
  { part, step, note }: Pick<WrittenNote, 'part' | 'step' | 'note'>,
  level: number,
  feel: number,
): number {
  const { seed, bar } = env;
  if (part === 'drums')
    return clampVelocity(
      level +
        velocityLooseness(seed, 'drumVelocity', feel, bar, step, note) +
        ownAccent(seed, 'drums', feel, bar, step, note),
    );
  return clampVelocity(
    level +
      (velocityLooseness(seed, VELOCITY_STREAM[part], feel, bar, step) +
        ownAccent(seed, part, feel, bar, step)),
  );
}

/** The share of its gated length a note sounds, at the style's feel: the length licence, the drums keyed by their note too. */
function gateOf(
  env: BarEnv,
  { part, step, note }: Pick<WrittenNote, 'part' | 'step' | 'note'>,
  feel: number,
): number {
  const { seed, bar } = env;
  return part === 'drums'
    ? lengthLooseness(seed, 'drumLength', feel, bar, step, note)
    : lengthLooseness(seed, LENGTH_STREAM[part], feel, bar, step);
}

/** A played note: its velocity and length, and the rest a dough note carries. */
function played(
  env: BarEnv,
  { part, step, note, role }: Pick<WrittenNote, 'part' | 'step' | 'note' | 'role'>,
  velocity: number,
  length: number,
): DoughNote {
  return {
    part,
    step,
    note,
    length,
    velocity,
    gain: velocity / 127,
    ...timbreOf(part, env.style, env.swing, env.barEnergy),
    ...(role !== undefined && { role }),
  };
}

/** A written note as a performer plays it. */
export function perform(env: BarEnv, written: WrittenNote): DoughNote {
  const feel = feelOf(env.style, env.swing);
  return {
    ...played(
      env,
      written,
      velocityOn(env, written, composedLevel(env, written), feel),
      baseLengthOf(env, written) * gateOf(env, written, feel),
    ),
    ...(written.accent !== undefined && { accent: written.accent }),
  };
}

/**
 * A note as a cells text states it and cells plays it (#399): its line, step
 * and pitch, a drum hit's role, its velocity at feel 0 as MIDI states it
 * (its composed level rounded and clamped), and its sounding length at feel
 * 0, in steps.
 */
export interface StatedNote {
  readonly part: Part;
  readonly step: number;
  readonly note: number;
  readonly role?: DrumRole;
  readonly velocity: number;
  readonly length: number;
  /** Its voice's own sound, where the text gives it one (`VoiceSound`): it rides on the note in place of the style's colour. */
  readonly sound?: VoiceSound;
}

/**
 * A stated note as the performer plays it (#405; cells decision 037: the
 * text holds what is composed, the playing is the player's): the
 * performer's own hand on top of what cells plays, from the same feel and
 * draws as `perform`. Its velocity is the licence and the own accent on the
 * level stated, with the fraction MIDI's rounding took from it given back
 * from the bar's base (the lead's base and a motif's level are whole, so
 * only a part's base has one), and its length is the length licence on the
 * length cells sounds, so it plays as `perform` plays the note written,
 * since the composed level lies within MIDI's 1 to 127 (`composedLevel`).
 * A written accent is in the level stated, and not carried apart.
 */
export function performStated(env: BarEnv, stated: StatedNote): DoughNote {
  const feel = feelOf(env.style, env.swing);
  const base = baseVelocityOf(env, { ...stated, length: 1 });
  const level = stated.velocity + (base - Math.round(base));
  const note = played(
    env,
    stated,
    velocityOn(env, stated, level, feel),
    stated.length * gateOf(env, stated, feel),
  );
  return stated.sound ? { ...note, sound: stated.sound } : note;
}
