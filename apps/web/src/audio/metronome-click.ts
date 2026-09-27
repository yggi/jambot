/**
 * The metronome's click: a short oscillator burst per weight, so the ear
 * tells the bar's downbeat from its other pulses, and either from the
 * subdivisions between them (`@jambot/theory`'s `meterWeights`). Built the
 * same way the drum kit is (`drums.ts`): an oscillator through a percussive
 * envelope, no sample.
 */

import type { Weight } from '@jambot/theory';

export interface ClickVoice {
  /** Strike a click of the given weight at a time on the context's clock, at a gain from 0 to 1. */
  play(weight: Weight, seconds: number, gain: number): void;
}

/** Oscillator type, frequency and decay by weight: distinct enough to tell apart by ear. */
const CLICKS: Record<Weight, { type: OscillatorType; frequency: number; decay: number }> = {
  downbeat: { type: 'square', frequency: 1800, decay: 0.05 },
  pulse: { type: 'triangle', frequency: 1200, decay: 0.04 },
  subdivision: { type: 'sine', frequency: 800, decay: 0.02 },
};

export function clickVoice(ctx: BaseAudioContext, out: AudioNode): ClickVoice {
  return {
    play(weight, t, gain) {
      const { type, frequency, decay } = CLICKS[weight];
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, t);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.001);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(amp).connect(out);
      osc.start(t);
      osc.stop(t + decay + 0.01);
    },
  };
}

/** The clock the metronome's own clicks play on: its own audio context, independent of the band's. */
export interface ClickOutput {
  readonly currentTime: number;
  readonly latency: number;
  resume(): Promise<void>;
  readonly click: ClickVoice;
}

export function webAudioClick(): ClickOutput {
  const ctx = new AudioContext();
  const click = clickVoice(ctx, ctx.destination);
  return {
    get currentTime() {
      return ctx.currentTime;
    },
    get latency() {
      return ctx.outputLatency || ctx.baseLatency || 0;
    },
    resume: () => ctx.resume(),
    click,
  };
}
