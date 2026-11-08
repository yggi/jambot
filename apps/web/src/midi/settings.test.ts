import { DRUM_NOTES, type DrumSound } from '@jambot/engine';
import {
  BUILT_IN,
  DRUM_PRESETS,
  HEARD,
  KEYS,
  type DrumMap,
  activeSetup,
  deviceNote,
  fromJambot,
  memoryStore,
  presetNameOf,
  saveAs,
  withBuiltIn,
  withCrossing,
} from '@yggi/webmidi/core';
import { DEFAULT_CHANNELS, type DrumNotes } from '../audio/midi-out.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { drumMapOf, drumNotesOf } from './drums.ts';
import { BAND } from './patch.ts';
import {
  BOOK_KEY,
  LEGACY_DEFAULTS,
  LEGACY_KEY,
  MidiSettings,
  SYNTH_KEY,
  SYNTH_MOVED,
  readLegacy,
} from './settings.svelte.ts';

beforeEach(() => localStorage.clear());

const kept = () => JSON.parse(localStorage.getItem(BOOK_KEY)!);

describe('MidiSettings', () => {
  it('opens a first visit with one setup: the synth first, playing the five parts, which go on their channels to no device too', () => {
    const settings = new MidiSettings();
    const setup = settings.setup;
    expect(setup.name).toBe('Jambot');
    expect(setup.outputs).toEqual([BUILT_IN, { key: 'o1', id: 'none', name: '' }]);
    expect(settings.synth).toEqual(['lead', 'bass', 'pad', 'stab', 'drums']);
    expect(setup.plays).toEqual({});
    expect(setup.clock).toEqual([]);
    expect(setup.routes[BAND]).toEqual(
      Object.fromEntries(
        Object.entries(DEFAULT_CHANNELS).map(([part, ch]) => [part, { o1: ch, builtin: HEARD }]),
      ),
    );
    expect(kept()).toEqual(JSON.parse(JSON.stringify(settings.book)));
    expect(localStorage.getItem(SYNTH_KEY)).toBe(SYNTH_MOVED);
  });

  it('keeps the book, the synth in it, across instances: taken out of a setup, it stays out', () => {
    const settings = new MidiSettings();
    settings.book = withBuiltIn(settings.book, false);
    settings.book = withCrossing(settings.book, BAND, KEYS, 'o1', 4);
    const reopened = new MidiSettings();
    expect(reopened.synth).toEqual([]);
    expect(reopened.book).toEqual(settings.book);
  });

  it('moves the switch kept before into every setup once, as it is, no named setup made a custom variant', () => {
    for (const [kept, parts] of [
      ['true', 5],
      [null, 5],
      ['false', 0],
    ] as const) {
      localStorage.clear();
      let book = fromJambot(LEGACY_DEFAULTS, { inputs: [], outputs: [] });
      book = saveAs(book, 'Venue');
      localStorage.setItem(BOOK_KEY, JSON.stringify(book));
      if (kept !== null) localStorage.setItem(SYNTH_KEY, kept);
      const settings = new MidiSettings();
      expect(settings.book.setups.map((s) => [s.name, s.outputs.length])).toEqual([
        ['Jambot', parts ? 2 : 1],
        ['Venue', parts ? 2 : 1],
      ]);
      expect(settings.synth.length).toBe(parts);
      expect(localStorage.getItem(SYNTH_KEY)).toBe(SYNTH_MOVED);
      // once: a setup the synth is taken out of afterwards stays without it
      settings.book = withBuiltIn(settings.book, false);
      expect(new MidiSettings().synth).toEqual([]);
    }
  });

  it('resets to a first visit’s book, the synth playing every part, saved', () => {
    const settings = new MidiSettings();
    const first = settings.book;
    settings.book = withBuiltIn(withCrossing(settings.book, BAND, KEYS, 'o1', 4), false);
    settings.reset();
    expect(settings.book).toEqual(first);
    expect(kept()).toEqual(JSON.parse(JSON.stringify(first)));
  });

  it('says when the book changes, as the device listens again', () => {
    const onchange = vi.fn();
    const settings = new MidiSettings({ store: memoryStore(), onchange });
    settings.book = withCrossing(settings.book, BAND, 'lead', 'o1', 9);
    expect(onchange).toHaveBeenCalledOnce();
  });

  it('migrates the store from before the book once, through webmidi’s fromJambot, and leaves it as it was', () => {
    const old = {
      internal: false,
      channels: { lead: 5, bass: 6, pad: 7, stab: 7, drums: 8 },
      drumMap: DRUM_PRESETS['Novation Circuit'],
      clock: true,
      thru: true,
      thruChannel: 3,
      outPortId: 'device-out',
      inPortId: 'all',
    };
    localStorage.setItem(LEGACY_KEY, JSON.stringify(old));
    const settings = new MidiSettings();
    expect(settings.synth).toEqual([]);
    expect(settings.book).toEqual(fromJambot(old, { inputs: [], outputs: [] }));
    expect(kept()).toEqual(JSON.parse(JSON.stringify(settings.book)));
    expect(JSON.parse(localStorage.getItem(LEGACY_KEY)!)).toEqual(old);

    // kept from then on: a change to the old store is never read again
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ ...old, thruChannel: 9 }));
    expect(new MidiSettings().book).toEqual(settings.book);
  });

  it('names the ports the store kept by id alone once they are seen, and keeps the names', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ outPortId: 'out-1', clock: true }));
    const settings = new MidiSettings();
    expect(settings.setup.outputs[1]).toEqual({ key: 'o1', id: 'out-1', name: '' });
    const ports = { inputs: [], outputs: [{ id: 'out-1', name: 'Circuit' }] };
    settings.name(ports);
    expect(settings.setup.outputs[1]).toEqual({ key: 'o1', id: 'out-1', name: 'Circuit' });
    expect(new MidiSettings().setup.outputs[1]!.name).toBe('Circuit');
  });

  it('reads the store before the book as its load did: junk as nothing, a partial save filled from the defaults', () => {
    expect(readLegacy()).toBeNull();
    localStorage.setItem(LEGACY_KEY, '{not json');
    expect(readLegacy()).toBeNull();
    expect(activeSetup(new MidiSettings().book).routes[BAND]!.lead).toEqual({
      o1: 1,
      builtin: HEARD,
    });
    localStorage.clear();
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ channels: { lead: 9 } }));
    expect(readLegacy()).toEqual({
      ...LEGACY_DEFAULTS,
      channels: { ...DEFAULT_CHANNELS, lead: 9 },
    });
  });

  /**
   * Jambot's own drum presets before webmidi's, keyed by its drum sounds
   * (`midi/drum-presets.ts` at 5b4685f), as literals: what a save made
   * then holds, and what each sound went out as. They name no clap, which
   * joined the sounds later (#508): a save without one sends it as its map does.
   */
  const OLD_PRESETS: Readonly<Record<string, Omit<DrumNotes, 'clap'>>> = {
    GM: { kick: 36, rim: 37, snare: 38, closedHat: 42, pedalHat: 44, openHat: 46, ride: 51 },
    'Novation Circuit': {
      kick: 60,
      rim: 62,
      snare: 62,
      closedHat: 64,
      pedalHat: 64,
      openHat: 65,
      ride: 65,
    },
  };
  const SOUNDS = (Object.keys(DRUM_NOTES) as DrumSound[]).filter((s) => s !== 'clap');
  /** A save's notes with the clap its map sends: GM's 39, a Circuit's 62 (webmidi's presets). */
  const withClap = (notes: Omit<DrumNotes, 'clap'>, map: DrumMap): DrumNotes => ({
    ...notes,
    clap: deviceNote(map, DRUM_NOTES.clap),
  });

  it('has a preset of webmidi for each of its own before, sending all 7 drum sounds as that one did', () => {
    expect(Object.keys(DRUM_PRESETS)).toEqual(Object.keys(OLD_PRESETS));
    for (const [name, old] of Object.entries(OLD_PRESETS))
      for (const sound of SOUNDS)
        expect(deviceNote(DRUM_PRESETS[name]!, DRUM_NOTES[sound]), `${name}: ${sound}`).toBe(
          old[sound],
        );
  });

  it('reads a save of drum notes by sound into a map sending every sound as before, and migrates it into the book', () => {
    const custom = { ...OLD_PRESETS['Novation Circuit']!, kick: 61, ride: 51 };
    for (const [name, old] of [...Object.entries(OLD_PRESETS), ['Custom', custom] as const]) {
      localStorage.clear();
      localStorage.setItem(LEGACY_KEY, JSON.stringify({ drumNotes: old, thruChannel: 4 }));
      const map = readLegacy()!.drumMap;
      for (const sound of SOUNDS)
        expect(deviceNote(map, DRUM_NOTES[sound]), `${name}: ${sound}`).toBe(old[sound]);
      expect(drumNotesOf(map)).toEqual(withClap(old, map));
      expect(presetNameOf(map)).toBe(name);
      // no port seen yet: the map is the book's defaults, which the output takes
      const book = new MidiSettings().book;
      expect(book.defaults.drums).toEqual(map);
    }
  });

  it('names a map set by sound as the preset it matches, and keeps what a preset places beyond the 7 sounds', () => {
    let map = drumMapOf(OLD_PRESETS['Novation Circuit']!);
    expect(map).toEqual(DRUM_PRESETS['Novation Circuit']);
    map = drumMapOf({ ...drumNotesOf(map), kick: 61 }, map);
    expect(presetNameOf(map)).toBe('Custom');
    expect(deviceNote(map, 39)).toBe(62); // the clap, still on the Circuit's second pad
    expect(drumMapOf(OLD_PRESETS.GM!, map)).toEqual({});
  });
});
