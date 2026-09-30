/**
 * The ending: one bar that closes a song on a cadence, and the count-in
 * that opens it.
 *
 * The final bar has two halves. The dominant seventh sounds on its first
 * two beats, the drums lean toward the third with a snare, and on the third
 * beat everything lands together on the tonic: the kick, a ride, the bass,
 * the pad and the lead, which resolves to the key's tonic from its second
 * degree. The tonic rings on past the bar for `RING_STEPS`, so the song
 * ends on a chord left to die away, not on a cut. It is written as any bar
 * is (`WrittenNote`) and played through the performer, so a client that gets
 * it from a host plays exactly the ending the host does.
 *
 * The count-in is one bar of the song's own beats before its first step, at
 * the tempo the song opens at: a click on each beat, the downbeat's marked.
 * It is a reading of the song's clock like the metronome (`metronome.ts`),
 * laid before the song rather than through it.
 *
 * The bar is its meter's (#260): the landing is the bar's half, the chords'
 * second slot read on the meter (`slotStepOn`), the ring follows the bar's
 * steps, and the count-in is one bar of the meter's pulses. In 4/4 it is
 * what it was.
 */

import {
  type Meter,
  type Weight,
  compose,
  heightOf,
  meterOnSteps,
  stepsOf,
  wrap,
} from '@jambot/theory';
import type { BarEnv } from './bar.ts';
import { nearest } from './bass.ts';
import { type BarChord, slotStepOn } from './chords.ts';
import { voicing } from './comp.ts';
import { DRUM_NOTES } from './drums.ts';
import { SONG_METER, type WrittenNote, beatStart } from './events.ts';
import { type Key, keyHelix } from './key.ts';
import { LEAD_RANGE, type LeadCarried } from './lead.ts';
import { type StyleTrack, valueAt } from './style.ts';
import { stepSeconds } from './tempo.ts';

/** How many steps the last chord rings on past the final bar. */
export const RING_STEPS = 8;

/** The step of a theme's bar the tonic lands on, in 4/4's steps: its third beat. A bar of another meter reads it on its own (`slotStepOn`). */
const LANDING = beatStart(2);

/** The final bar's chords: the dominant seventh of the key, then its tonic. */
export function cadence(key: Key): BarChord[] {
  const scale = keyHelix(key);
  const root = scale.heights[0]! + 7;
  const tonic = compose({ cycle: 7, heights: [0, 2, 4] }, scale).heights;
  return [
    {
      slot: { step: 0, dominantOf: 0 },
      raised: false,
      chord: { helix: { cycle: 12, heights: [root, root + 4, root + 7, root + 10] }, tensions: [] },
    },
    {
      slot: { step: LANDING, degree: 0 },
      raised: false,
      chord: { helix: { cycle: 12, heights: tonic }, tensions: [] },
    },
  ];
}

/** What the parts carry into the final bar, which they voice their last notes from. */
export interface FinaleFrom {
  readonly bass: number;
  readonly comp: readonly number[] | null;
  readonly lead: LeadCarried;
}

/** The note of a pitch class nearest another, within the lead's range. */
function nearestInLead(pitchClass: number, last: number): number {
  let best: number = LEAD_RANGE[0];
  for (let n = LEAD_RANGE[0]; n <= LEAD_RANGE[1]; n++)
    if (wrap(n, 12) === wrap(pitchClass, 12) && Math.abs(n - last) < Math.abs(best - last))
      best = n;
  return best;
}

/** The notes of the final bar, whose chords are the cadence (`env.chords`). */
export function finale(env: BarEnv, from: FinaleFrom): WrittenNote[] {
  const [dominant, tonic] = env.chords as [BarChord, BarChord];
  const scale = keyHelix(env.plan.key);
  const notes: WrittenNote[] = [];
  const landing = slotStepOn(env.meter, LANDING);
  const held = stepsOf(env.meter) + RING_STEPS;
  const pulses = meterOnSteps(env.meter).heights;

  // The drums lean in and land: hats, a backbeat on the pulse before the
  // landing, a snare pickup an eighth before it, then kick, snare and ride
  // together.
  for (let step = 0; step < landing; step += 2) notes.push(hit(step, DRUM_NOTES.closedHat, 'hat'));
  notes.push(hit(0, DRUM_NOTES.kick, 'kick'));
  for (const step of pulses)
    if (step > 0 && step < landing) notes.push(hit(step, DRUM_NOTES.snare, 'backbeat'));
  if (!pulses.includes(landing - 2)) notes.push(hit(landing - 2, DRUM_NOTES.snare, 'backbeat'));
  notes.push(hit(landing, DRUM_NOTES.kick, 'kick'));
  notes.push(hit(landing, DRUM_NOTES.snare, 'backbeat'));
  notes.push(hit(landing, DRUM_NOTES.ride, 'hat'));

  const low = nearest(dominant.chord.helix.heights[0]!, from.bass);
  notes.push({ part: 'bass', step: 0, note: low, length: landing });
  notes.push({
    part: 'bass',
    step: landing,
    note: nearest(tonic.chord.helix.heights[0]!, low),
    length: held - landing,
  });

  let previous = from.comp;
  for (const [chord, step, length] of [
    [dominant, 0, landing],
    [tonic, landing, held - landing],
  ] as const) {
    const voiced = (previous = voicing(chord.chord, previous));
    for (const note of voiced) notes.push({ part: 'pad', step, note, length });
  }

  // The lead sings the second degree over the dominant and resolves to the tonic.
  const second = nearestInLead(heightOf(scale, 1), from.lead.last);
  notes.push({ part: 'lead', step: 0, note: second, length: landing });
  notes.push({
    part: 'lead',
    step: landing,
    note: nearestInLead(scale.heights[0]!, second),
    length: held - landing,
  });
  return notes.sort((a, b) => a.step - b.step || a.note - b.note);
}

function hit(step: number, note: number, role: NonNullable<WrittenNote['role']>): WrittenNote {
  return { part: 'drums', role, step, note, length: 1 };
}

/** One click of the count-in: when it sounds, its beat in the bar, and its weight. */
export interface CountInClick {
  readonly seconds: number;
  /** The beat of the count-in's bar, from 0. */
  readonly beat: number;
  readonly weight: Weight;
}

/** How long the count-in lasts: one bar, of the song's opening meter, at the tempo the song opens at. */
export function countInSeconds(track: StyleTrack, meter: Meter = SONG_METER): number {
  return stepsOf(meter) * stepSeconds(valueAt('bpm', track.bpm, 0));
}

/**
 * The clicks of the count-in for a song starting at `start`: one on each
 * beat of the bar before it, at the tempo the song opens at, the first on
 * the downbeat's weight and the rest on the pulse's.
 */
export function countIn(
  track: StyleTrack,
  start: number,
  meter: Meter = SONG_METER,
): CountInClick[] {
  const step = stepSeconds(valueAt('bpm', track.bpm, 0));
  const from = start - countInSeconds(track, meter);
  const pulses = meterOnSteps(meter).heights;
  return pulses.map((pulse, beat) => ({
    seconds: from + pulse * step,
    beat,
    weight: beat === 0 ? 'downbeat' : 'pulse',
  }));
}
