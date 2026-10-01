/**
 * The parser's own mini-ratchet (docs/ratchet.md, "the same shape at every
 * level"): a curriculum of MIDI the engine itself generates, at rising
 * complexity, each rung a claim the parser must recover exactly before the
 * next rung is attempted (Q10, `docs/quinetic.md`). Once every rung here is
 * measured, an external corpus (POP909, Groove MIDI, ASAP, Lakh, …)
 * disturbs the loop with content nothing in this repository wrote.
 *
 * Rung 0: a metronome on 4/4. Rung 1: a scale up and down. The rest — a
 * real melody, rhythmic patterns, multiple voices, imitative polyphony — are
 * #141's continuation, one generator at a time as the parser's later stages
 * land.
 */
import { BAR_STEPS, DRUM_NOTES, clicksOf, stepSeconds } from '@jambot/engine';
import { type Helix, even, heightOf } from '@jambot/theory';
import type { RawMidi } from '../src/load.ts';
import { ticksTimeMap } from '../src/tempo.ts';
import type { RawNote } from '../src/tracks.ts';

const DEFAULT_PPQ = 480;
const STEPS_PER_QUARTER = 4;
const DOWNBEAT_VELOCITY = 110;
const BEAT_VELOCITY = 90;

/**
 * Rung 0: the engine's own metronome, read over the steps of a straight
 * transport, its pulses only (`clicksOf`'s default), on one drum voice,
 * for `bars` bars of 4/4 at `bpm`. The
 * downbeat and the other beats keep the metronome's own distinction in
 * velocity, not pitch, so the track stays a single monophonic voice.
 */
export function metronomeRung(bpm: number, bars: number, ppq: number = DEFAULT_PPQ): RawMidi {
  const length = stepSeconds(bpm);
  const steps = Array.from({ length: bars * BAR_STEPS }, (_, step) => ({
    step,
    seconds: step * length,
    length,
    swing: 0,
    pulse: { start: step - (step % 4), length: 4 },
  }));
  const toTicks = ticksTimeMap(ppq, [{ ticks: 0, bpm }]).written;

  const notes: RawNote[] = clicksOf(steps).map((click) => ({
    midi: DRUM_NOTES.kick,
    ticks: Math.round(toTicks(click.seconds)),
    durationTicks: Math.max(1, Math.round(ppq / 8)),
    velocity: click.weight === 'downbeat' ? DOWNBEAT_VELOCITY : BEAT_VELOCITY,
  }));

  return {
    ppq,
    tempos: [{ ticks: 0, bpm }],
    timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
    tracks: [{ channel: 9, notes }],
  };
}

/** The quarter notes of a 4/4 bar on its 16 steps: beat i at step 4i. */
const BEATS = even(4, 16);

const SCALE_VELOCITY = 90;

/**
 * Rung 1: a scale up one turn and back, a quarter note each, the top held
 * twice, so a scale of seven fills 4 bars. One index reads both towers
 * (#157): note i sounds on beat i (`BEATS`) at degree i of `scale`, then the
 * same degrees come back down. The helix's heights are MIDI notes, so its
 * degree 0 sets the register. One monophonic track on channel 1, each note
 * held to the next.
 */
export function scaleRung(scale: Helix, bpm: number, ppq: number = DEFAULT_PPQ): RawMidi {
  const degrees = Array.from({ length: scale.heights.length + 1 }, (_, d) => d);
  const line = [...degrees, ...degrees.toReversed()];
  const notes: RawNote[] = line.map((degree, i) => ({
    midi: heightOf(scale, degree),
    ticks: (heightOf(BEATS, i) * ppq) / STEPS_PER_QUARTER,
    durationTicks: ppq,
    velocity: SCALE_VELOCITY,
  }));

  return {
    ppq,
    tempos: [{ ticks: 0, bpm }],
    timeSignatures: [{ ticks: 0, numerator: 4, denominator: 4 }],
    tracks: [{ channel: 0, notes }],
  };
}
