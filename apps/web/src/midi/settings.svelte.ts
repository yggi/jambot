/**
 * What this device remembers of how it sounds, saved on every change so a
 * reload keeps it: the MIDI setups, webmidi's book (yggi/webmidi decision
 * 002): device profiles kept by port name (drum map, bend, latency), named
 * setups with their outputs, the inputs heard, the routes of the context
 * `band` (`midi/patch.ts`) and the clock row; and the built-in synth, an
 * output of each setup (webmidi's `BUILT_IN`, decision 004) whose crossings
 * are the parts it plays (`synthPlays`).
 *
 * The synth was a switch of Jambot's own, kept under `SYNTH_KEY`, for every
 * part and every setup. It is moved into the book once (`withSynth`): every
 * setup gets the synth playing every part if the switch was on (or never
 * set), none if it was off; `SYNTH_KEY` then says `book`, so a setup without
 * it afterwards is one a person took it out of.
 *
 * The book is kept under `BOOK_KEY` (webmidi's `localBookStore`). A first
 * load with nothing kept there migrates the store from before the book
 * (`LEGACY_KEY`, read as it was, with its own migration of drum notes by
 * sound) through webmidi's `fromJambot`, once; a first visit gets the same
 * from the defaults, the five parts on their channels to one output with no
 * device. That store kept its ports by id alone, so the book names them once
 * the ports are seen (`name`, `nameByPorts`).
 *
 * Whether a port is reachable is Web MIDI's to say (`Device` resolves each
 * output once connected); this class only remembers what was chosen.
 */

import {
  type BookStore,
  type DrumMap,
  type PortOption,
  type Setup,
  type SetupBook,
  activeSetup,
  fromJambot,
  loadBook,
} from '@yggi/webmidi/core';
import { localBookStore } from '@yggi/webmidi/web';
import {
  DEFAULT_CHANNELS,
  DEFAULT_DRUM_NOTES,
  type Channels,
  type DrumNotes,
} from '../audio/midi-out.ts';
import { drumMapOf } from './drums.ts';
import type { Part } from '@jambot/engine';
import { nameByPorts, synthParts, withSynth } from './patch.ts';

/** Where the book of setups is kept. */
export const BOOK_KEY = 'jambot:midi-setups';
/** Whether the built-in synth plays: Jambot's own, beside the book. */
export const SYNTH_KEY = 'jambot:synth';
/** The store from before the book, read once to migrate it, and left as it was. */
export const LEGACY_KEY = 'jambot-midi-v1';

/** The store from before the book, as its own load read it. */
export interface LegacyPrefs {
  readonly internal: boolean;
  readonly channels: Channels;
  readonly drumMap: DrumMap;
  readonly clock: boolean;
  readonly thru: boolean;
  readonly thruChannel: number;
  readonly outPortId: string;
  readonly inPortId: string;
}

/** No MIDI out or in, the built-in synth on, as a fresh install opened. */
export const LEGACY_DEFAULTS: LegacyPrefs = {
  internal: true,
  channels: DEFAULT_CHANNELS,
  // General MIDI: every note goes out as it is (webmidi's 'GM').
  drumMap: {},
  clock: false,
  thru: false,
  thruChannel: 1,
  outPortId: 'none',
  inPortId: 'none',
};

/** A saved map's entries that are notes to notes: JSON keys are strings, and anything else is dropped. */
function readDrumMap(stored: unknown): DrumMap {
  const map: Record<number, number> = {};
  if (typeof stored !== 'object' || stored === null) return map;
  for (const [key, value] of Object.entries(stored)) {
    const gm = Number(key);
    if (Number.isInteger(gm) && Number.isInteger(value)) map[gm] = value as number;
  }
  return map;
}

/** The sounds a save by sound named, filled in where one is missing: all but the clap, which joined later (#508). */
const BY_SOUND_DEFAULTS: Partial<DrumNotes> = Object.fromEntries(
  Object.entries(DEFAULT_DRUM_NOTES).filter(([sound]) => sound !== 'clap'),
);

