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
 * - the licence: every part's velocity, and every part's length, loosens as
 *   the style's feel rises (`licenceOf`, T17) and holds exactly still when
 *   it is 0 — a seeded draw per part, the same shape drums always had
 *   (#147), added last, since it alone is the performer's own hand. Width, not direction: velocity can
 *   land louder or softer; length only ever gates a little shorter, never
 *   longer than the base already set.
 *
 * The instrument's colour is the style's own, shaped continuously
 * (`sound.ts`, C1, C2). Swing and tempo, the performance of time, are the
 * transport's time maps (`swing.ts`, `tempo.ts`). These are the
 * prototype's accents and gates.
 *
 * A drum hit's role and a lead note's written accent pass through onto the
 * dough note unchanged, for whatever reads a performer's notes (L7);
 * whether they are notation or the performer's own is #116's open question
 * (m), not this file's to decide.
 */

import type { BarEnv } from './bar.ts';
import type { DoughNote, WrittenNote } from './events.ts';
import { baseLengthOf, baseVelocityOf } from './dynamics.ts';
import { licenceOf } from './licence.ts';
import { draw, type Stream } from './random.ts';
import { timbreOf } from './sound.ts';

const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));

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

/**
 * The lead's level, which a motif's accents are counted from when it plays:
 * the midpoint of its accents on and off the beat, 100 and 82. Ahead of the
 * evidence (#79).
 */
export const LEAD_LEVEL = 91;

/** How loud a written note plays, at the style's feel. */
function velocityOf(env: BarEnv, written: WrittenNote, feel: number): number {
  const { seed, bar } = env;
  const { step, note, accent } = written;
  const loose = (stream: Stream) => velocityLooseness(seed, stream, feel, bar, step);
  switch (written.part) {
    case 'drums':
      return clampVelocity(
        baseVelocityOf(env, written) +
          (accent ?? 0) +
          velocityLooseness(seed, 'drumVelocity', feel, bar, step, note),
      );
    case 'bass':
      return clampVelocity(baseVelocityOf(env, written) + (accent ?? 0) + loose('bassVelocity'));
    case 'stab':
      return clampVelocity(baseVelocityOf(env, written) + (accent ?? 0) + loose('stabVelocity'));
    case 'pad':
      return clampVelocity(baseVelocityOf(env, written) + (accent ?? 0) + loose('padVelocity'));
    case 'lead': {
      // A motif's accent is counted from the lead's own level (U4), not the
      // beat: its dynamics are the motif's own, not an offset on the base.
      // Every other part adds its accent to the base; the lead's replaces
      // it, exactly as U4 already decided.
      const base = accent !== undefined ? LEAD_LEVEL + accent : baseVelocityOf(env, written);
      return clampVelocity(base + loose('leadVelocity'));
    }
  }
}

/** How long a written note sounds, in steps, at the style's feel. */
function lengthOf(env: BarEnv, written: WrittenNote, feel: number): number {
  const { seed, bar } = env;
  const { step, note } = written;
  const gate = (gated: number, stream: Stream) =>
    gated * lengthLooseness(seed, stream, feel, bar, step);
  switch (written.part) {
    case 'drums':
      return (
        baseLengthOf(env, written) * lengthLooseness(seed, 'drumLength', feel, bar, step, note)
      );
    case 'bass':
      return gate(baseLengthOf(env, written), 'bassLength');
    case 'pad':
      return gate(baseLengthOf(env, written), 'padLength');
    case 'stab':
      return gate(baseLengthOf(env, written), 'stabLength');
    case 'lead':
      return gate(baseLengthOf(env, written), 'leadLength');
  }
}

/** A written note as a performer plays it. */
export function perform(env: BarEnv, written: WrittenNote): DoughNote {
  const { part, step, note } = written;
  const { feel } = licenceOf(env.style);
  const velocity = velocityOf(env, written, feel);
  return {
    part,
    step,
    note,
    length: lengthOf(env, written, feel),
    velocity,
    gain: velocity / 127,
    ...timbreOf(part, env.style, env.barEnergy),
    ...(written.role !== undefined && { role: written.role }),
    ...(written.accent !== undefined && { accent: written.accent }),
  };
}
