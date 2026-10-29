/**
 * The drums: a function of the bar.
 *
 * Every sound has a probability per step, blended from the style: a
 * four-on-the-floor kick against a syncopated one, backbeat and ghost
 * snares, hats that fill in with energy and swing into a ride. Each step's
 * draw is fixed for a whole section, so as the style moves, notes appear
 * and disappear one at a time: rhythms morph instead of reshuffling. Odd bars
 * vary the draws a little, scaled by entropy, so a groove is a loop with
 * variation. A snare fill ends a build and some other sections.
 *
 * One part switches rather than morphs: the Euclidean rim, which joins when
 * syncopation is high. It plays E(3,16), E(5,16) or E(7,16) as the energy
 * crosses a third and two thirds, and syncopation rotates it. The three
 * patterns are not nested, so at those crossings hits move. Within a third,
 * and at one rotation, the rim only gains hits as the energy rises.
 *
 * Each hit is written with its role in the groove (kick, backbeat, fill,
 * ghost, hat, pedal or euclid), and the performance sets its accent from it
 * (`performer.ts`). Where two roles land on one sound and step, one hit is
 * written, the stronger role's. The drums carry nothing from bar to bar, so
 * any bar plays from its environment alone.
 *
 * They are written on the bar's meter (#260): its steps (`stepsOf`), its
 * pulses, and the accent grades of its tree (`accentsOf`), which give the
 * straight kick its weights (the downbeat, the half, the pulses) as 4/4's
 * `[1, 0, 0, 0, f, 0, 0, 0, 0.9, …]` had them. The backbeat is the pulses
 * `backbeatOf` names, the offbeats the eighths between pulses, and the tables
 * written on 4/4's 16 steps, the syncopated kick and the ghosts, are read in
 * another meter by the rule (`regroup.ts`). In 4/4 every bar is what it was.
 */

import { type Meter, even, meterOnSteps, positions, stepsOf, accentsOf } from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { DRUM_ROLES, type DrumRole, type WrittenNote, halfOf, lateOf } from './events.ts';
import { SECTION_BARS } from './form.ts';
import { type Stream, chance, draw, heldDraw } from './random.ts';
import { type Regroup, readOnMeter } from './regroup.ts';
import { eighthSwing } from './swing.ts';

/**
 * The General MIDI drum notes the band plays. The drummer's own bars strike
 * all but the clap, which comes from a fragment's line (cells' `Electro
 * swing drums`, #508) and plays the backbeat or a ghost, as the snare does.
 */
export const DRUM_NOTES = {
  kick: 36,
  rim: 37,
  snare: 38,
  clap: 39,
  closedHat: 42,
  pedalHat: 44,
  openHat: 46,
  ride: 51,
} as const;

/**
 * The General MIDI claves, which the composer's clave line strikes: cells'
 * claves strike a voice of their own, `&claves` (yggi/cells#179 and #140,
 * cells v0.7.0). A fragment's notes pass to the drums as they are
 * (`groove.ts`), the built-in kit voices this one, and MIDI out sends a
 * note no drum sound remaps as itself.
 * It is no drum sound of the drummer's own, which `DRUM_NOTES` holds.
 */
export const CLAVES_NOTE = 75;

/** One of the drums' physical sounds, as `DRUM_NOTES` names it: not a groove `DrumRole`. */
export type DrumSound = keyof typeof DRUM_NOTES;

/** The drums' held draws and their odd-bar variation. */
const HELD: readonly [Stream, Stream] = ['drumHit', 'drumVariation'];

/** Each decision's key within the drums' streams. */
const ROLE = {
  kick: 0,
  backbeat: 1,
  ghost: 2,
  hat: 3,
  ride: 4,
  open: 5,
  pedal: 6,
  fill: 7,
  euclid: 8,
} as const;

// Per step: the syncopated kick and the ghost snares. The straight kick
// depends on the energy, so it is built per bar.
const KICK_SYNCOPATED = [1, 0, 0, 0.7, 0, 0, 0.6, 0, 0, 0, 0.8, 0.35, 0, 0, 0.45, 0];
const GHOSTS = [0, 0.3, 0, 0.4, 0, 0.2, 0, 0.6, 0, 0.5, 0, 0.3, 0, 0.2, 0, 0.5];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};

/**
 * The pulses, from 0, the snare's backbeat falls on: every pulse after the
 * downbeat in a bar of two or three, the odd ones from four up, so 4/4's
 * second and fourth, 12/8's second and fourth, 6/8's second and 3/4's second
 * and third.
 */
export function backbeatOf(meter: Meter): number[] {
  const pulses = meter.heights.length;
  return Array.from({ length: pulses }, (_, pulse) => pulse).filter((pulse) =>
    pulses <= 3 ? pulse > 0 : pulse % 2 === 1,
  );
}

