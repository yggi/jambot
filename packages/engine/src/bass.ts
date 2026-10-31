/**
 * The bass: a machine at bar rate that carries its last note.
 *
 * Five patterns are blended by the style: a root on one (and three), a
 * pump of offbeat eighths, straight eighths, a syncopated funk line and a
 * walk on every beat. Where each plays is a held draw per section and step
 * (`heldDraw`), so the line morphs as the style moves. It plays the new root
 * on every chord change unless it pumps, and a walk leads into a chord change
 * by a semitone and otherwise walks the chord's tones. Off a chord change it
 * may anticipate the next chord's root late in the bar, jump an octave, or
 * play the fifth. A breakdown holds each chord's root.
 *
 * Each note goes to the nearest octave of its pitch class, from the last
 * note, within 33–52, and an octave jump may take it to 57. So the last
 * note is all it carries. A note is written to the next one, or to the end
 * of the bar; the performance gates it by the articulation (`performer.ts`).
 * These are the prototype's patterns and weights.
 *
 * They are written on the bar's meter (#260): its steps, its pulses and the
 * accent tree. The root, the eighths and the walk take their weights from the
 * grades and the pulses (the root on the downbeat and the bar's half, the
 * pump on the eighth after each pulse, the walk on every pulse); the funk
 * line, written on 4/4's 16 steps, is read in another meter by the rule
 * (`regroup.ts`). The chords' slots, 0 and the half, are read on the meter
 * (`chordsOn`). In 4/4 every bar is what it was.
 *
 * Where the composer found it a line in the repository (#423), it plays from
 * it as the drummer plays from a rhythm (`playBass`): how many notes as
 * before, the line's steps and tones first.
 */

import { type Chord, type Meter, accentsOf, meterOnSteps, stepsOf, wrap } from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { type LineNote, lineTone } from './bass-query.ts';
import { type BarChord, chordAt, chordsOn } from './chords.ts';
import type { WrittenNote } from './events.ts';
import type { Machine } from './machine.ts';
import { readOnMeter } from './regroup.ts';
import { type Stream, chance, draw, heldDraw } from './random.ts';
import { type MeterSwing, eighthSwing } from './swing.ts';
import type { Style } from './style.ts';

/** The lowest and highest note the bass plays. */
export const BASS_RANGE = [33, 57] as const;

/** Where a note of a pitch class may go before an octave jump. */
const FOLDED = [33, 52] as const;

/** The funk line, written on 4/4's 16 steps: the one pattern no grade or pulse gives. */
const FUNK = [1, 0, 0, 0.7, 0, 0, 0.8, 0.4, 0, 0, 0.7, 0.5, 0, 0.3, 0.8, 0];

const PATTERNS = ['root', 'pump', 'eight', 'funk', 'walk'] as const;

export type BassPattern = (typeof PATTERNS)[number];

/**
 * The five patterns over a meter's steps: a root on the downbeat and the half
 * (with four pulses or more), a pump of the eighth after each pulse, straight
 * eighths with the downbeat and the half stronger, the funk line read by the
 * rule, and a walk on every pulse.
 */
export function patternsOn(meter: Meter, bar = 0): Record<BassPattern, number[]> {
  const steps = stepsOf(meter);
  const starts = meterOnSteps(meter).heights;
  const accents = accentsOf(meter);
  const isHalf = (s: number) => starts.length >= 4 && s % 2 === 0 && accents[s / 2] === 'half';
  const over = (weight: (step: number) => number) =>
    Array.from({ length: steps }, (_, s) => weight(s));
  const offbeats = new Set(starts.map((start) => start + 2));
  const pulses = new Set(starts);
  return {
    root: over((s) => (s === 0 ? 1 : isHalf(s) ? 0.6 : 0)),
    pump: over((s) => (offbeats.has(s) ? 1 : 0)),
    eight: over((s) => (s % 2 !== 0 ? 0 : s === 0 ? 1 : isHalf(s) ? 0.9 : 0.8)),
    funk: readOnMeter(FUNK, meter, 'cycle', bar),
    walk: over((s) => (pulses.has(s) ? 1 : 0)),
  };
}

