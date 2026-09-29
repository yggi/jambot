// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_DRUM_NOTES } from '../audio/midi-out.ts';
import { DRUM_NOTE_PRESETS, presetNameOf } from './drum-presets.ts';

describe('DRUM_NOTE_PRESETS', () => {
  it('GM is exactly the notes the engine already writes', () => {
    expect(DRUM_NOTE_PRESETS.GM).toEqual(DEFAULT_DRUM_NOTES);
  });

  it('Novation Circuit sends only the four notes its Drum Notes Table gives (60, 62, 64, 65)', () => {
    expect(DRUM_NOTE_PRESETS['Novation Circuit']).toEqual({
      kick: 60,
      rim: 62,
      snare: 62,
      closedHat: 64,
      pedalHat: 64,
      openHat: 65,
      ride: 65,
    });
    for (const note of Object.values(DRUM_NOTE_PRESETS['Novation Circuit']!))
      expect([60, 62, 64, 65]).toContain(note);
  });
});

describe('presetNameOf', () => {
  it('names the GM preset for the default notes', () => {
    expect(presetNameOf(DEFAULT_DRUM_NOTES)).toBe('GM');
  });

  it('names the Novation Circuit preset for its notes', () => {
    expect(presetNameOf(DRUM_NOTE_PRESETS['Novation Circuit']!)).toBe('Novation Circuit');
  });

  it('is null for a map matching no preset', () => {
    expect(presetNameOf({ ...DEFAULT_DRUM_NOTES, kick: 61 })).toBeNull();
  });
});
