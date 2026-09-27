/**
 * MIDI preferences, saved to `localStorage` on every change so a reload
 * remembers them: the prototype's `jambot-proto-v2`, under a name of its
 * own since the shape has moved.
 *
 * Whether a port is actually reachable is Web MIDI's to say (`../midi/input.ts`
 * and the UI resolve `outPortId`/`inPortId` to a live port once connected);
 * this class only remembers what was chosen.
 */

import { DEFAULT_CHANNELS, type Channels, type MidiPort } from '../audio/midi-out.ts';

const STORAGE_KEY = 'jambot-midi-v1';

interface StoredPrefs {
  readonly internal: boolean;
  readonly channels: Channels;
  readonly clock: boolean;
  readonly thru: boolean;
  readonly thruChannel: number;
  readonly outPortId: string;
  readonly inPortId: string;
}

/** No MIDI out or in, the built-in synth on, as a fresh install opens. */
const DEFAULTS: StoredPrefs = {
  internal: true,
  channels: DEFAULT_CHANNELS,
  clock: false,
  thru: false,
  thruChannel: 1,
  outPortId: 'none',
  inPortId: 'none',
};

function load(): StoredPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const stored = JSON.parse(raw) as Partial<StoredPrefs>;
    return { ...DEFAULTS, ...stored, channels: { ...DEFAULTS.channels, ...stored.channels } };
  } catch {
    return DEFAULTS;
  }
}

export class MidiSettings {
  #internal = $state(true);
  #channels: Channels = $state.raw(DEFAULT_CHANNELS);
  #clock = $state(false);
  #thru = $state(false);
  #thruChannel = $state(1);
  #outPortId = $state('none');
  #inPortId = $state('none');

  /** The output port `outPortId` currently resolves to, once Web MIDI is connected. */
  outPort: MidiPort | null = $state.raw(null);

  constructor() {
    const stored = load();
    this.#internal = stored.internal;
    this.#channels = stored.channels;
    this.#clock = stored.clock;
    this.#thru = stored.thru;
    this.#thruChannel = stored.thruChannel;
    this.#outPortId = stored.outPortId;
    this.#inPortId = stored.inPortId;
  }

  get internal(): boolean {
    return this.#internal;
  }
  set internal(value: boolean) {
    this.#internal = value;
    this.#save();
  }

  get channels(): Channels {
    return this.#channels;
  }
  set channels(value: Channels) {
    this.#channels = value;
    this.#save();
  }

  get clock(): boolean {
    return this.#clock;
  }
  set clock(value: boolean) {
    this.#clock = value;
    this.#save();
  }

  get thru(): boolean {
    return this.#thru;
  }
  set thru(value: boolean) {
    this.#thru = value;
    this.#save();
  }

  get thruChannel(): number {
    return this.#thruChannel;
  }
  set thruChannel(value: number) {
    this.#thruChannel = value;
    this.#save();
  }

  get outPortId(): string {
    return this.#outPortId;
  }
  set outPortId(value: string) {
    this.#outPortId = value;
    this.#save();
  }

  get inPortId(): string {
    return this.#inPortId;
  }
  set inPortId(value: string) {
    this.#inPortId = value;
    this.#save();
  }

  #save() {
    const stored: StoredPrefs = {
      internal: this.#internal,
      channels: this.#channels,
      clock: this.#clock,
      thru: this.#thru,
      thruChannel: this.#thruChannel,
      outPortId: this.#outPortId,
      inPortId: this.#inPortId,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Storage can be unavailable (private browsing, quota); it just won't persist.
    }
  }
}
