/**
 * The tone sender (#269): holds one note on a destination, this device's
 * synth or a channel of a MIDI port, for tuning an instrument against: the
 * tuner listens, and reads the sound against the note sent. It is a tool on
 * the tuner's screen and never plays under the band, so it sends its own
 * messages (`MidiOut` is the band's, with its holders and its clock) and
 * plays the synth as the band's lead. A note is held until it is released,
 * moved, or sent elsewhere; one is held at a time.
 */

import { INITIAL_STYLE, type Part, type Timbre, timbreOf } from '@jambot/engine';
import { nibble, type MidiPort } from '../audio/midi-out.ts';
import type { PortOption } from '../midi/access.ts';

/** The destination that is this device's own synth. */
export const SYNTH = 'synth';

/** The MIDI velocity a note is sent at: firm, since a soft note may not sound on every instrument. */
export const VELOCITY = 100;

/** How long, in seconds, a synth note is scheduled to sound: longer than anyone tunes for, and ended by `silence`. */
export const HOLD_SECONDS = 60;

/** How far ahead of the clock, in seconds, a synth note starts, so it is scheduled and not late. */
const AHEAD = 0.02;

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const CONTROL_CHANGE = 0xb0;
const ALL_NOTES_OFF = 123;
const ALL_SOUND_OFF = 120;

/** What of the synth the sender plays: the part of `Output` it needs. */
export interface SynthLike {
  readonly currentTime: number;
  play(
    part: Part,
    note: number,
    velocity: number,
    seconds: number,
    duration: number,
    timbre: Timbre,
  ): void;
  silence(): void;
}

export interface SenderDeps {
  /** The MIDI output ports there are now. */
  ports(): PortOption[];
  /** The port with this id, or null when it is not connected. */
  port(id: string): MidiPort | null;
  /** This device's synth, made when first needed. */
  synth(): SynthLike;
}

export interface Destination {
  id: string;
  name: string;
}

/** The lead's colour at the style the band starts in, so the note sounds as the band's lead does. */
const LEAD = timbreOf('lead', INITIAL_STYLE, 0.5);

export class ToneSender {
  #deps: SenderDeps;
  /** Where the note goes: `SYNTH`, or a port's id. */
  destination = $state(SYNTH);
  /** The MIDI channel, 1 to 16. */
  channel = $state(1);
  /** The MIDI note, 0 to 127, C4 = 60. */
  note = $state(69);
  holding = $state(false);
  /** What the person is told when the note could not be sent. */
  message = $state('');
  /** What is held now, where it is held: the note off goes where the note on went. */
  #held: { destination: string; channel: number; note: number } | null = null;

  constructor(deps: SenderDeps) {
    this.#deps = deps;
  }

  /** This device's synth, then every port. */
  get destinations(): Destination[] {
    return [{ id: SYNTH, name: 'This device’s synth' }, ...this.#deps.ports()];
  }

  /** Sound the note, letting go of any held one first. */
  hold(): void {
    this.release();
    const { destination, channel, note } = this;
    if (destination === SYNTH) {
      const synth = this.#deps.synth();
      synth.play('lead', note, VELOCITY, synth.currentTime + AHEAD, HOLD_SECONDS, LEAD);
    } else {
      const port = this.#deps.port(destination);
      if (!port) {
        this.message = 'That port is not connected. Plug it in, or choose another.';
        return;
      }
      port.send([NOTE_ON | nibble(channel), note, VELOCITY]);
    }
    this.message = '';
    this.#held = { destination, channel, note };
    this.holding = true;
  }

  /** Let the held note go, where it sounds; nothing is sent when none is held. */
  release(): void {
    const held = this.#held;
    if (!held) return;
    this.#held = null;
    this.holding = false;
    if (held.destination === SYNTH) this.#deps.synth().silence();
    else this.#deps.port(held.destination)?.send([NOTE_OFF | nibble(held.channel), held.note, 0]);
  }

  /** Let the note go, and tell the channel to stop everything, for an instrument that has lost track. */
  panic(): void {
    const { destination, channel } = this;
    this.release();
    if (destination === SYNTH) return;
    const port = this.#deps.port(destination);
    port?.send([CONTROL_CHANGE | nibble(channel), ALL_NOTES_OFF, 0]);
    port?.send([CONTROL_CHANGE | nibble(channel), ALL_SOUND_OFF, 0]);
  }

  /** Move the note by semitones, within what MIDI has; a held note follows. */
  move(semitones: number): void {
    this.note = Math.min(127, Math.max(0, this.note + semitones));
    if (this.holding) this.hold();
  }

  /** Send to another destination; a held note is let go where it was. */
  choose(destination: string): void {
    const was = this.holding;
    this.release();
    this.destination = destination;
    if (was) this.hold();
  }

  /** Send on another channel, 1 to 16; a held note is let go on the old one. */
  setChannel(channel: number): void {
    const was = this.holding;
    this.release();
    this.channel = Number.isNaN(channel)
      ? this.channel
      : Math.min(16, Math.max(1, Math.round(channel)));
    if (was) this.hold();
  }
}