/**
 * The store from before the book, as its load read it, or null when nothing
 * (or junk) is kept: a partial save filled from the defaults, and a save of
 * drum notes by sound (`drumNotes`) read into the map that sends every sound
 * as it did.
 */
export function readLegacy(): LegacyPrefs | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const { drumNotes, ...stored } = JSON.parse(raw) as Partial<LegacyPrefs> & {
      drumNotes?: Partial<DrumNotes>;
    };
    const bySound = stored.drumMap === undefined && drumNotes !== undefined;
    return {
      ...LEGACY_DEFAULTS,
      ...stored,
      channels: { ...LEGACY_DEFAULTS.channels, ...stored.channels },
      drumMap: bySound
        ? drumMapOf({ ...BY_SOUND_DEFAULTS, ...drumNotes })
        : readDrumMap(stored.drumMap ?? LEGACY_DEFAULTS.drumMap),
    };
  } catch {
    return null;
  }
}

const NO_PORTS = { inputs: [], outputs: [] } as const;

/** What `SYNTH_KEY` says once the switch has moved into the book. */
export const SYNTH_MOVED = 'book';

/** The switch as kept: on, off, never set (null), or moved into the book already. */
function readSynth(): boolean | null | typeof SYNTH_MOVED {
  try {
    const kept = localStorage.getItem(SYNTH_KEY);
    return kept === 'true'
      ? true
      : kept === 'false'
        ? false
        : kept === SYNTH_MOVED
          ? SYNTH_MOVED
          : null;
  } catch {
    return null;
  }
}

/** Every setup of a book with the synth in it or not (`withSynth`), as the switch said. */
const synthEverywhere = (book: SetupBook, on: boolean): SetupBook => ({
  ...book,
  setups: book.setups.map((setup) => withSynth(setup, on)),
});

export interface MidiSettingsOptions {
  /** Where the book is kept: `localStorage` under `BOOK_KEY` by default. */
  readonly store?: BookStore;
  /** Called after every change of the book, as the device listens to the inputs it names. */
  readonly onchange?: () => void;
}

export class MidiSettings {
  #book: SetupBook = $state.raw(fromJambot(LEGACY_DEFAULTS, NO_PORTS));
  #setup: Setup = $derived(activeSetup(this.#book));
  readonly #store: BookStore;
  readonly #changed: () => void;

  constructor({ store = localBookStore(BOOK_KEY), onchange = () => {} }: MidiSettingsOptions = {}) {
    this.#store = store;
    this.#changed = onchange;
    const legacy = readLegacy();
    this.#book = loadBook(store, () => fromJambot(legacy ?? LEGACY_DEFAULTS, NO_PORTS));
    const synth = readSynth();
    if (synth !== SYNTH_MOVED) {
      this.#book = synthEverywhere(this.#book, synth ?? legacy?.internal ?? true);
      store.save(this.#book);
      try {
        localStorage.setItem(SYNTH_KEY, SYNTH_MOVED);
      } catch {
        // Storage can be unavailable: the switch is moved again next time, the same way.
      }
    }
  }

  /** The setups, the one in use and the devices' profiles; a new book is saved at once. */
  get book(): SetupBook {
    return this.#book;
  }
  set book(value: SetupBook) {
    this.#book = value;
    this.#store.save(value);
    this.#changed();
  }

  /** The setup in use. */
  get setup(): Setup {
    return this.#setup;
  }

  /** The parts the built-in synth plays in the setup in use. */
  get synth(): Part[] {
    return synthParts(this.#book);
  }

  /**
   * Forget every setup and device profile: the book a first visit gets, the
   * synth playing every part, saved at once. A way back from a setup that
   * doesn't work.
   */
  reset() {
    this.book = synthEverywhere(fromJambot(LEGACY_DEFAULTS, NO_PORTS), true);
  }

  /** Give the ports kept by id alone their names, now the ports plugged in say them (`nameByPorts`). */
  name(ports: { readonly inputs: readonly PortOption[]; readonly outputs: readonly PortOption[] }) {
    const named = nameByPorts(this.#book, ports);
    if (named !== this.#book) this.book = named;
  }
}
