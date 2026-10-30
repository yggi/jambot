/**
 * The built-in synth's pitched voices, coloured by a performer's own timbre
 * (`timbreOf` in the engine): the bass a filtered saw and triangle, the
 * chords (the pad and the stab alike) a triangle beside a slightly detuned
 * sine, the lead a filtered square and triangle. Each note is held for its
 * duration, then released. These are the prototype's voices.
 *
 * A note whose cells voice has a sound of its own (`timbre.sound`, a text's
 * `&leadV s=square lpf=2400 env=…`) plays that instead (`playSound`): its
 * waveform through its filters, on its envelope, bent as it bends, at its
 * part's level. That is the shortcut until cells' renderer plays a client's
 * rig (yggi/cells decision 063).
 */

import type { Part, Timbre, VoiceSound } from '@jambot/engine';

export interface Voices {
  /** Play a pitched part's note at a time on the context's clock, for a duration in seconds. */
  play(
    part: Exclude<Part, 'drums'>,
    note: number,
    velocity: number,
    seconds: number,
    duration: number,
    timbre: Timbre,
  ): void;
}

const frequencyOf = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

/** Each pitched part's peak level at full velocity, as its own voice plays it, so a sound of its own sits where it did in the mix. */
export const PEAK: Readonly<Record<Exclude<Part, 'drums'>, number>> = {
  bass: 0.28,
  pad: 0.05,
  stab: 0.05,
  lead: 0.07,
};

/** The envelope of a sound that states none: a short attack, held, a short release. */
const PLAIN = { attack: 0.005, decay: 0, sustain: 1, release: 0.05 };

/**
 * A note in a voice's own sound (`VoiceSound`): its waveform through its
 * low-pass, then its high-pass, where it has them, up to `peak` over the attack,
 * down to the sustain over the decay, held through `duration`, then
 * released; its bends on the oscillator's detune.
 */
export function playSound(
  ctx: BaseAudioContext,
  out: AudioNode,
  sound: VoiceSound,
  frequency: number,
  peak: number,
  t: number,
  duration: number,
) {
  const { attack, decay, sustain, release } = sound.env ?? PLAIN;
  const gain = ctx.createGain();
  gain.connect(out);
  let into: AudioNode = gain;
  for (const [type, cutoff, q] of [
    ['highpass', sound.hpf, sound.hpq],
    ['lowpass', sound.lpf, sound.lpq],
  ] as const) {
    if (cutoff === undefined) continue;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = cutoff;
    filter.Q.value = q ?? 1;
    filter.connect(into);
    into = filter;
  }
  const held = t + Math.max(duration, attack);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  if (duration > attack) {
    gain.gain.linearRampToValueAtTime(peak * sustain, Math.min(held, t + attack + decay));
    gain.gain.setValueAtTime(peak * sustain, held);
  }
  gain.gain.linearRampToValueAtTime(0, held + release);
  const osc = ctx.createOscillator();
  osc.type = sound.wave;
  osc.frequency.value = frequency;
  for (const b of sound.bends ?? []) osc.detune.setValueAtTime(b.cents, t + b.at);
  osc.connect(into);
  osc.start(t);
  osc.stop(held + release + 0.05);
}

export function voices(ctx: BaseAudioContext, out: AudioNode): Voices {
  /** Up to `peak` in `attack`, held through `duration`, released over `release`. */
  const hold = (
    gain: GainNode,
    t: number,
    duration: number,
    peak: number,
    attack: number,
    release: number,
  ) => {
    const end = t + Math.max(attack, duration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.setValueAtTime(peak, end);
    gain.gain.linearRampToValueAtTime(0, end + release);
  };
  /** An oscillator at a note, mixed in at `level`, started at t and stopped at `stop`. */
  const oscillator = (
    type: OscillatorType,
    frequency: number,
    level: number,
    into: AudioNode,
    t: number,
    stop: number,
  ) => {
    const osc = ctx.createOscillator();
    const mix = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    mix.gain.value = level;
    osc.connect(mix).connect(into);
    osc.start(t);
    osc.stop(stop);
  };

  return {
    play(part, note, velocity, t, duration, timbre) {
      const v = velocity / 127;
      if (timbre.sound) {
        playSound(ctx, out, timbre.sound, frequencyOf(note), PEAK[part] * v, t, duration);
        return;
      }
      const gain = ctx.createGain();
      gain.connect(out);
      const frequency = frequencyOf(note);
      if (part === 'bass') {
        const { saw, triangle, cutoff, resonance } = timbre;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = resonance!;
        filter.frequency.setValueAtTime((300 + v * 900) * cutoff!, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + Math.max(0.05, duration));
        filter.connect(gain);
        hold(gain, t, duration, 0.28 * v, 0.005, 0.05);
        oscillator('sawtooth', frequency, saw!, filter, t, t + duration + 0.1);
        oscillator('triangle', frequency, triangle!, filter, t, t + duration + 0.1);
      } else if (part === 'pad' || part === 'stab') {
        const { attack, release } = timbre;
        hold(gain, t, duration, 0.05 * v, attack!, release!);
        const stop = t + duration + release! + 0.05;
        oscillator('triangle', frequency, 1, gain, t, stop);
        oscillator('sine', frequency * 1.003, 1, gain, t, stop);
      } else {
        const { triangle, square, cutoff, attack } = timbre;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cutoff!;
        filter.connect(gain);
        hold(gain, t, duration, 0.07 * v, attack!, 0.08);
        oscillator('square', frequency, square!, filter, t, t + duration + 0.2);
        oscillator('triangle', frequency, triangle!, filter, t, t + duration + 0.2);
      }
    },
  };
}
