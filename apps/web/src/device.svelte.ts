/**
 * This device: what belongs to the person at it, whether or not a band is
 * playing. Its MIDI settings and connection, and its audio: one clock and
 * the offset that maps it to MIDI's, made only once something needs them,
 * since a browser starts audio only after a gesture and a test that never
 * presses play should never need one.
 *
 * The player's output is built from it (`surroundings`), and a session
 * reads the device's clocks (`clocks`), so the band's output and the
 * session's clock pairing are one pair.
 */

import { bandOutput } from './audio/band-output.ts';
import { type ClockOffset, clockOffset } from './audio/clock-offset.ts';
import { type Output, webAudioOutput } from './audio/output.ts';
import { MidiAccess, type NoteHandler } from './midi/access.ts';
import { connectMidi } from './midi/routing.ts';
import { MidiSettings } from './midi/settings.svelte.ts';
import { type Surroundings, browserSurroundings } from './player.svelte.ts';
import type { DeviceClocks } from './session/clocks.ts';

export class Device {
  readonly settings = new MidiSettings();
  /** The Web MIDI connection, once made. */
  access: MidiAccess | null = $state(null);
  message = $state('Without MIDI, the built-in synth and the keys still run the whole loop.');

  #base: Output | null = null;
  #offset: ClockOffset | null = null;

  /** The audio clock and the offset it maps to MIDI's, made on first use. */
  clockOf(): { base: Output; offset: ClockOffset } {
    const base = (this.#base ??= webAudioOutput());
    const offset = (this.#offset ??= clockOffset(base));
    return { base, offset };
  }

  /** The output pair's estimate, or null before anything needed the clocks. */
  get offsetEstimate() {
    return this.#offset?.estimate ?? null;
  }

  /** The clocks, as a session reads them. */
  readonly clocks: DeviceClocks = {
    page: () => performance.now() / 1000,
    heardOffset: () => {
      const { offset } = this.clockOf();
      offset.update();
      return offset.heardOffset();
    },
  };

  /** What the player plays through: the band's output on this device's synth and MIDI. */
  readonly surroundings: Surroundings = browserSurroundings(() => {
    const { base, offset } = this.clockOf();
    return bandOutput(
      {
        internal: () => this.settings.internal,
        port: () => this.settings.outPort,
        channels: () => this.settings.channels,
        drumNotes: () => this.settings.drumNotes,
        clock: () => this.settings.clock,
      },
      base,
      offset,
    );
  });

  /** Connect to Web MIDI, notes in going to `onNote`. */
  async connect(onNote: NoteHandler) {
    const result = await connectMidi(
      (handler) => MidiAccess.connect(handler),
      onNote,
      this.settings,
    );
    this.access = result.access;
    this.message = result.message;
  }

  /** Whether a port was chosen before: a granted permission needs no gesture to connect again. */
  get remembersPorts(): boolean {
    return this.settings.outPortId !== 'none' || this.settings.inPortId !== 'none';
  }
}
