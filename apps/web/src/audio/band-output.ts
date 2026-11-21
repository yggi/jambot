/**
 * The band's output: the built-in synth, MIDI out, or both at once.
 *
 * The synth's audio clock is always the master clock, whether or not the
 * synth itself is heard: MIDI timestamps ride on it through `clockOffset`,
 * so the synth playing a part or not (`internal`, the setup's built-in
 * column: `synthPlays`) never disturbs MIDI timing.
 * `settings` is read live and may change while playing: a new port or
 * channel mapping silences what the old one held before adopting it.
 *
 * MIDI goes to every output of the setup in use (`midi/patch.ts`,
 * `bandRoutes`), each its own webmidi `MidiOut` and `ClockOut`, with its own
 * port, channels, drum notes, clock and latency: the patch matrix sends a
 * part to any crossing of its row. An output that leaves the setup is
 * silenced and let go. Its notes are webmidi's `OutNote`s (a part's channel on
 * the output, the drums through the device's map), its clock `ClockTicks`.
 *
 * The clock offset can be shared with whatever reads human input
 * (MIDI in, the keyboards): its `fromDeviceMs` is `toDeviceMs`'s
 * inverse, turning a note's `performance.now()` timestamp back into a
 * moment on this same output's clock. It reads the clocks once a tick, and
 * the moment heard it gives (`heard`) is the one the whole device reads.
 */

import { LOOKAHEAD, PARTS, type Part, type ScheduledStep } from '@jambot/engine';
import {
  type ClockOffset,
  type ClockTicks,
  type MidiPort,
  ClockOut,
  MidiOut,
  clockOffset,
} from '@yggi/webmidi/core';
import { channelsOfPart } from '../midi/channels.ts';
import { drumMapOf } from '../midi/drums.ts';
import type { BandRoute } from '../midi/patch.ts';
import { type Output, webAudioOutput } from './output.ts';

export interface BandOutputSettings {
  /** Whether the built-in synth plays a part. */
  internal(part: Part): boolean;
  /** Each MIDI output the band sends to, in the setup's order: none sends nowhere. */
  outputs(): readonly BandRoute[];
}

/** Settings that play only the built-in synth: MIDI out stays off until told otherwise. */
export function internalOnly(): BandOutputSettings {
  return { internal: () => true, outputs: () => [] };
}

/**
 * How long, in seconds, notes already sent ahead may sound on after a stop:
 * the lookahead they were sent within, and 0.4 s more. Each is released at
 * its own end, but no later than this, which is what the band's output let
 * ring before it played through webmidi (a deferred All notes off at this
 * moment); `MidiOut.panic`'s tail (yggi/webmidi decision 008) makes it exact
 * note-offs where it was a timer, and a device that ignores All notes off
 * is released all the same.
 */
export const STOP_TAIL = LOOKAHEAD + 0.4;

/** What one output keeps: webmidi's notes and clock out on its port, and what the route last said. */
interface Out {
  notes: MidiOut;
  clock: ClockOut;
  port: MidiPort | null;
  channels: BandRoute['channels'];
  clockOn: boolean;
  /** The audio clock to this output's timestamps: the device's latency earlier. */
  toDeviceMs: (seconds: number) => number;
}

/** Whether a part is on the same channels in two routes. */
const sameChannels = (a: BandRoute['channels'], b: BandRoute['channels'], part: Part) => {
  const [x, y] = [channelsOfPart(a, part), channelsOfPart(b, part)];
  return x.length === y.length && x.every((c, i) => c === y[i]);
};

/** A transport window's steps as the clock out takes them: 6 ticks to a step, from tick 6 × its index. */
function ticksOf(steps: readonly ScheduledStep[]): ClockTicks | null {
  const first = steps[0];
  if (!first) return null;
  const at = steps.flatMap((s) =>
    Array.from({ length: 6 }, (_, tick) => s.seconds + (tick * s.length) / 6),
  );
  return { first: first.step * 6, at, before: at[0]! - first.length / 6 };
}

