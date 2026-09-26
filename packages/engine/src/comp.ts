/**
 * The comp: the chords part, a machine at bar rate that carries its last
 * voicing.
 *
 * Each chord is voiced close, in 50–79, from the voicing before: of every
 * inversion on every bottom note from 50 to 63, the one that moves least
 * (`voiceMotion`). A ninth chord drops its fifth. With nothing to lead
 * from, the voicing sits nearest the middle of the range.
 *
 * Articulation splits the part: legato pads each chord, held to the next;
 * staccato stabs on the beat or, as syncopation rises, off it, and when
 * syncopated anticipates the next bar's chord on its last steps. A
 * breakdown and a quiet bar only pad. Whether a chord is padded, and where
 * the stabs fall, are held draws per section (`heldDraw`), so the part
 * morphs. A pad is written for its chord and a stab for one step; how long
 * each sounds, and how loud, is the performance's (`perform.ts`). These are
 * the prototype's rules and weights.
 */

import { type Chord, joinChord, wrap } from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { chordAt } from './chords.ts';
import type { WrittenNote } from './events.ts';
import type { Machine } from './machine.ts';
import { type Stream, chance, heldDraw } from './random.ts';
import { swingParts } from './swing.ts';

/** The lowest and highest note the comp plays. */
export const COMP_RANGE = [50, 79] as const;

/** Where a voicing's bottom note may stand. */
const BOTTOMS = [50, 63] as const;

/** Where stabs fall, straight and syncopated. */
const STABS_STRAIGHT = [1, 0, 0, 0, 0.5, 0, 0, 0, 0.9, 0, 0, 0, 0.5, 0, 0, 0];
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
    const { seed, bar, plan, style, barEnergy: energy, chords, next } = env;
    const { eighth } = swingParts(style.swing);
    const quiet = plan.section.type === 'breakdown' || energy < 0.3;
    const padWeight = quiet ? Math.max(0.85, 1 - style.artic) : 1 - style.artic;
    const stabDensity = quiet
      ? 0
      : (0.35 + 0.65 * energy) * (1 - 0.45 * eighth) * style.artic * 1.4;
    const held = (role: number, step: number) =>
      heldDraw(seed, HELD, role, plan.section.index, bar, step, style.entropy);

    let previous = last;
    const voiced = chords.map((c) => (previous = voicing(c.chord, previous)));
    const written: WrittenNote[] = [];
    const padded = new Set<number>();
    chords.forEach((c, i) => {
      const step = c.slot.step;
      if (!chance(held(ROLE.pad, step), padWeight * 1.15)) return;
      padded.add(step);
      const end = chords[i + 1]?.slot.step ?? 16;
      for (const note of voiced[i]!)
        written.push({ part: 'chords', comp: 'pad', step, note, length: end - step });
    });

    for (let s = 0; s < 16; s++) {
      if (padded.has(s)) continue;
      const p = lerp(STABS_STRAIGHT[s]!, STABS_SYNCOPATED[s]!, style.sync) * stabDensity;
      if (!chance(held(ROLE.stab, s), p)) continue;
      const here = chords.indexOf(chordAt(chords, s));
      let notes = voiced[here]!;
      const coming = next[0];
      if (s >= 14 && style.sync > 0.5 && coming && !same(coming.chord, chords[here]!.chord))
        notes = voicing(coming.chord, previous);
      for (const note of notes)
        written.push({ part: 'chords', comp: 'stab', step: s, note, length: 1 });
    }
    return { carried: previous, output: written };
  },
};
