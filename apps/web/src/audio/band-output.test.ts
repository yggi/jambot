import type { Sound } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { bandOutput, type BandOutputSettings } from './band-output.ts';
import { clockOffset } from './clock-offset.ts';
import { DEFAULT_CHANNELS, type Channels, type MidiPort } from './midi-out.ts';
import type { Output } from './output.ts';

const NOTE_ON = 0x90;

const sound: Sound = {
  lead: { triangle: 1, square: 0, cutoff: 1000, attack: 0.01 },
  bass: { saw: 1, triangle: 0, cutoff: 1, resonance: 4 },
  chords: { attack: 0.1, release: 0.2 },
};

/** A base `Output` a test drives by hand, standing in for Web Audio. */
function fakeBase() {
  const plays: unknown[][] = [];
  let silenced = 0;
  const output: Output = {
    currentTime: 0,
    latency: 0,
    resume: () => Promise.resolve(),
    play: (...args) => void plays.push(args),
    silence: () => void silenced++,
  };
  return {
    output,
    plays,
    get silenced() {
      return silenced;
    },
  };
}

function fakePort() {
  const sent: { data: number[]; timestamp: number }[] = [];
  const port: MidiPort = {
    send: (data, timestamp = 0) => void sent.push({ data: [...data], timestamp }),
  };
  return { port, sent };
}

function fakeSettings() {
  const state: { internal: boolean; port: MidiPort | null; channels: Channels; clock: boolean } = {
    internal: true,
    port: null,
    channels: DEFAULT_CHANNELS,
    clock: false,
  };
  const settings: BandOutputSettings = {
    internal: () => state.internal,
    port: () => state.port,
    channels: () => state.channels,
    clock: () => state.clock,
  };
  return { settings, state };
}

describe('bandOutput', () => {
  it('plays the built-in synth when there is no MIDI port', () => {
    const base = fakeBase();
    const { settings } = fakeSettings();
    const output = bandOutput(settings, base.output);
    output.play('lead', 60, 100, 0, 1, sound);
    expect(base.plays).toEqual([['lead', 60, 100, 0, 1, sound]]);
  });

  it('sends MIDI once a port is set, alongside the built-in synth', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(settings, base.output);
    void output.currentTime; // settings are adopted when the clock is read, as the player does each tick
    output.play('lead', 60, 100, 0, 1, sound);
    expect(base.plays).toHaveLength(1);
    expect(sent[0]!.data[0]).toBe(NOTE_ON | 0);
  });

  it('skips the built-in synth when it is turned off, but still sends MIDI', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    state.internal = false;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('bass', 43, 100, 0, 1, sound);
    expect(base.plays).toHaveLength(0);
    expect(sent[0]!.data[0]).toBe(NOTE_ON | 1);
  });

  it('sends nothing over MIDI without a port, even with the synth on', () => {
    const base = fakeBase();
    const { settings } = fakeSettings();
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 1, sound);
    expect(base.plays).toHaveLength(1);
  });

  it('adopts a new port as soon as the clock is read, silencing the old one first', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port: portA } = fakePort();
    const { port: portB, sent: sentB } = fakePort();
    state.port = portA;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 10, sound);
    state.port = portB;
    void output.currentTime;
    expect(sentB).toEqual([]); // the switch itself silences the OLD port, not the new one
    output.play('lead', 62, 100, 1, 1, sound);
    expect(sentB.some((m) => m.data[0] === (NOTE_ON | 0) && m.data[1] === 62)).toBe(true);
  });

  it('sends a clock tick per step only when the clock setting is on', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.tick?.([
      {
        step: 0,
        section: {} as never,
        key: {} as never,
        chord: {} as never,
        seconds: 0,
        length: 0.5,
        swing: 0,
      },
    ]);
    expect(sent).toEqual([]);
    state.clock = true;
    void output.currentTime;
    output.tick?.([
      {
        step: 0,
        section: {} as never,
        key: {} as never,
        chord: {} as never,
        seconds: 0,
        length: 0.5,
        swing: 0,
      },
    ]);
    expect(sent.filter((m) => m.data[0] === 0xf8)).toHaveLength(6);
  });

  it('sends MIDI start only through the starting hook, and only with the clock on', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    state.clock = true;
    const output = bandOutput(
      settings,
      base.output,
      clockOffset(base.output, () => 0),
    );
    void output.currentTime;
    output.starting?.(2);
    expect(sent).toEqual([{ data: [0xfa], timestamp: 1998 }]);
  });

  it('panics MIDI alone, without touching the built-in synth or stopping playback', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 10, sound);
    sent.length = 0;
    output.panic?.();
    expect(base.silenced).toBe(0);
    expect(sent.some((m) => m.data[1] === 123)).toBe(true); // all notes off (CC 123)
  });

  it('silences the built-in synth and stops MIDI together', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    state.clock = true;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.silence();
    expect(base.silenced).toBe(1);
    expect(sent.some((m) => m.data[0] === 0xfc)).toBe(true);
  });
});
