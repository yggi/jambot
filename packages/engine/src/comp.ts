/**
 * The comp: a machine at bar rate that plays two parts, the pad and the
 * stab, and carries its last voicing.
 *
 * Each chord is voiced close, in 50–79, from the voicing before: of every
 * inversion on every bottom note from 50 to 63, the one that moves least
 * (`voiceMotion`). A ninth chord drops its fifth. With nothing to lead
 * from, the voicing sits nearest the middle of the range.
 *
 * Articulation splits it: legato pads each chord, held to the next;
 * staccato stabs on the beat or, as syncopation rises, off it, and when
 * syncopated anticipates the next bar's chord on its last steps. A
 * breakdown and a quiet bar only pad. Whether a chord is padded, and where
 * the stabs fall, are held draws per section (`heldDraw`), so the parts
 * morph. A pad is written for its chord and a stab for one step; how long
 * each sounds, and how loud, is the performance's (`performer.ts`). These are
 * the prototype's rules and weights.
 *
 * They are written on the bar's meter (#260), as the bass is: the straight
 * stabs take their weights from the pulses and the half, the syncopated ones,
 * written on 4/4's 16 steps, are read by the rule (`regroup.ts`), and the
 * chords' slots are read on the meter (`chordsOn`). In 4/4 every bar is what
 * it was.
 */

import { type Chord, accentsOf, joinChord, meterOnSteps, stepsOf, wrap } from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { chordAt, chordsOn } from './chords.ts';
import type { WrittenNote } from './events.ts';
import type { Machine } from './machine.ts';
import { type Stream, chance, heldDraw } from './random.ts';
import { readOnMeter } from './regroup.ts';
import { eighthSwing } from './swing.ts';

/** The lowest and highest note the comp plays. */
export const COMP_RANGE = [50, 79] as const;

/** Where a voicing's bottom note may stand. */
const BOTTOMS = [50, 63] as const;

/** Where stabs fall syncopated, written on 4/4's 16 steps; the straight ones are the pulses' and the half's. */
const STABS_SYNCOPATED = [0, 0, 0.9, 0, 0, 0, 0.9, 0.3, 0, 0, 0.9, 0, 0.3, 0, 0.9, 0.3];

const HELD: readonly [Stream, Stream] = ['compHit', 'compVariation'];
const ROLE = { pad: 0, stab: 1 } as const;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * How far a voicing moves from the one before: each new note's distance to
 * the nearest old one, and half of each old note's distance to the nearest
 * new one, so a voice that drops out counts too.
 */
export function voiceMotion(from: readonly number[], to: readonly number[]): number {
  const nearest = (x: number, among: readonly number[]) =>
    Math.min(...among.map((y) => Math.abs(x - y)));
  return (
    to.reduce((sum, x) => sum + nearest(x, from), 0) +
    0.5 * from.reduce((sum, x) => sum + nearest(x, to), 0)
  );
}

/** A chord voiced close in 50–79, moving least from the voicing before. */
export function voicing(chord: Chord, previous: readonly number[] | null): number[] {
  const tones = joinChord(chord);
  const kept = tones.length >= 5 ? tones.filter((_, i) => i !== 2) : tones;
  const classes = kept.map((x) => wrap(x, 12));
  const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
  let best: number[] | null = null;
  let bestScore = Infinity;
  for (let inversion = 0; inversion < classes.length; inversion++) {
    const order = [...classes.slice(inversion), ...classes.slice(0, inversion)];
    for (let bottom = BOTTOMS[0]; bottom <= BOTTOMS[1]; bottom++) {
      if (wrap(bottom, 12) !== order[0]) continue;
      const notes: number[] = [bottom];
      for (const pc of order.slice(1)) {
        let n = notes.at(-1)! + 1;
        while (wrap(n, 12) !== pc) n++;
        notes.push(n);
      }
      if (notes.at(-1)! > COMP_RANGE[1]) continue;
      const score = previous ? voiceMotion(previous, notes) : Math.abs(mean(notes) - 62);
      if (score < bestScore) {
        bestScore = score;
        best = notes;
      }
    }
  }
  return best ?? classes.map((pc) => 60 + pc);
}

const same = (a: Chord, b: Chord) => joinChord(a).join() === joinChord(b).join();

export const comp: Machine<BarEnv, readonly number[] | null, null, WrittenNote[]> = {
  initial: null,
  advance(env, last) {
    const { seed, bar, plan, style, barEnergy: energy, next, meter } = env;
    const eighth = eighthSwing(env.swing);
    const steps = stepsOf(meter);
    const starts = meterOnSteps(meter).heights;
    const accents = accentsOf(meter);
    const chords = chordsOn(env.chords, meter);
    const straight = Array.from({ length: steps }, (_, s) =>
      s === 0
        ? 1
        : !starts.includes(s)
          ? 0
          : accents[s / 2] === 'half' && starts.length >= 4
            ? 0.9
            : 0.5,
    );
    const syncopated = readOnMeter(STABS_SYNCOPATED, meter, 'cycle', bar);
    const quiet = plan.section.type === 'breakdown' || energy < 0.3;
    const padWeight = quiet ? Math.max(0.85, 1 - style.artic) : 1 - style.artic;
    const stabDensity = quiet
      ? 0
      : (0.35 + 0.65 * energy) * (1 - 0.45 * eighth) * style.artic * 1.4;
    const held = (role: number, step: number) =>
      heldDraw(seed, HELD, role, plan.section.index, bar, step, style.entropy, env.restless);

    let previous = last;
    const voiced = chords.map((c) => (previous = voicing(c.chord, previous)));
    const written: WrittenNote[] = [];
    const padded = new Set<number>();
    chords.forEach((c, i) => {
      const step = c.slot.step;
      if (!chance(held(ROLE.pad, step), padWeight * 1.15)) return;
      padded.add(step);
      const end = chords[i + 1]?.slot.step ?? steps;
      for (const note of voiced[i]!) written.push({ part: 'pad', step, note, length: end - step });
    });

    for (let s = 0; s < steps; s++) {
      if (padded.has(s)) continue;
      const p = lerp(straight[s]!, syncopated[s]!, style.sync) * stabDensity;
      if (!chance(held(ROLE.stab, s), p)) continue;
      const here = chords.indexOf(chordAt(chords, s));
      let notes = voiced[here]!;
      const coming = next[0];
      if (s >= steps - 2 && style.sync > 0.5 && coming && !same(coming.chord, chords[here]!.chord))
        notes = voicing(coming.chord, previous);
      for (const note of notes) written.push({ part: 'stab', step: s, note, length: 1 });
    }
    return { carried: previous, output: written };
  },
};