/** The drum hits a bar writes, in order of step and note. `regroup` is how a table written on 4/4's steps is read in another meter. */
export function drums(env: BarEnv, regroup: Regroup = 'cycle'): WrittenNote[] {
  const { seed, bar, barInSection, style, barEnergy: energy, meter } = env;
  const { section } = env.plan;
  const { sync, artic, harm, entropy } = style;
  // A meter swung on 8n brings in the jazz kit (#360).
  const eighth = eighthSwing(env.swing);
  const last = barInSection === SECTION_BARS - 1;
  const density = smooth((energy - 0.05) / 0.5);

  /** Whether a role plays on a step with probability p. */
  const plays = (role: keyof typeof ROLE, step: number, p: number) =>
    chance(heldDraw(seed, HELD, ROLE[role], section.index, bar, step, entropy), p);

  const steps = stepsOf(meter);
  const starts = meterOnSteps(meter).heights;
  const pulseAt = new Set(starts);
  const accents = accentsOf(meter);
  const backbeat = new Set(backbeatOf(meter).map((pulse) => starts[pulse]!));
  const offbeatAfter = (on: (step: number) => boolean) =>
    new Set(starts.filter(on).map((step) => step + 2));
  const afterBackbeat = offbeatAfter((step) => backbeat.has(step));
  const afterOthers = offbeatAfter((step) => !backbeat.has(step));
  const half = halfOf(steps);
  const kickSyncopated = readOnMeter(KICK_SYNCOPATED, meter, regroup, bar);
  const ghosts = readOnMeter(GHOSTS, meter, regroup, bar);

  const hits = new Map<number, WrittenNote>();
  /** A hit; where one is already on this step and note, the stronger role stays. */
  const add = (step: number, note: number, role: DrumRole) => {
    const key = step * 128 + note;
    const there = hits.get(key);
    if (!there || DRUM_ROLES.indexOf(role) < DRUM_ROLES.indexOf(there.role!))
      hits.set(key, { part: 'drums', role, step, note, length: 1 });
  };
  const played = () => [...hits.entries()].sort(([a], [b]) => a - b).map(([, e]) => e);

  if (section.type === 'breakdown') {
    if (energy > 0.2)
      for (const start of starts)
        add(start + 2, eighth > 0.5 ? DRUM_NOTES.ride : DRUM_NOTES.closedHat, 'hat');
    if (last) for (let s = half; s < steps; s++) add(s, DRUM_NOTES.snare, 'fill');
    return played();
  }

  const fourOnFloor = clamp01((energy - 0.45) * 3) * (1 - eighth) * (1 - sync * 0.7);
  const openHat = clamp01(artic * (1 - eighth) * (1 - harm) * 1.3 - 0.25) * density;
  // One and three, with two and four filling in as four on the floor.
  const f = fourOnFloor;
  const kickStraight = Array.from({ length: steps }, (_, s) =>
    s === 0 ? 1 : !pulseAt.has(s) ? 0 : accents[s / 2] === 'half' && starts.length >= 4 ? 0.9 : f,
  );
  for (let s = 0; s < steps; s++) {
    const kick =
      lerp(kickStraight[s]!, kickSyncopated[s]!, sync) *
      (s === 0 ? 1 : density) *
      (1 - 0.55 * eighth);
    if (plays('kick', s, kick)) add(s, DRUM_NOTES.kick, 'kick');

    if (backbeat.has(s)) {
      if (energy > 0.25 && plays('backbeat', s, 1 - 0.8 * eighth))
        add(s, DRUM_NOTES.snare, 'backbeat');
    } else if (plays('ghost', s, ghosts[s]! * sync * density * 0.9 + eighth * 0.12 * density))
      add(s, DRUM_NOTES.snare, 'ghost');

    let hat =
      s % 2 === 0 ? clamp01(0.15 + energy * 1.1) : clamp01((energy - 0.55) * 2.5) * (1 - eighth);
    if (eighth > 0) {
      if (pulseAt.has(s)) hat = Math.max(hat, eighth);
      if (afterBackbeat.has(s)) hat = Math.max(hat, eighth * 0.95);
      if (afterOthers.has(s)) hat *= 1 - 0.7 * eighth;
    }
    hat *= Math.max(density, eighth * 0.8);
    if (plays('hat', s, hat)) {
      const open = s % 2 === 0 && !pulseAt.has(s) && plays('open', s, openHat);
      const note = open
        ? DRUM_NOTES.openHat
        : plays('ride', s, eighth)
          ? DRUM_NOTES.ride
          : DRUM_NOTES.closedHat;
      add(s, note, 'hat');
    }
    if (eighth > 0.3 && backbeat.has(s) && plays('pedal', s, eighth))
      add(s, DRUM_NOTES.pedalHat, 'pedal');
  }

  // Euclidean percussion, E(3,16), E(5,16) (a clave) or E(7,16) by energy,
  // when syncopation is high.
  if (plays('euclid', 0, sync * density * (1 - 0.7 * eighth) * 1.3)) {
    const k = [3, 5, 7][Math.min(2, Math.floor(energy * 3))]!;
    const rotation = Math.floor(draw(seed, 'drumEuclid', section.index) * 4 * sync);
    for (const s of positions(even(k, steps, rotation))) add(s, DRUM_NOTES.rim, 'euclid');
  }

  if (last && (section.type === 'build' || plays('fill', 0, 0.35 + 0.3 * sync))) {
    const from = section.type === 'build' ? half : lateOf(steps);
    for (let s = from; s < steps; s++) add(s, DRUM_NOTES.snare, 'fill');
  }
  return played();
}
