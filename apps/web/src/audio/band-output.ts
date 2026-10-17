/**
 * The band's output: the built-in synth, MIDI out, or both at once.
 *
 * The synth's audio clock is always the master clock, whether or not the
 * synth itself is heard: MIDI timestamps ride on it through `clockOffset`,
 * so turning the synth off (`internal`) never disturbs MIDI timing.
 * `settings` is read live and may change while playing: a new port or
 * channel mapping silences what the old one held before adopting it.
 *
 * The clock offset can be shared with whatever reads human input
 * (MIDI in, the keyboards): its `fromDeviceMs` is `toDeviceMs`'s
 * inverse, turning a note's `performance.now()` timestamp back into a
 * moment on this same output's clock. It reads the clocks once a tick, and
 * the moment heard it gives (`heard`) is the one the whole device reads.
 */

import { LOOKAHEAD } from '@jambot/engine';
import { type ClockOffset, clockOffset } from '@yggi/webmidi/core';
import {
  DEFAULT_CHANNELS,
  DEFAULT_DRUM_NOTES,
  MidiOut,
  type Channels,
  type DrumNotes,
  type MidiPort,
} from './midi-out.ts';
import { type Output, webAudioOutput } from './output.ts';

export interface BandOutputSettings {
  /** Whether the built-in synth is heard. */
  internal(): boolean;
  /** The MIDI port to send to, or null to send nowhere. */
  port(): MidiPort | null;
  channels(): Channels;
  /** Which output note each drum sound sends: GM by default (#102). */
  drumNotes(): DrumNotes;
  /** Whether MIDI clock, start and stop are sent. */
  clock(): boolean;
}

/** Settings that play only the built-in synth: MIDI out stays off until told otherwise. */
export function internalOnly(): BandOutputSettings {
  return {
    internal: () => true,
    port: () => null,
    channels: () => DEFAULT_CHANNELS,
    drumNotes: () => DEFAULT_DRUM_NOTES,
    clock: () => false,
  };
}

export function bandOutput(
  settings: BandOutputSettings,
  base: Output = webAudioOutput(),
  offset: ClockOffset = clockOffset(base),
): Output {
  const midi = new MidiOut(settings.channels(), settings.clock(), settings.drumNotes());

  return {
    get currentTime() {
      midi.setClock(settings.clock());
      midi.setChannels(settings.channels(), base.currentTime, offset.toDeviceMs);
      midi.setDrumNotes(settings.drumNotes());
      midi.setPort(settings.port(), base.currentTime, offset.toDeviceMs);
      return base.currentTime;
    },
    get latency() {
      return base.latency;
    },
    heard: () => offset.heard(),
    resume: () => base.resume(),
    level: (gain, seconds) => base.level?.(gain, seconds),
    play(part, note, velocity, seconds, duration, timbre) {
      if (settings.internal()) base.play(part, note, velocity, seconds, duration, timbre);
      midi.play(part, note, velocity, seconds, duration, offset.toDeviceMs);
    },
    // The click is this device's own: the built-in synth, whatever `internal` says, never MIDI.
    click: (weight, seconds, gain) => base.click?.(weight, seconds, gain),
    silence() {
      base.silence();
      midi.stop(base.currentTime, offset.toDeviceMs);
    },
    panic() {
      midi.panic(base.currentTime, offset.toDeviceMs);
    },
    starting(seconds) {
      midi.start(seconds, offset.toDeviceMs);
    },
    tick(steps) {
      offset.update();
      midi.advance(base.currentTime + LOOKAHEAD, offset.toDeviceMs);
      for (const step of steps)
        for (let tick = 0; tick < 6; tick++)
          midi.clockTick(step.seconds + (tick * step.length) / 6, offset.toDeviceMs);
    },
  };
}
