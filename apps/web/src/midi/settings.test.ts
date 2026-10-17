import { DRUM_NOTES, type DrumSound } from '@jambot/engine';
import { DRUM_PRESETS, deviceNote, presetNameOf } from '@yggi/webmidi/core';
import { DEFAULT_CHANNELS, DEFAULT_DRUM_NOTES, type DrumNotes } from '../audio/midi-out.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { MidiSettings, drumNotesOf } from './settings.svelte.ts';

beforeEach(() => localStorage.clear());

describe('MidiSettings', () => {
  it('opens with the built-in synth on, default channels, GM drum notes, and no MIDI', () => {
    const settings = new MidiSettings();
    expect(settings.internal).toBe(true);
    expect(settings.channels).toEqual(DEFAULT_CHANNELS);
    expect(settings.drumNotes).toEqual(DEFAULT_DRUM_NOTES);
    expect(settings.clock).toBe(false);
    expect(settings.thru).toBe(false);
    expect(settings.outPortId).toBe('none');
    expect(settings.inPortId).toBe('none');
    expect(settings.outPort).toBeNull();
  });

  it('persists every field across instances', () => {
    const settings = new MidiSettings();
    settings.internal = false;
    settings.channels = { lead: 5, bass: 6, pad: 7, stab: 7, drums: 8 };
    settings.drumNotes = { ...DEFAULT_DRUM_NOTES, kick: 60 };
    settings.clock = true;
    settings.thru = true;
    settings.thruChannel = 3;
    settings.outPortId = 'device-out';
    settings.inPortId = 'all';

    const reopened = new MidiSettings();
    expect(reopened.internal).toBe(false);
    expect(reopened.channels).toEqual({ lead: 5, bass: 6, pad: 7, stab: 7, drums: 8 });
    expect(reopened.drumNotes).toEqual({ ...DEFAULT_DRUM_NOTES, kick: 60 });
    expect(reopened.clock).toBe(true);
    expect(reopened.thru).toBe(true);
    expect(reopened.thruChannel).toBe(3);
    expect(reopened.outPortId).toBe('device-out');
    expect(reopened.inPortId).toBe('all');
  });

  it('does not persist the resolved port itself: only its id', () => {
    const settings = new MidiSettings();
    settings.outPort = { send: () => {} };
    const reopened = new MidiSettings();
    expect(reopened.outPort).toBeNull();
  });

  it('falls back to defaults when localStorage holds junk', () => {
    localStorage.setItem('jambot-midi-v1', '{not json');
    const settings = new MidiSettings();
    expect(settings.channels).toEqual(DEFAULT_CHANNELS);
  });

  it('fills in missing channels from a partial save, rather than dropping the rest', () => {
    localStorage.setItem('jambot-midi-v1', JSON.stringify({ channels: { lead: 9 } }));
    const settings = new MidiSettings();
    expect(settings.channels).toEqual({ ...DEFAULT_CHANNELS, lead: 9 });
  });

  it('fills in missing drum notes from a partial save, rather than dropping the rest', () => {
    localStorage.setItem('jambot-midi-v1', JSON.stringify({ drumNotes: { kick: 60 } }));
    const settings = new MidiSettings();
    expect(settings.drumNotes).toEqual({ ...DEFAULT_DRUM_NOTES, kick: 60 });
  });

  /**
   * Jambot's own drum presets before webmidi's, keyed by its drum sounds
   * (`midi/drum-presets.ts` at 5b4685f), as literals: what a save made
   * then holds, and what each sound went out as.
   */
  const OLD_PRESETS: Readonly<Record<string, DrumNotes>> = {
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
  const SOUNDS = Object.keys(DRUM_NOTES) as DrumSound[];

  it('has a preset of webmidi for each of its own before, sending all 7 drum sounds as that one did', () => {
    expect(Object.keys(DRUM_PRESETS)).toEqual(Object.keys(OLD_PRESETS));
    for (const [name, old] of Object.entries(OLD_PRESETS))
      for (const sound of SOUNDS)
        expect(deviceNote(DRUM_PRESETS[name]!, DRUM_NOTES[sound]), `${name}: ${sound}`).toBe(
          old[sound],
        );
  });

  it('reads a save of drum notes by sound as General MIDI notes, every sound going out as before, and writes the new form', () => {
    const custom: DrumNotes = { ...OLD_PRESETS['Novation Circuit']!, kick: 61, ride: 51 };
    for (const [name, old] of [...Object.entries(OLD_PRESETS), ['Custom', custom] as const]) {
      localStorage.setItem('jambot-midi-v1', JSON.stringify({ drumNotes: old, thruChannel: 4 }));
      const settings = new MidiSettings();
      for (const sound of SOUNDS)
        expect(deviceNote(settings.drumMap, DRUM_NOTES[sound]), `${name}: ${sound}`).toBe(
          old[sound],
        );
      expect(settings.drumNotes).toEqual(old);
      expect(presetNameOf(settings.drumMap)).toBe(name);
      expect(settings.thruChannel).toBe(4);

      const saved = JSON.parse(localStorage.getItem('jambot-midi-v1')!);
      expect(saved).not.toHaveProperty('drumNotes');
      expect(saved.drumMap).toEqual(JSON.parse(JSON.stringify(settings.drumMap)));
      expect(drumNotesOf(new MidiSettings().drumMap)).toEqual(old);
    }
  });

  it('names a map set by sound as the preset it matches, and keeps what a preset places beyond the 7 sounds', () => {
    const settings = new MidiSettings();
    settings.drumNotes = OLD_PRESETS['Novation Circuit']!;
    expect(settings.drumMap).toEqual(DRUM_PRESETS['Novation Circuit']);
    settings.drumNotes = { ...settings.drumNotes, kick: 61 };
    expect(presetNameOf(settings.drumMap)).toBe('Custom');
    expect(deviceNote(settings.drumMap, 39)).toBe(62); // the clap, still on the Circuit's second pad
    settings.drumNotes = OLD_PRESETS.GM!;
    expect(settings.drumMap).toEqual({});
  });
});