export function bandOutput(
  settings: BandOutputSettings,
  base: Output = webAudioOutput(),
  offset: ClockOffset = clockOffset(base),
): Output {
  /** An `Out` per output, by its key in the setup, in the setup's order. */
  let outs = new Map<string, Out>();

  /** Adopt the outputs as the settings say now: each one's port, channels, drum notes, clock and latency. */
  function adopt() {
    const at = base.currentTime;
    const next = new Map<string, Out>();
    for (const route of settings.outputs()) {
      if (next.has(route.key)) continue;
      const out: Out = outs.get(route.key) ?? {
        notes: new MidiOut(null),
        clock: new ClockOut(null),
        port: null,
        channels: route.channels,
        clockOn: false,
        toDeviceMs: offset.toDeviceMs,
      };
      const { latency } = route;
      out.toDeviceMs = (seconds) => Math.max(0, offset.toDeviceMs(seconds) - latency);
      // (a new drum map takes the next note; nothing sounding was addressed wrongly)
      out.notes.setOptions(
        { drums: drumMapOf(route.drumNotes), bendRange: 2, rotate: null },
        at,
        out.toDeviceMs,
      );
      // (the channels it leaves are silenced first)
      if (!PARTS.every((part) => sameChannels(out.channels, route.channels, part)))
        out.notes.panic(at, out.toDeviceMs);
      out.channels = route.channels;
      if (out.clockOn && !route.clock) out.clock.stop(at, out.toDeviceMs);
      out.clockOn = route.clock;
      if (route.port !== out.port) {
        out.clock.stop(at, out.toDeviceMs);
        out.notes.setPort(route.port, at, out.toDeviceMs);
        out.clock = new ClockOut(route.port);
        out.port = route.port;
      }
      next.set(route.key, out);
    }
    for (const [key, out] of outs)
      if (!next.has(key)) {
        out.clock.stop(at, out.toDeviceMs);
        out.notes.setPort(null, at, out.toDeviceMs);
      }
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
      if (settings.internal(part)) base.play(part, note, velocity, seconds, duration, timbre);
      for (const out of outs.values()) {
        // (a part not routed to an output sends it nothing; on several channels it plays on each, ascending, at one moment)
        for (const channel of channelsOfPart(out.channels, part))
          out.notes.play(
            { at: seconds, duration, note, velocity, channel, drum: part === 'drums' },
            out.toDeviceMs,
          );
      }
    },
    // The click is this device's own: the built-in synth, whatever `internal` says, never MIDI.
    click: (weight, seconds, gain) => base.click?.(weight, seconds, gain),
    silence() {
      base.silence();
      const now = base.currentTime;
      // Stop lands just after the last tick sent, and no tick follows it; the notes sent ahead
      // sound on to their ends within `STOP_TAIL`, each released exactly.
      for (const out of outs.values()) {
        out.clock.stop(now, out.toDeviceMs);
        out.notes.panic(now, out.toDeviceMs, { tail: STOP_TAIL });
      }
    },
    // The panic button: what was sent is released at once, then every channel is swept (All notes
    // off, All sound off, sustain off), since a note may be sounding that this never sent (a
    // reload, a replug). All sixteen: a note stuck on a channel the setup has since left is no
    // less stuck.
    panic() {
      for (const out of outs.values()) {
        out.notes.panic(base.currentTime, out.toDeviceMs);
        out.notes.sweep(base.currentTime, out.toDeviceMs);
      }
    },
    // Start goes with the first tick, 2 ms before it (`ClockOut`): nothing to do here.
    starting() {},
    tick(steps) {
      offset.update();
      const ticks = ticksOf(steps);
      for (const out of outs.values()) {
        out.notes.advance(base.currentTime + LOOKAHEAD, out.toDeviceMs);
        if (out.clockOn) out.clock.play(ticks, out.toDeviceMs);
      }
    },
  };
}
