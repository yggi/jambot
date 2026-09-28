/**
 * The performer: how a written note is played (T4), as a dough-shaped
 * event (#107, #129).
 *
 * What a part writes is the score: a step, a note, a length in whole steps
 * and, for a drum hit, its role. How loud it plays and how long it sounds
 * are read from the bar, so the score states neither:
 *
 * - dynamics: each part's own reading of its role, step or beat, scaled by
 *   the bar's energy, plus a written accent where one is given — an offset
 *   on top, never a replacement (#107). A lead note from a motif always
 *   writes one, counted from the lead's level instead of the beat (U4); the
 *   comp reads the energy, a pad the softer the more the articulation
 *   leans to stabs;
 * - articulation: the bass and the lead gate their written lengths by the
 *   articulation, a stab sounds from 2.5 steps down to 0.45 as it rises, a
 *   pad is held for its written length, and a breakdown's bass lets go 0.3
 *   of a step early;
 * - the licence: every part's velocity, and every part's length, loosens as
 *   the swing rises and holds exactly still when it is 0 — a seeded draw
 *   per part, the same shape drums always had (#147). Width, not direction:
 *   velocity can land louder or softer; length only ever gates a little
 *   shorter, never longer than what `articulation` already set;
 * - the instrument's colour, which the style shapes continuously
 *   (`sound.ts`, C1, C2).
 *
 * Swing and tempo, the performance of time, are the transport's time maps
 * (`swing.ts`, `tempo.ts`). These are the prototype's accents and gates.
 *
 * A drum hit's role and a lead note's written accent pass through onto the
 * dough note unchanged, for whatever reads a performer's notes (L7);
 * whether they are notation or the performer's own is #116's open question
 * (m), not this file's to decide.
 */

import type { BarEnv } from './bar.ts';
import { BAR_STEPS, type DoughNote, type DrumRole, type WrittenNote, onBeat } from './events.ts';
import { draw, type Stream } from './random.ts';
import { timbreOf } from './sound.ts';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * A part's velocity licence: how far a written note's velocity may drift,
 * up or down, as the swing rises. 0 at swing 0, every part (#107, #147).
 * Never keyed by the note's pitch for a pitched part: only its register may
 * differ between a whole and a resumed band (S2), and the licence must not
 * tell those apart. A drum hit's sound is its identity, not a register, so
 * it keeps its own note in its key, as it always has.
 */
function velocityLooseness(
  seed: number,
  stream: Stream,
  swing: number,
  ...keys: readonly number[]
): number {
  return (draw(seed, stream, ...keys) - 0.5) * swing * 24;
}

/**
 * A part's length licence: how much a written note's gated length may gate
 * a little shorter still, as the swing rises. Never longer than what
 * articulation already set, and exactly 1 (no change) at swing 0. Keyed the
 * same way as `velocityLooseness`, for the same reason.
 */
function lengthLooseness(
  seed: number,
  stream: Stream,
  swing: number,
  ...keys: readonly number[]
): number {
  return 1 - draw(seed, stream, ...keys) * swing * 0.15;
}

/**
 * The lead's level, which a motif's accents are counted from when it plays:
 * the midpoint of its accents on and off the beat, 100 and 82. Ahead of the
 * evidence (#79).
 */
export const LEAD_LEVEL = 91;

/** A drum hit's accent by role, before the energy scales it and any written accent adds to it. */
function roleAccent(env: BarEnv, role: DrumRole, step: number): number {
  const { type } = env.plan.section;
  if (type === 'breakdown') return role === 'fill' ? 45 + (step - 8) * 9 : 55;
  switch (role) {
    case 'kick':
      return step % 8 === 0 ? 112 : 92;
    case 'backbeat':
      return step === 12 ? 106 : 100;
    case 'ghost':
      return 32 + 14 * env.style.sync;
    case 'hat':
      return onBeat(step) ? 78 : step % 2 === 0 ? 66 : 50;
    case 'pedal':
      return 58;
    case 'euclid':
      return 72;
    case 'fill': {
      const from = type === 'build' ? 8 : 12;
      return 50 + (step - from) * (60 / (BAR_STEPS - from));
    }
  }
}

/** How loud a written note plays. */
function velocityOf(env: BarEnv, written: WrittenNote): number {
  const { seed, bar, style, barEnergy: energy, plan } = env;
  const { step, note, accent } = written;
  const loose = (stream: Stream) => velocityLooseness(seed, stream, style.swing, bar, step);
  switch (written.part) {
    case 'drums':
      return clampVelocity(
        roleAccent(env, written.role!, step) * (0.65 + 0.35 * energy) +
          (accent ?? 0) +
          velocityLooseness(seed, 'drumVelocity', style.swing, bar, step, note),
      );
    case 'bass': {
      const base =
        plan.section.type === 'breakdown' ? 70 : (onBeat(step) ? 100 : 84) * (0.75 + 0.25 * energy);
      return clampVelocity(base + (accent ?? 0) + loose('bassVelocity'));
    }
    case 'stab':
      return clampVelocity(70 + 20 * energy + (accent ?? 0) + loose('stabVelocity'));
    case 'pad': {
      const quiet = plan.section.type === 'breakdown' || energy < 0.3;
      const padWeight = quiet ? Math.max(0.85, 1 - style.artic) : 1 - style.artic;
      return clampVelocity(
        48 + 30 * energy * (0.5 + padWeight / 2) + (accent ?? 0) + loose('padVelocity'),
      );
    }
    case 'lead': {
      // A motif's accent is counted from the lead's own level (U4), not the
      // beat: its dynamics are the motif's own, not an offset on a value
      // the motif never asked for. Every other part adds its accent on top
      // of what it would have played; the lead's replaces what it would
      // have played, exactly as U4 already decided.
      const base = accent !== undefined ? LEAD_LEVEL + accent : onBeat(step) ? 100 : 82;
      return clampVelocity(base + loose('leadVelocity'));
    }
  }
}

/** How long a written note sounds, in steps. */
function lengthOf(env: BarEnv, written: WrittenNote): number {
  const { seed, bar, style } = env;
  const { artic, swing } = style;
  const { step, note, length } = written;
  const gate = (gated: number, stream: Stream) =>
    gated * lengthLooseness(seed, stream, swing, bar, step);
  switch (written.part) {
    case 'drums':
      return length * lengthLooseness(seed, 'drumLength', swing, bar, step, note);
    case 'bass': {
      const gated =
        env.plan.section.type === 'breakdown'
          ? length - 0.3
          : Math.max(0.3, length * clamp(1.02 - 0.7 * artic, 0.3, 1));
      return gate(gated, 'bassLength');
    }
    case 'pad':
      return gate(length, 'padLength');
    case 'stab':
      return gate(length * lerp(2.5, 0.45, artic), 'stabLength');
    case 'lead':
      return gate(Math.max(0.3, length * clamp(1.05 - 0.75 * artic, 0.25, 1)), 'leadLength');
  }
}

/** A written note as a performer plays it. */
export function perform(env: BarEnv, written: WrittenNote): DoughNote {
  const { part, step, note } = written;
  const velocity = velocityOf(env, written);
  return {
    part,
    step,
    note,
    length: lengthOf(env, written),
    velocity,
    gain: velocity / 127,
    ...timbreOf(part, env.style, env.barEnergy),
    ...(written.role !== undefined && { role: written.role }),
    ...(written.accent !== undefined && { accent: written.accent }),
  };
}
