/**
 * A written note's base: what the bar's own energy, beat or drum role, a
 * section's own read on a part, and articulation already set — before a
 * written accent adds to it and the performer's own licence loosens it,
 * both last (T18, T19). Pulled out of `performer.ts` so the base is named
 * apart from the performer's own hand, since neither wrote it: it is the
 * ensemble's default, not notation stated by a composer nor expression a
 * performer draws (#107).
 */

import type { BarEnv } from './bar.ts';
import { BAR_STEPS, type DrumRole, type WrittenNote, onBeat } from './events.ts';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A drum hit's base accent by role, before the energy scales it. */
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

/** How loud a written note plays, before its accent and its performer's own licence. */
export function baseVelocityOf(env: BarEnv, written: WrittenNote): number {
  const { style, barEnergy: energy, plan } = env;
  const { step } = written;
  switch (written.part) {
    case 'drums':
      return roleAccent(env, written.role!, step) * (0.65 + 0.35 * energy);
    case 'bass':
      return plan.section.type === 'breakdown'
        ? 70
        : (onBeat(step) ? 100 : 84) * (0.75 + 0.25 * energy);
    case 'stab':
      return 70 + 20 * energy;
    case 'pad': {
      const quiet = plan.section.type === 'breakdown' || energy < 0.3;
      const padWeight = quiet ? Math.max(0.85, 1 - style.artic) : 1 - style.artic;
      return 48 + 30 * energy * (0.5 + padWeight / 2);
    }
    case 'lead':
      return onBeat(step) ? 100 : 82;
  }
}

/** How long a written note is gated, before its performer's own licence. */
export function baseLengthOf(env: BarEnv, written: WrittenNote): number {
  const { artic } = env.style;
  const { part, length } = written;
  switch (part) {
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
