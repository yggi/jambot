/**
 * Where the band sounds: an audio clock, the drum kit, and a way to silence
 * what is already scheduled. The player needs only this, so a test can
 * stand in for Web Audio.
 */

import { drumKit } from './drums.ts';

export interface Output {
  /** The clock events are scheduled on, in seconds. */
  readonly currentTime: number;
  /** How far behind `currentTime` the speakers are, in seconds. */
  readonly latency: number;
  /** Let the clock run: a browser starts audio only after a gesture. */
  resume(): Promise<void>;
  /** Strike a General MIDI drum note at a time on the clock. */
  play(note: number, velocity: number, seconds: number): void;
  /** Fade out everything scheduled so far, and play on afresh. */
  silence(): void;
}

/** The built-in synth on Web Audio: the drum kit through a compressor. */
export function webAudioOutput(): Output {
  const ctx = new AudioContext();
  const out = ctx.createDynamicsCompressor();
  out.connect(ctx.destination);
  const openBus = () => {
    const bus = ctx.createGain();
    bus.gain.value = 0.8;
    bus.connect(out);
    return { bus, kit: drumKit(ctx, bus) };
  };
  let current = openBus();
  return {
    get currentTime() {
      return ctx.currentTime;
    },
    get latency() {
      return ctx.outputLatency || ctx.baseLatency || 0;
    },
    resume: () => ctx.resume(),
    play: (note, velocity, seconds) => current.kit.play(note, velocity, seconds),
    silence() {
      const old = current.bus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      setTimeout(() => old.disconnect(), 400);
      current = openBus();
    },
  };
}
