/**
 * The band's output: the built-in synth, MIDI out, or both at once.
 *
 * The synth's audio clock is always the master clock, whether or not the
 * synth itself is heard: MIDI timestamps ride on it through `clockOffset`,
 * so turning the synth off (`internal`) never disturbs MIDI timing.
 * `settings` is read live and may change while playing: a new port or
 * channel mapping silences what the old one held before adopting it.
 *
 * MIDI goes to every output of the setup in use (`midi/patch.ts`,
 * `bandRoutes`), each its own `MidiOut`, with its own port, channels, drum
 * notes, clock and latency: the patch matrix sends a part to any crossing of
 * its row. An output that leaves the setup is silenced and let go.
 *
 * The clock offset can be shared with whatever reads human input
 * (MIDI in, the keyboards): its `fromDeviceMs` is `toDeviceMs`'s
 * inverse, turning a note's `performance.now()` timestamp back into a
 * moment on this same output's clock. It reads the clocks once a tick, and
 * the moment heard it gives (`heard`) is the one the whole device reads.
 */

import { LOOKAHEAD } from '@jambot/engine';
import { type ClockOffset, clockOffset } from '@yggi/webmidi/core';
import type { BandRoute } from '../midi/patch.ts';
import { MidiOut } from './midi-out.ts';
import { type Output, webAudioOutput } from './output.ts';

export interface BandOutputSettings {
  /** Whether the built-in synth is heard. */
  internal(): boolean;
  /** Each MIDI output the band sends to, in the setup's order: none sends nowhere. */
  outputs(): readonly BandRoute[];
}

/** Settings that play only the built-in synth: MIDI out stays off until told otherwise. */
export function internalOnly(): BandOutputSettings {
  return { internal: () => true, outputs: () => [] };
}

export function bandOutput(
  settings: BandOutputSettings,
  base: Output = webAudioOutput(),
  offset: ClockOffset = clockOffset(base),
): Output {
  /** A `MidiOut` per output, by its key in the setup, in the setup's order. */
  let outs = new Map<string, MidiOut>();

  /** Adopt the outputs as the settings say now: each one's port, channels, drum notes, clock and latency. */
  function adopt() {
    const at = base.currentTime;
    const next = new Map<string, MidiOut>();
    for (const route of settings.outputs()) {
      if (next.has(route.key)) continue;
      const midi = outs.get(route.key) ?? new MidiOut(route.channels, route.clock, route.drumNotes);
      midi.setClock(route.clock);
      midi.setChannels(route.channels, at, offset.toDeviceMs);
      midi.setDrumNotes(route.drumNotes);
      midi.setLatency(route.latency);
      midi.setPort(route.port, at, offset.toDeviceMs);
      next.set(route.key, midi);
    }
    for (const [key, midi] of outs) if (!next.has(key)) midi.setPort(null, at, offset.toDeviceMs);
    outs = next;
  }

  return {
    get currentTime() {
      adopt();
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
      for (const midi of outs.values())
        midi.play(part, note, velocity, seconds, duration, offset.toDeviceMs);
    },
    // The click is this device's own: the built-in synth, whatever `internal` says, never MIDI.
    click: (weight, seconds, gain) => base.click?.(weight, seconds, gain),
    silence() {
      base.silence();
      for (const midi of outs.values()) midi.stop(base.currentTime, offset.toDeviceMs);
    },
    panic() {
      for (const midi of outs.values()) midi.panic(base.currentTime, offset.toDeviceMs);
    },
    starting(seconds) {
      for (const midi of outs.values()) midi.start(seconds, offset.toDeviceMs);
    },
    tick(steps) {
      offset.update();
      for (const midi of outs.values()) {
        midi.advance(base.currentTime + LOOKAHEAD, offset.toDeviceMs);
        for (const step of steps)
          for (let tick = 0; tick < 6; tick++)
            midi.clockTick(step.seconds + (tick * step.length) / 6, offset.toDeviceMs);
      }
    },
  };
}