const HELD: readonly [Stream, Stream] = ['bassHit', 'bassVariation'];
const ROLE = { hit: 0, anticipate: 1 } as const;
const NOTE = { approach: 0, walkTone: 1, ornament: 2 } as const;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * How much of each pattern the style asks for, at the bar's energy, under
 * the meter's swing: one swung on 8n brings in the walk (#360).
 */
export function bassBlend(
  style: Style,
  swing: MeterSwing,
  energy: number,
): Record<BassPattern, number> {
  const eighth = eighthSwing(swing);
  const walk = eighth * clamp01(style.harm * 1.5);
  const funk = style.sync * (1 - walk);
  const pump = (1 - style.harm) * style.artic * (1 - eighth) * (1 - style.sync);
  const eight = energy * 0.6 * (1 - walk) * (1 - funk);
  return { root: 0.35, pump, eight, funk, walk };
}

const rootOf = (chord: Chord) => chord.helix.heights[0]!;
const intervals = (chord: Chord) => chord.helix.heights.map((x) => x - rootOf(chord));

/** The note of a pitch class nearest the last note, within 33–52; ties go down. */
export function nearest(pitchClass: number, last: number): number {
  let best = 40;
  let distance = Infinity;
  for (let n = FOLDED[0]; n <= FOLDED[1]; n++)
    if (wrap(n, 12) === wrap(pitchClass, 12) && Math.abs(n - last) < distance) {
      distance = Math.abs(n - last);
      best = n;
    }
  return best;
}

/** An onset the bass plays: its step, and the line's note there, where the line gives it one. */
interface Onset {
  readonly step: number;
  readonly from: LineNote | null;
}

/**
 * The bass's bar, from the last note it played, and, where the composer found
 * it a line (#423, `bass-query.ts`), that line's notes in the bar (on its
 * steps).
 *
 * With no line it plays its own, as above. With one, as the drummer plays
 * from a rhythm (`groove.ts`, the owner's ruling on E36): it decides as
 * before how many notes it plays, and the line says where they fall and
 * what they read, its notes first (the loudest first, then the earliest; a
 * line's notes are all one level, so the earliest), and where the bass
 * plays more notes than the line holds, its own on other steps, first those
 * it is forced to (a chord change, a walk's beat), then by its own weight
 * there, then the earliest. A note of the line reads its pitch class over
 * the bar's chords (`lineTone`), and its octave is the bass's as any note's
 * (`nearest`, and the octave up its own draw gives off a chord change); an
 * own note plays as it would alone. A breakdown holds each chord's root, as
 * always: the section's form is the bass's.
 */
