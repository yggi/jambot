/**
 * The tuner (#269): it listens to an input, looks at the newest sound every
 * `TICK_MS`, and reads the note heard against a reference pitch. A look is
 * asked of a worker (`analysis.ts`) and never waited for: a look that is
 * still out when the next is due makes that one skipped, so a slow machine
 * sees a slower tuner and the page's clock is untouched. The note is held
 * for `HOLD_TICKS` of silence, so the widget does not flicker between notes
 * of a phrase, and is read again from what was last heard when the reference
 * pitch changes, so turning it moves the needle at once.
 */

import { A4_HZ, frequencyOf, pitchOf } from '@jambot/theory';
import type { Analysis } from '@jambot/spectrum';
import { midiNoteName } from '../noteNames.ts';
import type { Analyse } from './analysis.ts';
import { type InputDevice, type Mic, MicDenied, type MicSource } from './mic.ts';

/** How often, in milliseconds, the tuner looks at the sound. */
export const TICK_MS = 50;

/** How many looks without a pitch the note read stays on the widget. */
export const HOLD_TICKS = 6;

/** The most samples a look can use: the adaptive frame's longest (`spectrum`'s `maxFrame`). */
const SAMPLES = 16384;

export type TunerStatus = 'idle' | 'starting' | 'listening' | 'denied' | 'failed';

export interface TunerDeps {
  mic: MicSource;
  analyse: Analyse;
}

/** The note heard and how far the sound is from it. */
export interface Reading {
  /** The nearest note's MIDI number. */
  midi: number;
  /** Its name with its octave, `A4`. */
  name: string;
  /** How far the sound is from it, sharp positive, −50 to 50. */
  cents: number;
  /** The frequency heard, in Hz. */
  hz: number;
  /** The nearest note's own frequency at the reference pitch. */
  nearestHz: number;
  /** How far the sound is from it, in Hz, sharp positive. */
  offsetHz: number;
  /** How periodic the sound is, 0 to 1. */
  clarity: number;
}

export class Tuner {
  #deps: TunerDeps;
  status: TunerStatus = $state('idle');
  /** What the person is told when it did not start. */
  message = $state('');
  /** The A4 the notes are measured against, in Hz. */
  reference = $state(A4_HZ);
  /** The note the sound is meant to be, as a MIDI number, while one is sent to tune by; otherwise the nearest note is. */
  target: number | null = $state(null);
  devices: InputDevice[] = $state.raw([]);
  /** The input chosen; `undefined` is the default. */
  deviceId: string | undefined = $state(undefined);
  inputName = $state('');
  /** The rate the input runs at, 0 until one is open. */
  sampleRate = $state(0);
  /** The last look: loudness, pitch, frame, spectrum. */
  analysis: Analysis | null = $state.raw(null);
  /** Looks dropped because the last was still out. */
  skipped = $state(0);

  /** The pitch last heard, kept while the silence is short. */
  #heard: { hz: number; clarity: number } | null = $state.raw(null);
  #mic: Mic | null = null;
  #timer: ReturnType<typeof setInterval> | null = null;
  #busy = false;
  #quiet = 0;
  /** Which start this is, so a stop during a start is told apart from the next start. */
  #run = 0;

  constructor(deps: TunerDeps) {
    this.#deps = deps;
  }

  /**
   * The note heard, read against the reference; null when there is none. Against
   * the target where there is one, however far off, and otherwise against the
   * nearest note, never more than 50 cents away.
   */
  reading: Reading | null = $derived.by(() => {
    const heard = this.#heard;
    const pitch = heard && pitchOf(heard.hz, this.reference);
    if (!heard || !pitch) return null;
    const midi = this.target ?? pitch.midi;
    const nearestHz = this.target === null ? pitch.hz : frequencyOf(midi, this.reference);
    return {
      midi,
      name: midiNoteName(midi),
      cents: this.target === null ? pitch.cents : 1200 * Math.log2(heard.hz / nearestHz),
      hz: heard.hz,
      nearestHz,
      offsetHz: heard.hz - nearestHz,
      clarity: heard.clarity,
    };
  });

  /** Listen. A press of the person's: a browser asks for the microphone, and plays audio, only after one. */
  async start(): Promise<void> {
    if (this.status === 'starting' || this.status === 'listening') return;
    const run = ++this.#run;
    this.status = 'starting';
    this.message = '';
    let mic: Mic;
    try {
      mic = await this.#deps.mic.open(this.deviceId);
    } catch (error) {
      if (run !== this.#run) return;
      this.#fail(error);
      return;
    }
    if (run !== this.#run) {
      mic.stop();
      return;
    }
    this.#mic = mic;
    this.inputName = mic.label;
    this.sampleRate = mic.sampleRate;
    this.status = 'listening';
    this.#timer = setInterval(() => void this.#look(), TICK_MS);
    // A browser names its inputs only once one is allowed.
    void this.#deps.mic.devices().then((devices) => {
      if (run === this.#run) this.devices = devices;
    });
  }

  /** Stop listening and let go of the input; what was shown is cleared. */
  stop(): void {
    this.#run++;
    if (this.#timer !== null) clearInterval(this.#timer);
    this.#timer = null;
    this.#mic?.stop();
    this.#mic = null;
    this.status = 'idle';
    this.analysis = null;
    this.sampleRate = 0;
    this.inputName = '';
    this.#heard = null;
    this.#quiet = 0;
  }

  /** Listen to another input, at once if it is listening already. */
  async choose(deviceId: string | undefined): Promise<void> {
    this.deviceId = deviceId;
    if (this.status !== 'listening') return;
    this.stop();
    await this.start();
  }

  #fail(error: unknown): void {
    if (error instanceof MicDenied) {
      this.status = 'denied';
      this.message =
        'The microphone is blocked. Allow it for this page in the browser’s site settings, then press Start.';
    } else if (error instanceof DOMException && error.name === 'NotFoundError') {
      this.status = 'failed';
      this.message =
        'No microphone was found. Plug one in, or pick another input, and press Start.';
    } else {
      this.status = 'failed';
      this.message = `The microphone could not be opened: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async #look(): Promise<void> {
    const mic = this.#mic;
    if (!mic) return;
    if (this.#busy) {
      this.skipped++;
      return;
    }
    this.#busy = true;
    const run = this.#run;
    try {
      const analysis = await this.#deps.analyse(mic.latest(SAMPLES), mic.sampleRate);
      if (run !== this.#run) return;
      this.analysis = analysis;
      if (analysis.pitch) {
        this.#heard = { hz: analysis.pitch.hz, clarity: analysis.pitch.clarity };
        this.#quiet = 0;
      } else if (++this.#quiet > HOLD_TICKS) {
        this.#heard = null;
      }
    } catch {
      // A look that failed, because its worker ended, is one the next makes up for.
    } finally {
      this.#busy = false;
    }
  }
}
