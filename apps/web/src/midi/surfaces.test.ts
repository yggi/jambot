import { DRUM_NOTES } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  COMPUTER_KEY_MAP,
  DRUM_CHANNEL,
  DRUM_KEY_MAP,
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  ignoreKeyEvent,
  isBlackKey,
  keyboardLayout,
  scaleLayout,
  parseMidiMessage,
  partOf,
} from './surfaces.ts';

describe('parseMidiMessage', () => {
  it('reads a note-on with velocity as an onset', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      on: true,
      note: 60,
      velocity: 100,
      channel: 0,
    });
  });

  it('reads a note-on with velocity 0 as a release, as the spec allows', () => {
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({
      on: false,
      note: 60,
      velocity: 0,
      channel: 0,
    });
  });

  it('reads a note-off as a release whatever its velocity byte', () => {
    expect(parseMidiMessage([0x80, 60, 64])).toEqual({
      on: false,
      note: 60,
      velocity: 0,
      channel: 0,
    });
  });

  it('reads a note-on or note-off on every channel nibble', () => {
    for (let channel = 0; channel < 16; channel++) {
      expect(parseMidiMessage([0x90 | channel, 60, 100])).toEqual({
        on: true,
        note: 60,
        velocity: 100,
        channel,
      });
      expect(parseMidiMessage([0x80 | channel, 60, 0])).toEqual({
        on: false,
        note: 60,
        velocity: 0,
        channel,
      });
    }
  });

  it('ignores anything that is not a note message', () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toBeNull(); // control change
    expect(parseMidiMessage([0xf8])).toBeNull(); // clock
    expect(parseMidiMessage([])).toBeNull();
  });
});

describe('partOf', () => {
  it('plays the pads on channel 10, the keyboard on every other', () => {
    expect(DRUM_CHANNEL).toBe(9);
    expect(partOf(9)).toBe('drums');
    for (const channel of [0, 1, 8, 10, 15]) expect(partOf(channel)).toBe('lead');
  });
});

describe('DRUM_KEY_MAP', () => {
  it('maps 1–7 to the pads, kick to ride', () => {
    expect(DRUM_KEY_MAP).toEqual({
      '1': DRUM_NOTES.kick,
      '2': DRUM_NOTES.snare,
      '3': DRUM_NOTES.closedHat,
      '4': DRUM_NOTES.openHat,
      '5': DRUM_NOTES.pedalHat,
      '6': DRUM_NOTES.rim,
      '7': DRUM_NOTES.ride,
    });
  });
});

describe('ignoreKeyEvent', () => {
  const div = document.createElement('div');
  const input = document.createElement('input');
  const select = document.createElement('select');
  const textarea = document.createElement('textarea');

  it('plays a plain key press on a neutral target', () => {
    expect(ignoreKeyEvent(div, false, false)).toBe(false);
  });

  it('ignores a held-key repeat', () => {
    expect(ignoreKeyEvent(div, true, false)).toBe(true);
  });

  it('ignores a modifier chord', () => {
    expect(ignoreKeyEvent(div, false, true)).toBe(true);
  });

  it('ignores keys typed into a field', () => {
    for (const target of [input, select, textarea])
      expect(ignoreKeyEvent(target, false, false)).toBe(true);
  });

  it('ignores a null target', () => {
    expect(ignoreKeyEvent(null, false, false)).toBe(false);
  });
});

describe('COMPUTER_KEY_MAP', () => {
  it('maps a–l and w e t y u o to C4 through D5, as the prototype does', () => {
    expect(COMPUTER_KEY_MAP).toEqual({
      a: 60,
      w: 61,
      s: 62,
      e: 63,
      d: 64,
      f: 65,
      t: 66,
      g: 67,
      y: 68,
      h: 69,
      u: 70,
      j: 71,
      k: 72,
      o: 73,
      l: 74,
    });
  });
});

describe('isBlackKey', () => {
  it('marks every sharp or flat in an octave, and no natural', () => {
    const black = [1, 3, 6, 8, 10];
    for (let n = 0; n < 12; n++) expect(isBlackKey(n)).toBe(black.includes(n));
  });

  it('repeats every octave', () => {
    expect(isBlackKey(60 + 12)).toBe(isBlackKey(60));
    expect(isBlackKey(61 + 24)).toBe(isBlackKey(61));
  });
});

describe('keyboardLayout', () => {
  it('covers every note from low to high, C4 to E5 by default', () => {
    const layout = keyboardLayout();
    expect(layout.map((k) => k.note)).toEqual(
      Array.from({ length: KEYBOARD_HIGH - KEYBOARD_LOW + 1 }, (_, i) => KEYBOARD_LOW + i),
    );
    expect(layout.every((k) => k.black === isBlackKey(k.note))).toBe(true);
  });

  it('spans the white keys edge to edge, first at 0 and last flush with 100', () => {
    const whites = keyboardLayout().filter((k) => !k.black);
    expect(whites[0]!.left).toBe(0);
    const last = whites.at(-1)!;
    expect(last.left + last.width).toBeCloseTo(100, 9);
  });

  it('sits every black key between the two white keys around it', () => {
    for (const key of keyboardLayout().filter((k) => k.black)) {
      const before = keyboardLayout().find((k) => k.note === key.note - 1)!;
      const after = keyboardLayout().find((k) => k.note === key.note + 1)!;
      expect(key.left).toBeGreaterThan(before.left);
      expect(key.left + key.width).toBeLessThan(after.left + after.width);
    }
  });
});

describe('the keyboard locked to a scale', () => {
  it('has a key for each note of the scale alone, each as wide, filling the width', () => {
    const keys = scaleLayout(60, 76, [9, 11, 0, 2, 4, 5, 7]);
    expect(keys.map((k) => k.note)).toEqual([60, 62, 64, 65, 67, 69, 71, 72, 74, 76]);
    for (const [i, key] of keys.entries()) {
      expect(key.black).toBe(false);
      expect(key.width).toBeCloseTo(10, 12);
      expect(key.left).toBeCloseTo(i * 10, 12);
    }
  });

  it('has the pentatonic’s five to an octave', () => {
    expect(scaleLayout(60, 71, [9, 0, 2, 4, 7]).map((k) => k.note % 12)).toEqual([0, 2, 4, 7, 9]);
  });
});
