/**
 * The built-in synth's pitched voices, coloured by a performer's own timbre
 * (`timbreOf` in the engine): the bass a filtered saw and triangle, the
 * chords (the pad and the stab alike) a triangle beside a slightly detuned
 * sine, the lead a filtered square and triangle. Each note is held for its
 * duration, then released. These are the prototype's voices.
 */

import type { Part, Timbre } from '@jambot/engine';

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

/** A `Timbre` field this part's branch needs: `timbreOf` always fills it for this part. */
const need = (field: number | undefined): number => {
  if (field === undefined) throw new Error('voices: the timbre is missing a field this part needs');
  return field;
};

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
      const gain = ctx.createGain();
      gain.connect(out);
      const frequency = frequencyOf(note);
      if (part === 'bass') {
        const saw = need(timbre.saw);
        const triangle = need(timbre.triangle);
        const cutoff = need(timbre.cutoff);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = need(timbre.resonance);
        filter.frequency.setValueAtTime((300 + v * 900) * cutoff, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + Math.max(0.05, duration));
        filter.connect(gain);
        hold(gain, t, duration, 0.28 * v, 0.005, 0.05);
        oscillator('sawtooth', frequency, saw, filter, t, t + duration + 0.1);
        oscillator('triangle', frequency, triangle, filter, t, t + duration + 0.1);
      } else if (part === 'pad' || part === 'stab') {
        const attack = need(timbre.attack);
        const release = need(timbre.release);
        hold(gain, t, duration, 0.05 * v, attack, release);
        const stop = t + duration + release + 0.05;
        oscillator('triangle', frequency, 1, gain, t, stop);
        oscillator('sine', frequency * 1.003, 1, gain, t, stop);
      } else {
        const triangle = need(timbre.triangle);
        const square = need(timbre.square);
        const cutoff = need(timbre.cutoff);
        const attack = need(timbre.attack);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cutoff;
        filter.connect(gain);
        hold(gain, t, duration, 0.07 * v, attack, 0.08);
        oscillator('square', frequency, square, filter, t, t + duration + 0.2);
        oscillator('triangle', frequency, triangle, filter, t, t + duration + 0.2);
      }
    },
  };
}
