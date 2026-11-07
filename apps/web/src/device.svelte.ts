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
 *
 * MIDI follows the setup in use (`MidiSettings.book`, `midi/patch.ts`): the
 * band goes to each of its outputs, a note from an input is passed on where
 * its row crosses an output whether or not it is heard, and only a heard
 * input's notes reach the Muse and the instruments (`connect`'s `onNote`).
 *
 * Nothing MIDI does may stop the page: a port that throws, a permission the
 * browser never answers, a note that a part can't take. Each is caught where
 * it happens and said in `problems`, which the Sound panel shows, so a
 * setup that doesn't work says why instead of failing silently.
 */

import { bandOutput } from './audio/band-output.ts';
import { type Output, webAudioOutput } from './audio/output.ts';
import {
  KEYS,
  type ClockOffset,
  type EstimatedClockOffset,
  type Forward,
  type MidiPort,
  type ParsedNote,
  type PortOption,
  clockOffset,
  forwardsOf,
  forwardsOfInput,
  listenOf,
  outputNow,
  portsMessage,
} from '@yggi/webmidi/core';
import { MidiAccess } from '@yggi/webmidi/web';
import { BAND, bandRoutes, partPlayed, wantsInputs } from './midi/patch.ts';
import { MidiSettings } from './midi/settings.svelte.ts';
import { type Surroundings, browserSurroundings } from './player.svelte.ts';
import type { DeviceClocks } from './session/clocks.ts';
import type { Part } from '@jambot/engine';

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

/** A test note's length, in ms. */
const TEST_NOTE = 300;

/** How long, in ms, the browser may take to answer a request for MIDI before the panel says it is still waiting. */
export const CONNECT_WAIT = 8000;
/** How many problems the panel keeps: the latest, each once. */
const PROBLEMS = 4;

/** An error, in words a person can pass on: its name and message. */
export const described = (error: unknown): string =>
  error instanceof Error
    ? `${error.name}: ${error.message}`
    : typeof error === 'string'
      ? error
      : 'unknown error';

export class Device {
  readonly settings: MidiSettings = new MidiSettings({ onchange: () => this.#listen() });
  /** The Web MIDI connection, once made. */
  access: MidiAccess | null = $state(null);
  /** Asking for Web MIDI: Connect waits. */
  connecting = $state(false);
  /** The ports plugged in, as of the last look: at connecting, when one came or went, and when a person asked. */
  ports: { inputs: PortOption[]; outputs: PortOption[] } = $state.raw({ inputs: [], outputs: [] });
  message = $state('Without MIDI, the built-in synth and the keys still run the whole loop.');
  /** What went wrong with MIDI lately, in words, the latest last: shown until dismissed. */
  problems: readonly string[] = $state.raw([]);

  /** Say a problem: kept once, the latest few. */
  report(what: string, error?: unknown) {
    const line = error === undefined ? what : `${what} (${described(error)})`;
    this.problems = [...this.problems.filter((p) => p !== line), line].slice(-PROBLEMS);
  }

  /** Clear the problems said, once a person has read them. */
  dismissProblems() {
    this.problems = [];
  }

  /** Each output of the setup in use, by key, as the port it resolves to now (by id, else by name). */
  #outPorts: readonly { readonly key: string; readonly port: MidiPort | null }[] = $derived.by(
    () => {
      void this.ports; // looked at again: a port plugged in again is a new object
      const access = this.access;
      return this.settings.setup.outputs.map((o) => {
        try {
          return { key: o.key, port: access ? outputNow(access, o) : null };
        } catch {
          return { key: o.key, port: null };
        }
      });
    },
  );
  /** What the band sends to each output. */
  #routes = $derived(bandRoutes(this.settings.book, (o) => this.#portOf(o.key)));

  /** An output's port now, by its key: null for none. */
  #portOf(key: string): MidiPort | null {
    return this.#outPorts.find((o) => o.key === key)?.port ?? null;
  }