export function playBass(
  env: BarEnv,
  last: number,
  line: readonly LineNote[] = [],
): { carried: number; output: WrittenNote[] } {
  const { seed, bar, plan, style, barEnergy: energy, next, meter } = env;
  const section = plan.section.index;
  const notes: WrittenNote[] = [];
  const steps = stepsOf(meter);
  const starts = meterOnSteps(meter).heights;
  const onBeat = (step: number) => starts.includes(step);
  const chords = chordsOn(env.chords, meter);
  const startsAt = (step: number) => chords.some((c) => c.slot.step === step);
  const nextAfter = (step: number): BarChord =>
    chords.find((c) => c.slot.step > step) ?? next[0] ?? chordAt(chords, step);

  if (plan.section.type === 'breakdown') {
    chords.forEach((c, i) => {
      const end = chords[i + 1]?.slot.step ?? steps;
      last = nearest(rootOf(c.chord), last);
      notes.push({ part: 'bass', step: c.slot.step, note: last, length: end - c.slot.step });
    });
    return { carried: last, output: notes };
  }

  const blend = bassBlend(style, env.swing, energy);
  const total = Object.values(blend).reduce((a, b) => a + b, 0);
  const density = 0.55 + 0.6 * energy;
  const held = (role: number, step: number) =>
    heldDraw(seed, HELD, role, section, bar, step, style.entropy, env.restless);
  const tables = patternsOn(meter, bar);
  const own: number[] = [];
  const weight: number[] = [];
  const forcedAt = new Set<number>();
  for (let s = 0; s < steps; s++) {
    let p = 0;
    for (const pattern of PATTERNS) p += blend[pattern] * tables[pattern][s]!;
    p /= total;
    weight.push(p);
    const forced = (startsAt(s) && blend.pump < 0.45) || (blend.walk > 0.5 && onBeat(s));
    if (forced) forcedAt.add(s);
    if (forced || chance(held(ROLE.hit, s), p * density)) own.push(s);
  }
  if (own.length === 0) own.push(0);
  const onsets = fromLine(own, line, forcedAt, weight);

  onsets.forEach(({ step: s, from }, i) => {
    const chord = chordAt(chords, s).chord;
    const end = onsets[i + 1]?.step ?? steps;
    const walking = blend.walk > 0.5 && onBeat(s);
    let pitchClass = rootOf(chord);
    let up = false;
    if (from) {
      pitchClass = lineTone(from, chords, next, plan.key);
      if (!walking && !startsAt(s)) {
        const x = draw(seed, 'bassNote', NOTE.ornament, section, s);
        up = x >= 0.55 && x < 0.8;
      }
    } else if (walking) {
      const nextBeat = starts.find((start) => start > s) ?? steps;
      const lastBeat = nextBeat >= steps;
      const change = lastBeat || startsAt(nextBeat);
      const target = lastBeat ? (next[0]?.chord ?? chord) : chordAt(chords, nextBeat).chord;
      if (startsAt(s)) pitchClass = rootOf(chord);
      else if (change)
        pitchClass =
          rootOf(target) + (chance(draw(seed, 'bassNote', NOTE.approach, bar, s), 0.5) ? -1 : 1);
      else {
        const [, third, fifth, seventh] = intervals(chord);
        const tones = [third!, fifth!, seventh ?? fifth!];
        pitchClass =
          rootOf(chord) + tones[Math.floor(draw(seed, 'bassNote', NOTE.walkTone, bar, s) * 3)]!;
      }
    } else if (!startsAt(s)) {
      const coming = nextAfter(s).chord;
      if (
        s >= steps - 3 &&
        wrap(rootOf(coming) - rootOf(chord), 12) !== 0 &&
        chance(held(ROLE.anticipate, s), style.sync * 0.9)
      )
        pitchClass = rootOf(coming);
      else {
        const x = draw(seed, 'bassNote', NOTE.ornament, section, s);
        if (x >= 0.55 && x < 0.8) up = true;
        else if (x >= 0.8) pitchClass = rootOf(chord) + intervals(chord)[2]!;
      }
    }
    last = nearest(pitchClass, last);
    notes.push({
      part: 'bass',
      step: s,
      note: up && last + 12 <= BASS_RANGE[1] ? last + 12 : last,
      length: end - s,
    });
  });
  return { carried: last, output: notes };
}

/**
 * Where the bass's notes fall given a line (`playBass`): as many as it plays
 * of its own (`own`), the line's first, the earliest first, then its own on
 * other steps, those it is forced to first, then by its weight there, then
 * the earliest; in order of step. Its own where the line has none.
 */
function fromLine(
  own: readonly number[],
  line: readonly LineNote[],
  forced: ReadonlySet<number>,
  weight: readonly number[],
): Onset[] {
  if (!line.length) return own.map((step) => ({ step, from: null }));
  const theirs = [...line].sort((a, b) => a.step - b.step);
  const kept = theirs
    .filter((n, i) => theirs.findIndex((m) => m.step === n.step) === i)
    .slice(0, own.length)
    .map((n) => ({ step: n.step, from: n }));
  const taken = new Set(kept.map((o) => o.step));
  const more = own
    .filter((s) => !taken.has(s))
    .sort(
      (a, b) => Number(forced.has(b)) - Number(forced.has(a)) || weight[b]! - weight[a]! || a - b,
    )
    .slice(0, own.length - kept.length)
    .map((step) => ({ step, from: null }));
  return [...kept, ...more].sort((a, b) => a.step - b.step);
}

/** The bass as a machine: its own bar, with no line (`playBass`). */
export const bass: Machine<BarEnv, number, null, WrittenNote[]> = {
  initial: 40,
  advance: (env, last) => playBass(env, last),
};
