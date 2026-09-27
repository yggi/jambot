import { DEFAULT_CHANNELS } from '../audio/midi-out.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { MidiSettings } from './settings.svelte.ts';

beforeEach(() => localStorage.clear());

describe('MidiSettings', () => {
  it('opens with the built-in synth on, default channels, and no MIDI', () => {
    const settings = new MidiSettings();
    expect(settings.internal).toBe(true);
    expect(settings.channels).toEqual(DEFAULT_CHANNELS);
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
    settings.clock = true;
    settings.thru = true;
    settings.thruChannel = 3;
    settings.outPortId = 'device-out';
    settings.inPortId = 'all';

    const reopened = new MidiSettings();
    expect(reopened.internal).toBe(false);
    expect(reopened.channels).toEqual({ lead: 5, bass: 6, pad: 7, stab: 7, drums: 8 });
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
});