  #base: Output | null = null;
  #offset: EstimatedClockOffset | null = null;
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
      { internal: () => this.settings.internal, outputs: () => this.#routes },
      base,
      offset,
    );
  });

  /**
   * Connect to Web MIDI. A note in is passed on where the patch sends its
   * input's row (webmidi's `forwardsOfInput`), and, from an input the setup
   * hears, goes to `onNote` with the name of the port it came from and the
   * part it plays (`partPlayed`, yggi/webmidi#43). A browser that hasn't
   * answered after `CONNECT_WAIT` is said to be waiting (a permission prompt
   * hidden, or one a tablet never shows), and Connect can be pressed again.
   */
  async connect(onNote: (note: ParsedNote, source: string, part: Part) => void) {
    if (this.access) return;
    this.connecting = true;
    const waiting = setTimeout(() => {
      if (this.access) return;
      this.connecting = false;
      this.message =
        'Still waiting for the browser to allow MIDI. Look for its permission prompt, or allow MIDI in the site’s settings and press Connect again.';
    }, CONNECT_WAIT);
    try {
      const result = await MidiAccess.connect({
        onNote: (note, source) => this.#heard(note, source, onNote),
        onChange: () => this.#changed(),
      });
      if (typeof result === 'string') {
        this.message = result;
        return;
      }
      if (this.access) return; // a second request answered first
      this.access = result;
      this.#changed();
    } catch (error) {
      this.message = `MIDI couldn’t connect (${described(error)}).`;
    } finally {
      clearTimeout(waiting);
      this.connecting = false;
    }
  }

  /** A note from an input: passed on where its row is patched, then to `onNote` if the setup hears it. */
  #heard(
    note: ParsedNote,
    source: string,
    onNote: (note: ParsedNote, source: string, part: Part) => void,
  ) {
    try {
      const book = this.settings.book;
      this.#send(
        forwardsOfInput(
          book,
          BAND,
          { id: '', name: source },
          noteBytes(note.note, note.velocity, note.on, note.channel),
        ),
      );
      const part = partPlayed(book, source, note.channel);
      if (part) onNote(note, source, part);
    } catch (error) {
      this.report(`A note from ${source} couldn’t be played`, error);
    }
  }

  /** Look at the ports again, on a person's asking: the list, the outputs and the inputs as they are now. */
  refresh() {
    this.access?.refresh();
  }

  /** The ports may have changed: list them, name what the book kept by id alone, and listen again. */
  #changed() {
    const access = this.access;
    try {
      this.ports = { inputs: access?.inputs ?? [], outputs: access?.outputs ?? [] };
      if (!access) return;
      this.message = portsMessage(this.ports);
      this.settings.name(this.ports);
    } catch (error) {
      this.report('The ports couldn’t be read', error);
    }
    this.#listen();
  }

  /** Listen to the inputs the setup in use hears or routes, and to no other. */
  #listen() {
    try {
      this.access?.listen(listenOf(this.settings.setup));
    } catch (error) {
      this.report('The inputs couldn’t be listened to', error);
    }
  }

  /** Send each message passed on to its output, at once. */
  #send(forwards: readonly Forward[]) {
    for (const { output, data } of forwards) {
      try {
        this.#portOf(output)?.send(data);
      } catch (error) {
        // A port can vanish mid-send (unplugged, revoked): said, and the rest still sent.
        this.report('A note couldn’t be passed on', error);
      }
    }
  }

  /** A note played on this device's own keys (the keys' row of the patch), passed on where that row is sent. */
  forwardKeys(note: number, velocity: number, on: boolean, played: number) {
    this.#send(forwardsOf(this.settings.book, BAND, KEYS, noteBytes(note, velocity, on, played)));
  }

  /** A short middle C on an output, on the first channel routed to it (else 1), to find a device by. */
  testNote(key: string, channel: number) {
    const port = this.#portOf(key);
    const status = (channel - 1) & 15;
    if (!port) {
      this.report('The test note has no port to go to: choose a device that is plugged in');
      return;
    }
    try {
      port.send([0x90 | status, 60, 100]);
      port.send([0x80 | status, 60, 0], performance.now() + TEST_NOTE);
    } catch (error) {
      this.report('The test note couldn’t be sent', error);
    }
  }

  /** Whether a port was chosen before: a granted permission needs no gesture to connect again. */
  get remembersPorts(): boolean {
    const setup = this.settings.setup;
    return setup.outputs.some((o) => o.id !== 'none') || wantsInputs(setup);
  }
}

/** A note as the message passed on: a note-on at its velocity, or a note-off at 0, on `channel` (a status byte's nibble). */
const noteBytes = (note: number, velocity: number, on: boolean, channel: number): number[] =>
  on ? [0x90 | (channel & 15), note, velocity] : [0x80 | (channel & 15), note, 0];
