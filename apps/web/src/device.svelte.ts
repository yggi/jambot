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
import { MidiAccess, type NoteHandler, type PortOption } from './midi/access.ts';
import { adoptPorts, connectMidi, portsMessage } from './midi/routing.ts';
import { MidiSettings } from './midi/settings.svelte.ts';
import { type Surroundings, browserSurroundings } from './player.svelte.ts';
import type { DeviceClocks } from './session/clocks.ts';

/** How long, in seconds, the band takes to come in when a session is joined, and to go when it is left. */
export const FADE_IN = 1.5;
export const FADE_OUT = 0.5;
/** A volume moved glides, so its step is no click. */
const GLIDE = 0.1;

export const VOLUME_KEY = 'jambot:volume';

/** A fader position's gain: the ear takes a level by its square, so a quiet setting has room. */
export const taper = (position: number) => position * position;

const storedVolume = (): number => {
  try {
    const kept = localStorage.getItem(VOLUME_KEY);
    const volume = kept === null || kept.trim() === '' ? NaN : Number(kept);
    return volume >= 0 && volume <= 1 ? volume : 1;
  } catch {
    return 1;
  }
};

export class Device {
  readonly settings = new MidiSettings();
  /** The Web MIDI connection, once made. */
  access: MidiAccess | null = $state(null);
  /** The ports plugged in, as of the last look: at connecting, when one came or went, and when a person asked. */
  ports: { inputs: PortOption[]; outputs: PortOption[] } = $state.raw({ inputs: [], outputs: [] });
  message = $state('Without MIDI, the built-in synth and the keys still run the whole loop.');

  #base: Output | null = null;
  #offset: ClockOffset | null = null;
  #volume = $state(storedVolume());

  /** The audio clock and the offset it maps to MIDI's, made on first use. */
  clockOf(): { base: Output; offset: ClockOffset } {
    const base = (this.#base ??= this.#opened());
    const offset = (this.#offset ??= clockOffset(base));
    return { base, offset };
  }

  #opened(): Output {
    const base = webAudioOutput();
    base.level?.(taper(this.#volume), 0);
    return base;
  }

  /**
   * The master volume, a fader position from 0 to 1, for what this device's
   * synth plays: local, kept for next time. MIDI out is not scaled by it;
   * a hardware synth has its own.
   */
  get volume(): number {
    return this.#volume;
  }

  set volume(position: number) {
    this.#volume = position;
    try {
      localStorage.setItem(VOLUME_KEY, String(position));
    } catch {
      // Nothing is lost but a volume to set again.
    }
    this.#base?.level?.(taper(position), GLIDE);
  }

  /** Silence what plays, at once: a session being joined comes in with `fadeIn`. */
  mute() {
    this.clockOf().base.level?.(0, 0);
  }

  /** Rise to the volume over `seconds`, from where `mute` left it. */
  fadeIn(seconds = FADE_IN) {
    this.clockOf().base.level?.(taper(this.#volume), seconds);
  }

  /** Fall to silence over `seconds`, the band playing on until it is done. */
  async fadeOut(seconds = FADE_OUT) {
    if (seconds <= 0) return;
    this.clockOf().base.level?.(0, seconds);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  /** The volume back at once, once nothing sounds: what plays next opens at it. */
  restore() {
    this.#base?.level?.(taper(this.#volume), 0);
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
      (handler) => MidiAccess.connect(handler, () => this.#changed()),
      onNote,
      this.settings,
    );
    this.access = result.access;
    this.message = result.message;
    this.#listPorts();
  }

  /** Look at the ports again, on a person's asking: the list, the output and the input as they are now. */
  refresh() {
    this.access?.refresh();
  }

  /** The ports may have changed: adopt the ones chosen again, and list them. */
  #changed() {
    const access = this.access;
    if (access) adoptPorts(access, this.settings);
    this.#listPorts();
  }

  #listPorts() {
    const access = this.access;
    this.ports = { inputs: access?.inputs ?? [], outputs: access?.outputs ?? [] };
    if (access) this.message = portsMessage(this.ports);
  }

  /** Whether a port was chosen before: a granted permission needs no gesture to connect again. */
  get remembersPorts(): boolean {
    return this.settings.outPortId !== 'none' || this.settings.inPortId !== 'none';
  }
}
