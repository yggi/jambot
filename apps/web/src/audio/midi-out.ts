/**
 * MIDI out: turns a part's timed notes into channel messages on a MIDI
 * port, one channel per part.
 *
 * A note-off is answered by the decision its note-on got, never by what
 * else is sounding at release (play-aeiou's rule, ported for #5): the pad
 * and the stab default to the same channel and often share a pitch, and a
 * stab hitting a pad's note must not cut the pad short. A note already held
 * on its channel and pitch retriggers, off then on, rather than merging;
 * a note-off reaches the port only once its last holder's own end arrives
 * with nothing else still covering it. Because the transport hands events
 * to `play` in non-decreasing start order, `advance(horizon)` can decide
 * every release whose end has passed that horizon using only intervals
 * already known, without waiting on a message it cannot take back.
 */

import type { Part } from '@jambot/engine';
import { LOOKAHEAD, PARTS } from '@jambot/engine';

/** The minimum a real `MIDIOutput` gives; a fake stands in for it in tests. */
export interface MidiPort {
  send(data: readonly number[], timestamp?: number): void;
}

/** One channel per part (L6): the pad and the stab default to the same one. */
export type Channels = Readonly<Record<Part, number>>;

export const DEFAULT_CHANNELS: Channels = { lead: 1, bass: 2, pad: 3, stab: 3, drums: 10 };

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const CONTROL_CHANGE = 0xb0;
const ALL_NOTES_OFF = 123;
const CLOCK = 0xf8;
const START = 0xfa;
const STOP = 0xfc;

/** A 1–16 MIDI channel to its 0–15 status-byte nibble, wrapping rather than throwing. */
export const nibble = (channel: number) => (channel - 1) & 15;

const channelsEqual = (a: Channels, b: Channels) => PARTS.every((part) => a[part] === b[part]);

interface Holder {
  readonly start: number;
  readonly end: number;
}

const holderKey = (channel: number, note: number) => `${channel}:${note}`;

export class MidiOut {
  #port: MidiPort | null = null;
  #channels: Channels;
  #clock: boolean;
  /** Notes currently held, by channel and pitch, not yet resolved as released. */
  #open = new Map<string, Holder[]>();

  constructor(channels: Channels = DEFAULT_CHANNELS, clock = false) {
    this.#channels = channels;
    this.#clock = clock;
  }

  setClock(clock: boolean) {
    this.#clock = clock;
  }

  /** Adopt a port, silencing whatever the old one held first. */
  setPort(port: MidiPort | null, atSeconds: number, toDeviceMs: (seconds: number) => number) {
    if (port === this.#port) return;
    this.panic(atSeconds, toDeviceMs);
    this.#port = port;
  }

  /** Remap parts to channels, silencing the channels it leaves first. */
  setChannels(channels: Channels, atSeconds: number, toDeviceMs: (seconds: number) => number) {
    if (channelsEqual(channels, this.#channels)) return;
    this.panic(atSeconds, toDeviceMs);
    this.#channels = channels;
  }

  /**
   * All notes off on every channel in use, and forget what's held: a manual
   * panic, or the app's own recovery from a suspended tab or a dropped
   * connection, where notes already sent may never get the release a
   * frozen clock never scheduled.
   */
  panic(atSeconds: number, toDeviceMs: (seconds: number) => number) {
    this.#allNotesOff(atSeconds, toDeviceMs);
    this.#open.clear();
  }

  /**
   * Schedule a note at `seconds` for `duration` seconds, on its part's
   * channel. Its release is decided later, by `advance`.
   */
  play(
    part: Part,
    note: number,
    velocity: number,
    seconds: number,
    duration: number,
    toDeviceMs: (seconds: number) => number,
  ) {
    if (!this.#port) return;
    const channel = nibble(this.#channels[part]);
    const key = holderKey(channel, note);
    const holders = this.#open.get(key) ?? [];
    const held = holders.some((h) => h.start <= seconds && seconds < h.end);
    if (held) this.#send([NOTE_OFF | channel, note, 0], seconds, toDeviceMs);
    this.#send([NOTE_ON | channel, note, velocity], seconds, toDeviceMs);
    this.#open.set(key, [...holders, { start: seconds, end: seconds + duration }]);
  }

  /**
   * Release every note whose end is at or before `horizon`, unless another
   * holder on its channel and pitch still covers the moment it ends.
   */
  advance(horizon: number, toDeviceMs: (seconds: number) => number) {
    if (!this.#port) return;
    for (const [key, holders] of this.#open) {
      const due = holders.filter((h) => h.end <= horizon);
      if (due.length === 0) continue;
      const [channel, note] = key.split(':').map(Number) as [number, number];
      for (const h of due) {
        const stillHeld = holders.some((o) => o !== h && o.start <= h.end && h.end < o.end);
        if (!stillHeld) this.#send([NOTE_OFF | channel, note, 0], h.end, toDeviceMs);
      }
      const remaining = holders.filter((h) => h.end > horizon);
      if (remaining.length) this.#open.set(key, remaining);
      else this.#open.delete(key);
    }
  }

  /** One 24-ppqn clock tick, only while the clock is on. */
  clockTick(seconds: number, toDeviceMs: (seconds: number) => number) {
    if (!this.#clock) return;
    this.#send([CLOCK], seconds, toDeviceMs);
  }

  /** MIDI Start, just before the first step, only while the clock is on. */
  start(atSeconds: number, toDeviceMs: (seconds: number) => number) {
    if (!this.#clock) return;
    this.#send([START], atSeconds - 0.002, toDeviceMs);
  }

  /**
   * MIDI Stop, then all notes off past the lookahead, so whatever is still
   * scheduled has sounded first.
   */
  stop(atSeconds: number, toDeviceMs: (seconds: number) => number) {
    if (this.#clock) this.#send([STOP], atSeconds, toDeviceMs);
    this.panic(atSeconds + LOOKAHEAD + 0.4, toDeviceMs);
  }

  #allNotesOff(atSeconds: number, toDeviceMs: (seconds: number) => number) {
    const channels = new Set(Object.values(this.#channels).map(nibble));
    for (const channel of channels)
      this.#send([CONTROL_CHANGE | channel, ALL_NOTES_OFF, 0], atSeconds, toDeviceMs);
  }

  #send(data: readonly number[], seconds: number, toDeviceMs: (seconds: number) => number) {
    if (!this.#port) return;
    try {
      this.#port.send(data, Math.max(0, toDeviceMs(seconds)));
    } catch {
      // A port can vanish mid-send (unplugged, revoked); nothing to do about it.
    }
  }
}
