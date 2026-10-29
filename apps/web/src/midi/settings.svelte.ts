/**
 * MIDI preferences, saved to `localStorage` on every change so a reload
 * remembers them: the prototype's `jambot-proto-v2`, under a name of its
 * own since the shape has moved.
 *
 * Whether a port is actually reachable is Web MIDI's to say (`Device`
 * adopts `outPortId`/`inPortId` through webmidi once connected); this class
 * only remembers what was chosen.
 *
 * The drum notes are kept as webmidi keeps them, a `DrumMap` keyed by the
 * General MIDI note the engine writes (`drumMap`). A save from before keyed
 * them by Jambot's drum sounds (`drumNotes`): it is read into a map that
 * sends every sound as it did, and written back in the new form.
 */

import { DRUM_NOTES, type DrumSound } from '@jambot/engine';
import { DRUM_PRESETS, type DrumMap, deviceNote } from '@yggi/webmidi/core';
import {
  DEFAULT_CHANNELS,
  DEFAULT_DRUM_NOTES,
  type Channels,
  type DrumNotes,
  type MidiPort,
} from '../audio/midi-out.ts';

const STORAGE_KEY = 'jambot-midi-v1';

const DRUM_SOUNDS = Object.keys(DRUM_NOTES) as readonly DrumSound[];

/** The note each drum sound goes out as under a map: what `MidiOut` takes, until note out is webmidi's too. */
export const drumNotesOf = (map: DrumMap): DrumNotes =>
  Object.fromEntries(
    DRUM_SOUNDS.map((sound) => [sound, deviceNote(map, DRUM_NOTES[sound])]),
  ) as DrumNotes;

/** The sounds `notes` names: all of them, but a save from before the clap (#508) names no clap. */
const soundsIn = (notes: Partial<DrumNotes>) => DRUM_SOUNDS.filter((s) => notes[s] !== undefined);

const sameNotes = (a: DrumNotes, b: Partial<DrumNotes>) => soundsIn(b).every((s) => a[s] === b[s]);

/**
 * A map that sends each drum sound as `notes` says: the preset that does, so
 * it is still named as one (a Circuit's map also places sounds Jambot never
 * plays), else `base` with each sound's General MIDI note sent as given. A
 * sound `notes` doesn't name goes out as the map sends it.
 */
export function drumMapOf(notes: Partial<DrumNotes>, base: DrumMap = {}): DrumMap {
  const preset = Object.values(DRUM_PRESETS).find((map) => sameNotes(drumNotesOf(map), notes));
  if (preset) return { ...preset };
  const map: Record<number, number> = { ...base };
  for (const sound of soundsIn(notes)) {
    const gm = DRUM_NOTES[sound];
    const note = notes[sound]!;
    if (note === gm) delete map[gm];
    else map[gm] = note;
  }
  return map;
}

interface StoredPrefs {
  readonly internal: boolean;
  readonly channels: Channels;
  readonly drumMap: DrumMap;
  readonly clock: boolean;
  readonly thru: boolean;
  readonly thruChannel: number;
  readonly outPortId: string;
  readonly inPortId: string;
}

/** What a save from before the drum map held in its place: one note per drum sound. */
interface LegacyPrefs {
  readonly drumNotes?: Partial<DrumNotes>;
}

/** No MIDI out or in, the built-in synth on, as a fresh install opens. */
const DEFAULTS: StoredPrefs = {
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
const LEGACY_DEFAULTS: Partial<DrumNotes> = Object.fromEntries(
  Object.entries(DEFAULT_DRUM_NOTES).filter(([sound]) => sound !== 'clap'),
);

/** The saved preferences, and whether they were saved in the old form and are to be written in the new. */
function load(): { prefs: StoredPrefs; migrated: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { prefs: DEFAULTS, migrated: false };
    const { drumNotes, ...stored } = JSON.parse(raw) as Partial<StoredPrefs> & LegacyPrefs;
    const migrated = stored.drumMap === undefined && drumNotes !== undefined;
    return {
      prefs: {
        ...DEFAULTS,
        ...stored,
        channels: { ...DEFAULTS.channels, ...stored.channels },
        drumMap: migrated
          ? drumMapOf({ ...LEGACY_DEFAULTS, ...drumNotes })
          : readDrumMap(stored.drumMap ?? DEFAULTS.drumMap),
      },
      migrated,
    };
  } catch {
    return { prefs: DEFAULTS, migrated: false };
  }
}

export class MidiSettings {
  #internal = $state(true);
  #channels: Channels = $state.raw(DEFAULT_CHANNELS);
  #drumMap: DrumMap = $state.raw(DEFAULTS.drumMap);
  #drumNotes: DrumNotes = $derived(drumNotesOf(this.#drumMap));
  #clock = $state(false);
  #thru = $state(false);
  #thruChannel = $state(1);
  #outPortId = $state('none');
  #inPortId = $state('none');

  /** The output port `outPortId` currently resolves to, once Web MIDI is connected. */
  outPort: MidiPort | null = $state.raw(null);

  constructor() {
    const { prefs: stored, migrated } = load();
    this.#internal = stored.internal;
    this.#channels = stored.channels;
    this.#drumMap = stored.drumMap;
    this.#clock = stored.clock;
    this.#thru = stored.thru;
    this.#thruChannel = stored.thruChannel;
    this.#outPortId = stored.outPortId;
    this.#inPortId = stored.inPortId;
    if (migrated) this.#save();
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

  /** The drum notes as webmidi keeps them: a General MIDI note to the note it goes out as. */
  get drumMap(): DrumMap {
    return this.#drumMap;
  }
  set drumMap(value: DrumMap) {
    this.#drumMap = value;
    this.#save();
  }

  /** The note each drum sound goes out as, a view of `drumMap`; set, it changes the map to match (`drumMapOf`). */
  get drumNotes(): DrumNotes {
    return this.#drumNotes;
  }
  set drumNotes(value: Partial<DrumNotes>) {
    this.drumMap = drumMapOf(value, this.#drumMap);
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
      drumMap: this.#drumMap,
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
