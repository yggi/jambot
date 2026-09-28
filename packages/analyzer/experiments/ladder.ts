/**
 * The parser's own mini-ratchet (docs/ratchet.md, "the same shape at every
 * level"): a curriculum of MIDI the engine itself generates, at rising
 * complexity, each rung a claim the parser must recover exactly before the
 * next rung is attempted (Q10, `docs/quinetic.md`). Once every rung here is
 * measured, an external corpus (POP909, Groove MIDI, ASAP, Lakh, …)
 * disturbs the loop with content nothing in this repository wrote.
 *
 * Rung 0: a metronome on 4/4. The rest — a scale, a real melody, rhythmic
 * patterns, multiple voices, imitative polyphony — are #141's continuation,
 * one generator at a time as the parser's later stages land.
 */
import { DRUM_NOTES, metronome, subdivisionSeconds, type MetronomeEnv } from '@jambot/engine';
import { METERS } from '@jambot/theory';
import type { RawMidi } from '../src/load.ts';
import { ticksTimeMap } from '../src/tempo.ts';
import type { RawNote } from '../src/tracks.ts';

const DEFAULT_PPQ = 480;
const DOWNBEAT_VELOCITY = 110;
const BEAT_VELOCITY = 90;

/**
 * Rung 0: the engine's own metronome, beats only (not its eighth-note
 * subdivisions), on one drum voice, for `bars` bars of 4/4 at `bpm`. The
 * downbeat and the other beats keep the metronome's own distinction in
 * velocity, not pitch, so the track stays a single monophonic voice.
 */
export function metronomeRung(bpm: number, bars: number, ppq: number = DEFAULT_PPQ): RawMidi {
  const meter = METERS['4/4'];
  const env: MetronomeEnv = { start: 0, pulsesPerMinute: bpm, meter };
  const subdivision = subdivisionSeconds(bpm, meter);
  const beatCount = bars * 4;
  // Half a subdivision past the last bar's end, so a boundary click that
  // floating-point rounding places a hair early is still asked for; the
  // `slice` below is what actually bounds the count, not this `until`.
  const until = bars * subdivision * meter.cycle + subdivision / 2;
  const { output } = metronome.advance(env, null, { now: 0, until });
  const toTicks = ticksTimeMap(ppq, [{ ticks: 0, bpm }]).written;

  const notes: RawNote[] = output.clicks
    .filter((click) => click.weight !== 'subdivision')
    .slice(0, beatCount)
    .map((click) => ({
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
