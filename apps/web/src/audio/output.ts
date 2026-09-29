/**
 * Where the band sounds: an audio clock, the drum kit and the pitched
 * voices, and a way to silence what is already scheduled. The player needs only this, so a test can
 * stand in for Web Audio.
 */

import type { Part, ScheduledStep, Timbre } from '@jambot/engine';
import type { Weight } from '@jambot/theory';
import { drumKit } from './drums.ts';
import { clickVoice } from './metronome-click.ts';
import { voices } from './voices.ts';

export interface Output {
  /** The clock events are scheduled on, in seconds. */
  readonly currentTime: number;
  /** How far behind `currentTime` the speakers are, in seconds. */
  readonly latency: number;
  /**
   * The moment heard now, on this clock, where the output estimates it
   * from its pairing with the page's clock (`clockOffset`); without it,
   * `currentTime` less `latency` stands in.
   */
  heard?(): number;
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
    timbre: Timbre,
  ): void;
  /**
   * The level of what plays, from 0 to 1, reached at once or, given
   * seconds, gliding to it. What is played after a `silence` opens at it.
   * Where the output has none, MIDI's volume is the instrument's own.
   */
  level?(gain: number, seconds: number): void;
  /**
   * The metronome's click of a weight at a time on the clock, at a gain from
   * 0 to 1. Only the built-in synth sounds it: never MIDI, so it is heard on
   * this device alone.
   */
  click?(weight: Weight, seconds: number, gain: number): void;
  /** Fade out everything scheduled so far, and play on afresh. */
  silence(): void;
  /** Silence anything MIDI might still be holding, without stopping playback. */
  panic?(): void;
  /** A precise pairing of the clock and `performance.now()`, where the platform gives one. */
  outputTimestamp?():
    { readonly contextTime: number; readonly performanceTime: number } | undefined;
  /** Playback's start time, once known, before the first step plays. */
  starting?(seconds: number): void;
  /** The steps scheduled this tick, for anything that needs the grid rather than single notes. */
  tick?(steps: readonly ScheduledStep[]): void;
}

/** The gain of a bus at full level: headroom under the compressor. */
export const BUS_GAIN = 0.8;

/** The built-in synth on Web Audio: the drum kit and the voices through a compressor. */
export function webAudioOutput(): Output {
  const ctx = new AudioContext();
  const out = ctx.createDynamicsCompressor();
  out.connect(ctx.destination);
  /** The level asked for, from 0 to 1, that each bus opens at. */
  let wanted = 1;
  const openBus = () => {
    const bus = ctx.createGain();
    bus.gain.value = BUS_GAIN * wanted;
    bus.connect(out);
    return { bus, kit: drumKit(ctx, bus), voices: voices(ctx, bus), click: clickVoice(ctx, bus) };
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
    level(gain, seconds) {
      wanted = gain;
      const bus = current.bus.gain;
      if (seconds <= 0) bus.setValueAtTime(BUS_GAIN * gain, ctx.currentTime);
      else bus.setTargetAtTime(BUS_GAIN * gain, ctx.currentTime, seconds / 4);
    },
    play(part, note, velocity, seconds, duration, timbre) {
      if (part === 'drums') current.kit.play(note, velocity, seconds);
      else current.voices.play(part, note, velocity, seconds, duration, timbre);
    },
    click(weight, seconds, gain) {
      current.click.play(weight, seconds, gain);
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
