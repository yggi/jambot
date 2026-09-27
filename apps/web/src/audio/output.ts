/**
 * Where the band sounds: an audio clock, the drum kit and the pitched
 * voices, and a way to silence what is already scheduled. The player needs only this, so a test can
 * stand in for Web Audio.
 */

import type { Part, ScheduledStep, Sound } from '@jambot/engine';
import { drumKit } from './drums.ts';
import { voices } from './voices.ts';

export interface Output {
  /** The clock events are scheduled on, in seconds. */
  readonly currentTime: number;
  /** How far behind `currentTime` the speakers are, in seconds. */
  readonly latency: number;
  /** Let the clock run: a browser starts audio only after a gesture. */
  resume(): Promise<void>;
  /**
   * Play a part's note at a time on the clock, for a duration in seconds,
   * as its bar sounds. The drums play General MIDI drum notes.
   */
  play(
    part: Part,
    note: number,
    velocity: number,
    seconds: number,
    duration: number,
    sound: Sound,
  ): void;
  /** Fade out everything scheduled so far, and play on afresh. */
  silence(): void;
  /** A precise pairing of the clock and `performance.now()`, where the platform gives one. */
  outputTimestamp?():
    { readonly contextTime: number; readonly performanceTime: number } | undefined;
  /** Playback's start time, once known, before the first step plays. */
  starting?(seconds: number): void;
  /** The steps scheduled this tick, for anything that needs the grid rather than single notes. */
  tick?(steps: readonly ScheduledStep[]): void;
}

/** The built-in synth on Web Audio: the drum kit and the voices through a compressor. */
export function webAudioOutput(): Output {
  const ctx = new AudioContext();
  const out = ctx.createDynamicsCompressor();
  out.connect(ctx.destination);
  const openBus = () => {
    const bus = ctx.createGain();
    bus.gain.value = 0.8;
    bus.connect(out);
    return { bus, kit: drumKit(ctx, bus), voices: voices(ctx, bus) };
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
    play(part, note, velocity, seconds, duration, sound) {
      if (part === 'drums') current.kit.play(note, velocity, seconds);
      else current.voices.play(part, note, velocity, seconds, duration, sound);
    },
    silence() {
      const old = current.bus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      setTimeout(() => old.disconnect(), 400);
      current = openBus();
    },
    outputTimestamp() {
      const ts = ctx.getOutputTimestamp?.();
      return ts && ts.contextTime !== undefined && ts.performanceTime !== undefined
        ? { contextTime: ts.contextTime, performanceTime: ts.performanceTime }
        : undefined;
    },
  };
}
