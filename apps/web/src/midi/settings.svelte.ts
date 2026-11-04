/**
 * What this device remembers of how it sounds, saved on every change so a
 * reload keeps it: whether the built-in synth plays (`internal`, Jambot's
 * own), and the MIDI setups, webmidi's book (yggi/webmidi decision 002):
 * device profiles kept by port name (drum map, bend, latency), named setups
 * with their outputs, the inputs heard, the routes of the context `band`
 * (`midi/patch.ts`) and the clock row.
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
import { nameByPorts } from './patch.ts';

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

function readSynth(): boolean | null {
  try {
    const kept = localStorage.getItem(SYNTH_KEY);
    return kept === 'true' ? true : kept === 'false' ? false : null;
  } catch {
    return null;
  }
}

export interface MidiSettingsOptions {
  /** Where the book is kept: `localStorage` under `BOOK_KEY` by default. */
  readonly store?: BookStore;
  /** Called after every change of the book, as the device listens to the inputs it names. */
  readonly onchange?: () => void;
}

export class MidiSettings {
  #internal = $state(true);
  #book: SetupBook = $state.raw(fromJambot(LEGACY_DEFAULTS, NO_PORTS));
  #setup: Setup = $derived(activeSetup(this.#book));
  readonly #store: BookStore;
  readonly #changed: () => void;

  constructor({ store = localBookStore(BOOK_KEY), onchange = () => {} }: MidiSettingsOptions = {}) {
    this.#store = store;
    this.#changed = onchange;
    const legacy = readLegacy();
    this.#internal = readSynth() ?? legacy?.internal ?? true;
    this.#book = loadBook(store, () => fromJambot(legacy ?? LEGACY_DEFAULTS, NO_PORTS));
  }

  /** Whether the built-in synth plays. */
  get internal(): boolean {
    return this.#internal;
  }
  set internal(value: boolean) {
    this.#internal = value;
    try {
      localStorage.setItem(SYNTH_KEY, String(value));
    } catch {
      // Storage can be unavailable (private browsing, quota); it just won't persist.
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

  /** Give the ports kept by id alone their names, now the ports plugged in say them (`nameByPorts`). */
  name(ports: { readonly inputs: readonly PortOption[]; readonly outputs: readonly PortOption[] }) {
    const named = nameByPorts(this.#book, ports);
    if (named !== this.#book) this.book = named;
  }
}
