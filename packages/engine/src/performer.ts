/**
 * The performer: how a written note is played (T4), as a dough-shaped
 * event (#107, #129).
 *
 * What a part writes is the score: a step, a note, a length in whole steps
 * and, for a drum hit, its role. How loud it plays and how long it sounds
 * are read from the bar, so the score states neither:
 *
 * - dynamics: a drum's accent by its role and step, scaled by the bar's
 *   energy and loosened by a seeded draw as the swing rises; the bass and
 *   the lead by the beat, except a lead note from a motif, which plays on
 *   the lead's level plus the accent it is written with (U4); the comp by
 *   the energy, a pad the softer the more the articulation leans to stabs;
 * - articulation: the bass and the lead gate their written lengths by the
 *   articulation, a stab sounds from 2.5 steps down to 0.45 as it rises, a
 *   pad is held for its written length, and a breakdown's bass lets go 0.3
 *   of a step early;
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
import { draw } from './random.ts';
import { timbreOf } from './sound.ts';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const clampVelocity = (v: number) => Math.max(1, Math.min(127, Math.round(v)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The lead's level, which a motif's accents are counted from when it plays:
 * the midpoint of its accents on and off the beat, 100 and 82. Ahead of the
 * evidence (#79).
 */
export const LEAD_LEVEL = 91;

/** A drum hit's accent, before the energy scales it. */
function accent(env: BarEnv, role: DrumRole, step: number): number {
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
  const { step, note } = written;
  switch (written.part) {
    case 'drums': {
      const looseness = (draw(seed, 'drumVelocity', bar, step, note) - 0.5) * style.swing * 24;
      return clampVelocity(accent(env, written.role!, step) * (0.65 + 0.35 * energy) + looseness);
    }
    case 'bass':
      return plan.section.type === 'breakdown'
        ? 70
        : clampVelocity((onBeat(step) ? 100 : 84) * (0.75 + 0.25 * energy));
    case 'stab':
      return clampVelocity(70 + 20 * energy);
    case 'pad': {
      const quiet = plan.section.type === 'breakdown' || energy < 0.3;
      const padWeight = quiet ? Math.max(0.85, 1 - style.artic) : 1 - style.artic;
      return clampVelocity(48 + 30 * energy * (0.5 + padWeight / 2));
    }
    case 'lead':
      if (written.accent !== undefined) return clampVelocity(LEAD_LEVEL + written.accent);
      return onBeat(step) ? 100 : 82;
  }
}

/** How long a written note sounds, in steps. */
function lengthOf(env: BarEnv, written: WrittenNote): number {
  const { artic } = env.style;
  const { length } = written;
  switch (written.part) {
    case 'drums':
      return length;
    case 'bass':
      return env.plan.section.type === 'breakdown'
        ? length - 0.3
        : Math.max(0.3, length * clamp(1.02 - 0.7 * artic, 0.3, 1));
    case 'pad':
      return length;
    case 'stab':
      return length * lerp(2.5, 0.45, artic);
    case 'lead':
      return Math.max(0.3, length * clamp(1.05 - 0.75 * artic, 0.25, 1));
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
