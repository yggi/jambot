import { describe, expect, it } from 'vitest';
import { EQUALIZER_FLOOR, equalizerLevels, soundSummary } from './sound.ts';

const ports = {
  inputs: [
    { id: 'in-1', name: 'Keys' },
    { id: 'in-2', name: 'Pads' },
  ],
  outputs: [{ id: 'out-1', name: 'Launchpad' }],
};
const settings = { internal: true, outPortId: 'none', inPortId: 'none' };

describe('what the sound card says', () => {
  it('names the synth and that MIDI is not connected', () => {
    expect(soundSummary(settings, ports, false)).toBe('Synth · MIDI not connected');
    expect(soundSummary({ ...settings, internal: false }, ports, false)).toBe(
      'Synth off · MIDI not connected',
    );
  });

  it('names the ports chosen, the output and the input', () => {
    expect(soundSummary({ ...settings, outPortId: 'out-1' }, ports, true)).toBe(
      'Synth · MIDI out Launchpad',
    );
    expect(soundSummary({ ...settings, inPortId: 'in-2' }, ports, true)).toBe(
      'Synth · MIDI in Pads',
    );
    expect(
      soundSummary({ internal: false, outPortId: 'out-1', inPortId: 'all' }, ports, true),
    ).toBe('Synth off · MIDI out Launchpad, in all inputs');
  });

  it('says so when MIDI is connected and no port is chosen', () => {
    expect(soundSummary(settings, ports, true)).toBe('Synth · MIDI connected, no ports chosen');
  });

  it('says a port chosen before is not there now', () => {
    expect(soundSummary({ ...settings, outPortId: 'gone', inPortId: 'in-1' }, ports, true)).toBe(
      'Synth · MIDI out not found, in Keys',
    );
  });
});

describe('the equalizer', () => {
  const silent = { drums: [], bass: [], comp: [], lead: [] };

  it('has a bar for each performer, at rest when nothing sounds', () => {
    expect(equalizerLevels(silent, 1)).toEqual([0, 0, 0, 0].map(() => EQUALIZER_FLOOR));
  });

  it('lifts the bar of the performer sounding, and more for more notes', () => {
    const one = equalizerLevels({ ...silent, comp: [60] }, 1);
    const three = equalizerLevels({ ...silent, comp: [60, 64, 67] }, 1);
    expect(one[2]).toBeGreaterThan(EQUALIZER_FLOOR);
    expect(three[2]).toBeGreaterThan(one[2]!);
    expect([one[0], one[1], one[3]]).toEqual([EQUALIZER_FLOOR, EQUALIZER_FLOOR, EQUALIZER_FLOOR]);
    expect(
      Math.max(...equalizerLevels({ ...silent, drums: [36, 38, 42, 46, 49, 51, 37, 39] }, 1)),
    ).toBe(1);
  });

  it('follows the volume: louder is taller, and none is at rest', () => {
    const at = (volume: number) => equalizerLevels({ ...silent, lead: [72] }, volume)[3]!;
    expect(at(0)).toBe(EQUALIZER_FLOOR);
    expect(at(1)).toBeGreaterThan(at(0.5));
    expect(at(0.5)).toBeGreaterThan(at(0));
  });
});
