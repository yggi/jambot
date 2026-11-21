// @vitest-environment node
import { DRUM_NOTES, LOOKAHEAD, STRAIGHT, type Timbre } from '@jambot/engine';
import {
  DRUM_PRESETS,
  type MidiPort,
  clockOffset,
  fromJambot,
  withCrossing,
} from '@yggi/webmidi/core';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BAND, type BandRoute, bandRoutes, nameByPorts } from '../midi/patch.ts';
import { bandOutput, type BandOutputSettings } from './band-output.ts';
import {
  DEFAULT_CHANNELS,
  DEFAULT_DRUM_NOTES,
  type DrumNotes,
  type PartChannels,
} from '../midi/channels.ts';
import type { Output } from './output.ts';

const NOTE_ON = 0x90;
/** The minute of a band, as recorded: one message a line, its bytes in hex and its timestamp in ms (`RECORD_MINUTE=1` records it anew). */
const MINUTE = new URL('./band-output.minute.txt', import.meta.url);

// (every field a pitched voice reads, so any part may be played with it, #341)
const timbre: Required<Omit<Timbre, 'sound'>> = {
  triangle: 1,
  square: 0,
  saw: 0,
  cutoff: 1000,
  resonance: 1,
  attack: 0.01,
  release: 0.1,
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

/** One output's route, as `bandRoutes` makes them: the defaults, no port. */
const route = (over: Partial<BandRoute> = {}): BandRoute => ({
  key: 'o1',
  port: null,
  channels: DEFAULT_CHANNELS,
  drumNotes: DEFAULT_DRUM_NOTES,
  clock: false,
  latency: 0,
  ...over,
});

/** Settings of one output, changed through `state` as the old settings were: port, channels, drum notes, clock. */
function fakeSettings() {
  const state: {
    internal: boolean;
    port: MidiPort | null;
    channels: PartChannels;
    drumNotes: DrumNotes;
    clock: boolean;
  } = {
    internal: true,
    port: null,
    channels: DEFAULT_CHANNELS,
    drumNotes: DEFAULT_DRUM_NOTES,
    clock: false,
  };
  const settings: BandOutputSettings = {
    internal: () => state.internal,
    outputs: () => [route(state)],
  };
  return { settings, state };
}

describe('bandOutput', () => {
  describe('a part on several channels of one output (webmidi decision 010)', () => {
    /** One output whose lead is on channels 1 and 3, the drums on 10 and 12, the bass on 2 alone. */
    function layered() {
      const base = fakeBase();
      const { port, sent } = fakePort();
      const clock = base.output as { currentTime: number };
      const output = bandOutput(
        {
          internal: () => true,
          outputs: () => [route({ port, channels: { lead: [1, 3], bass: 2, drums: [10, 12] } })],
        },
        base.output,
        clockOffset(base.output, () => clock.currentTime * 1000),
      );
      void output.currentTime;
      return { clock, output, sent };
    }

    it('sends a note-on and its note-off on every channel, ascending, at one timestamp each', () => {
      const { clock, output, sent } = layered();
      output.play('lead', 60, 100, 0.1, 0.2, timbre);
      output.play('bass', 40, 90, 0.1, 0.2, timbre);
      clock.currentTime = 0.25;
      output.tick?.([step(0.25, 0.5)]);
      expect(sent.map((m) => [m.data, Math.round(m.timestamp)])).toEqual([
        [[NOTE_ON | 0, 60, 100], 100],
        [[NOTE_ON | 2, 60, 100], 100],
        [[NOTE_ON | 1, 40, 90], 100],
        [[0x80 | 0, 60, 0], 300],
        [[0x80 | 2, 60, 0], 300],
        [[0x80 | 1, 40, 0], 300],
      ]);
    });

    it('sends a drum hit on each channel through the device’s drum notes', () => {
      const { output, sent } = layered();
      output.play('drums', DRUM_NOTES.kick, 100, 0.1, 0.05, timbre);
      expect(sent.map((m) => m.data)).toEqual([
        [NOTE_ON | 9, 36, 100],
        [NOTE_ON | 11, 36, 100],
      ]);
    });

    it('releases both channels on a stop and on the panic button', () => {
      for (const stop of ['silence', 'panic'] as const) {
        const { output, sent } = layered();
        output.play('lead', 60, 100, 0.1, 30, timbre);
        sent.length = 0;
        output[stop]?.();
        const offs = sent.filter((m) => (m.data[0]! & 0xf0) === 0x80).map((m) => m.data);
        expect(offs, stop).toEqual([
          [0x80 | 0, 60, 0],
          [0x80 | 2, 60, 0],
        ]);
      }
    });

    it('adopts a changed set of channels, releasing the notes of the channels it leaves', () => {
      const base = fakeBase();
      const { port, sent } = fakePort();
      let channels: PartChannels = { lead: [1, 3] };
      const output = bandOutput(
        { internal: () => true, outputs: () => [route({ port, channels })] },
        base.output,
      );
      void output.currentTime;
      output.play('lead', 60, 100, 0, 30, timbre);
      sent.length = 0;
      channels = { lead: 1 };
      void output.currentTime;
      expect(sent.some((m) => (m.data[0]! & 0xf0) === 0x80 && m.data[0] === 0x82)).toBe(true);
    });
  });

  it('plays the built-in synth when there is no MIDI port', () => {
    const base = fakeBase();
    const { settings } = fakeSettings();
    const output = bandOutput(settings, base.output);
    output.play('lead', 60, 100, 0, 1, timbre);
    expect(base.plays).toEqual([['lead', 60, 100, 0, 1, timbre]]);
  });

  it('sends MIDI once a port is set, alongside the built-in synth', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(settings, base.output);
    void output.currentTime; // settings are adopted when the clock is read, as the player does each tick
    output.play('lead', 60, 100, 0, 1, timbre);
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
    output.play('bass', 43, 100, 0, 1, timbre);
    expect(base.plays).toHaveLength(0);
    expect(sent[0]!.data[0]).toBe(NOTE_ON | 1);
  });

  it('plays on the built-in synth only the parts it is patched to, part by part, and sends MIDI for each', () => {
    const base = fakeBase();
    const { port, sent } = fakePort();
    const settings: BandOutputSettings = {
      internal: (part) => part === 'drums',
      outputs: () => [route({ port })],
    };
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 1, timbre);
    output.play('drums', 36, 100, 0, 1, timbre);
    expect(base.plays.map((p) => p[0])).toEqual(['drums']);
    expect(sent).toHaveLength(2);
  });

  it('sends nothing over MIDI without a port, even with the synth on', () => {
    const base = fakeBase();
    const { settings } = fakeSettings();
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 1, timbre);
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
    output.play('lead', 60, 100, 0, 10, timbre);
    state.port = portB;
    void output.currentTime;
    expect(sentB).toEqual([]); // the switch itself silences the OLD port, not the new one
    output.play('lead', 62, 100, 1, 1, timbre);
    expect(sentB.some((m) => m.data[0] === (NOTE_ON | 0) && m.data[1] === 62)).toBe(true);
  });

  it('remaps a drum note through the configured drum note map, leaving other parts alone', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    state.drumNotes = { ...DEFAULT_DRUM_NOTES, kick: 60 };
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('drums', DEFAULT_DRUM_NOTES.kick, 100, 0, 0.1, timbre);
    output.play('lead', 60, 100, 0, 1, timbre);
    expect(sent.map((m) => m.data)).toEqual([
      [NOTE_ON | 9, 60, 100],
      [NOTE_ON | 0, 60, 100],
    ]);
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
        swing: STRAIGHT,
        pulse: { start: 0, length: 4 },
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
        swing: STRAIGHT,
        pulse: { start: 0, length: 4 },
      },
    ]);
    expect(sent.filter((m) => m.data[0] === 0xf8)).toHaveLength(6);
  });

  it('sends MIDI Start 2 ms before the first tick of a run, and only with the clock on', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(
      settings,
      base.output,
      clockOffset(base.output, () => 0),
    );
    void output.currentTime;
    output.starting?.(2);
    output.tick?.([step(2, 0.5)]);
    expect(sent).toEqual([]); // the clock is off
    state.clock = true;
    void output.currentTime;
    output.starting?.(2);
    output.tick?.([step(2, 0.5)]);
    expect(sent[0]).toEqual({ data: [0xfa], timestamp: 1998 });
    expect(sent.slice(1).map((m) => m.data)).toEqual(Array(6).fill([0xf8]));
  });

  it('panics MIDI alone, without touching the built-in synth or stopping playback', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 10, timbre);
    sent.length = 0;
    output.panic?.();
    expect(base.silenced).toBe(0);
    expect(sent.some((m) => m.data[1] === 123)).toBe(true); // all notes off (CC 123)
  });

  it('silences the built-in synth and stops MIDI together: Stop after the last tick, and no clock message after it', () => {
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
    output.starting?.(1);
    output.tick?.([step(1, 0.5)]);
    output.silence();
    expect(base.silenced).toBe(1);
    const realtime = sent.filter((m) => m.data[0]! >= 0xf8);
    expect(realtime.at(-1)!.data).toEqual([0xfc]);
    expect(realtime.filter((m) => m.data[0] === 0xfc)).toHaveLength(1);
    const lastTick = Math.max(
      ...realtime.filter((m) => m.data[0] === 0xf8).map((m) => m.timestamp),
    );
    expect(realtime.at(-1)!.timestamp).toBeGreaterThan(lastTick);
    // a stop with no run going stops nothing
    sent.length = 0;
    output.silence();
    expect(sent.some((m) => m.data[0] === 0xfc)).toBe(false);
  });

  it('lets notes sent ahead sound on to their ends within the lookahead on a stop, each released exactly, and cuts the rest then', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(
      settings,
      base.output,
      clockOffset(base.output, () => 0),
    );
    void output.currentTime;
    output.play('lead', 60, 100, 0.05, 0.05, timbre); // ends inside the tail: sounds out
    output.play('bass', 40, 100, 0.05, 10, timbre); // held far longer: cut at the tail's end
    sent.length = 0;
    output.silence();
    expect(sent.map((m) => [m.data, Math.round(m.timestamp)])).toEqual([
      [[0x80 | 0, 60, 0], 100],
      [[0x80 | 1, 40, 0], (LOOKAHEAD + 0.4) * 1000],
    ]);
  });

  it('sweeps every channel on the panic button, whatever was sent: All notes off, All sound off, sustain off', () => {
    const base = fakeBase();
    const { settings, state } = fakeSettings();
    const { port, sent } = fakePort();
    state.port = port;
    const output = bandOutput(settings, base.output);
    void output.currentTime;
    output.panic?.(); // nothing played yet: a reload left hardware sounding
    const swept = sent.map((m) => m.data);
    for (let ch = 0; ch < 16; ch++)
      for (const controller of [123, 120, 64])
        expect(swept).toContainEqual([0xb0 | ch, controller, 0]);
    expect(swept).toHaveLength(48);
  });

  it('sends a part to every output it is routed to, each on its channel and with its device’s drum notes', () => {
    const base = fakeBase();
    const a = fakePort();
    const b = fakePort();
    const circuit = { ...DEFAULT_DRUM_NOTES, kick: 60 };
    const output = bandOutput(
      {
        internal: () => true,
        outputs: () => [
          route({ key: 'o1', port: a.port, channels: { lead: 1, drums: 10 } }),
          route({
            key: 'o2',
            port: b.port,
            channels: { lead: 4, bass: 2, drums: 10 },
            drumNotes: circuit,
          }),
        ],
      },
      base.output,
    );
    void output.currentTime;
    output.play('lead', 72, 100, 0, 1, timbre);
    output.play('bass', 40, 100, 0, 1, timbre);
    output.play('drums', DRUM_NOTES.kick, 100, 0, 0.1, timbre);
    expect(a.sent.map((m) => m.data)).toEqual([
      [NOTE_ON | 0, 72, 100],
      [NOTE_ON | 9, 36, 100],
    ]);
    expect(b.sent.map((m) => m.data)).toEqual([
      [NOTE_ON | 3, 72, 100],
      [NOTE_ON | 1, 40, 100],
      [NOTE_ON | 9, 60, 100],
    ]);
  });

  it('sends the clock to the outputs of the clock row alone, and start and stop with it', () => {
    const base = fakeBase();
    const a = fakePort();
    const b = fakePort();
    const output = bandOutput(
      {
        internal: () => true,
        outputs: () => [
          route({ key: 'o1', port: a.port, clock: false }),
          route({ key: 'o2', port: b.port, clock: true }),
        ],
      },
      base.output,
    );
    void output.currentTime;
    output.starting?.(1);
    output.tick?.([step(1, 0.5)]);
    output.silence();
    const realtime = (sent: { data: number[] }[]) => sent.filter((m) => m.data[0]! >= 0xf8);
    expect(realtime(a.sent)).toEqual([]);
    expect(realtime(b.sent).map((m) => m.data[0])).toEqual([0xfa, ...Array(6).fill(0xf8), 0xfc]);
  });

  it('sends an output its device’s latency earlier', () => {
    const base = fakeBase();
    const a = fakePort();
    const output = bandOutput(
      { internal: () => true, outputs: () => [route({ port: a.port, latency: 8 })] },
      base.output,
      clockOffset(base.output, () => 0),
    );
    void output.currentTime;
    output.play('lead', 60, 100, 1, 1, timbre);
    expect(a.sent).toEqual([{ data: [NOTE_ON | 0, 60, 100], timestamp: 992 }]);
  });

  it('silences an output that leaves the setup, and sends it nothing more', () => {
    const base = fakeBase();
    const a = fakePort();
    const b = fakePort();
    let outputs = [route({ key: 'o1', port: a.port }), route({ key: 'o2', port: b.port })];
    const output = bandOutput({ internal: () => true, outputs: () => outputs }, base.output);
    void output.currentTime;
    output.play('lead', 60, 100, 0, 10, timbre);
    outputs = [outputs[0]!];
    void output.currentTime;
    expect(b.sent.some((m) => m.data[0] === 0xb0 && m.data[1] === 123)).toBe(true);
    const before = b.sent.length;
    output.play('lead', 62, 100, 1, 1, timbre);
    expect(b.sent).toHaveLength(before);
    expect(a.sent.at(-1)!.data).toEqual([NOTE_ON | 0, 62, 100]);
  });
});

/** A step of the transport, as `tick` takes it: only its time and length are read here. */
const step = (seconds: number, length: number, index = 0) => ({
  step: index,
  section: {} as never,
  key: {} as never,
  chord: {} as never,
  seconds,
  length,
  swing: STRAIGHT,
  pulse: { start: 0, length: 4 },
});

describe('a store from before the book, migrated', () => {
  const PORTS = {
    inputs: [{ id: 'in-1', name: 'Keys' }],
    outputs: [
      { id: 'out-1', name: 'Circuit' },
      { id: 'out-2', name: 'Other' },
    ],
  };
  const PREFS = {
    internal: true,
    channels: { lead: 4, bass: 2, pad: 3, stab: 3, drums: 10 },
    drumMap: DRUM_PRESETS['Novation Circuit']!,
    clock: true,
    thru: true,
    thruChannel: 5,
    outPortId: 'out-1',
    inPortId: 'in-1',
  };

  /**
   * A minute of a band, as the player drives an output: the clock read,
   * Start, steps ticked (each with its own index, as the transport counts
   * them), every part played (the pad and the stab on one channel and
   * pitch, overlapping), a drum of every sound, a channel moved while
   * playing, a panic, and the stop. The audio clock and the page's run
   * together, so the offset between them holds, as a device's does.
   */
  function minute() {
    const base = fakeBase();
    const { port, sent } = fakePort();
    const clock = base.output as { currentTime: number };
    // migrated with no ports seen, then named once they are, as the device does
    let book = nameByPorts(fromJambot(PREFS, { inputs: [], outputs: [] }), PORTS);
    const output = bandOutput(
      {
        internal: () => true,
        outputs: () => bandRoutes(book, (o) => (o.id === 'out-1' ? port : null)),
      },
      base.output,
      clockOffset(base.output, () => clock.currentTime * 1000),
    );
    void output.currentTime;
    output.starting?.(0.1);
    const length = 60 / 120 / 4;
    for (let i = 0; i < 64; i++) {
      const seconds = 0.1 + i * length;
      clock.currentTime = Math.max(0, seconds - LOOKAHEAD);
      if (i === 40) book = withCrossing(book, BAND, 'lead', 'o1', 7);
      void output.currentTime;
      output.tick?.([step(seconds, length, i)]);
      const drum = Object.values(DRUM_NOTES)[i % Object.keys(DRUM_NOTES).length]!;
      output.play('drums', drum, 90 + (i % 30), seconds, length / 2, timbre);
      if (i % 4 === 0) output.play('bass', 40 + (i % 12), 100, seconds, length * 3, timbre);
      if (i % 8 === 0) output.play('pad', 64, 70, seconds, length * 8, timbre);
      if (i % 8 === 4) output.play('stab', 64, 110, seconds, length, timbre);
      if (i % 2 === 0) output.play('lead', 72 + (i % 7), 95, seconds, length * 1.5, timbre);
      if (i === 50) output.panic?.();
    }
    clock.currentTime += 1;
    output.silence();
    return sent;
  }

  const text = (sent: { data: number[]; timestamp: number }[]) =>
    sent.map((m) => `${m.data.map((b) => b.toString(16)).join(' ')} @${m.timestamp.toFixed(3)}`);

  it('sends the same bytes at the same times as recorded (decision 008: its panic and stop are webmidi’s)', () => {
    const sent = text(minute()).join('\n');
    if (process.env.RECORD_MINUTE) writeFileSync(MINUTE, sent);
    expect(sent).toBe(readFileSync(MINUTE, 'utf8'));
  });

  it('plays the minute within the device’s bounds: every note off once, nothing sounding after the stop, no clock message after Stop, ticks evenly spaced', () => {
    const sent = minute();
    const held = new Map<string, number>();
    for (const { data } of sent) {
      const [status, note] = [data[0]! & 0xf0, data[1]!];
      const key = `${data[0]! & 15}:${note}`;
      if (status === 0x90) held.set(key, (held.get(key) ?? 0) + 1);
      if (status === 0x80) held.set(key, Math.max(0, (held.get(key) ?? 0) - 1));
    }
    // (a retrigger is an off then an on, so each key ends at 0 held)
    expect([...held.values()].filter((n) => n > 0)).toEqual([]);
    const stop = sent.findIndex((m) => m.data[0] === 0xfc);
    expect(stop).toBeGreaterThan(0);
    const ticks = sent.filter((m) => m.data[0] === 0xf8).map((m) => m.timestamp);
    expect(Math.max(...ticks)).toBeLessThan(sent[stop]!.timestamp);
    expect(sent.slice(stop + 1).filter((m) => m.data[0]! >= 0xf8)).toEqual([]);
    const gaps = ticks.slice(1).map((t, i) => t - ticks[i]!);
    // (62.5 ms a step of 125 ms, 6 ticks: one tick every 20.833 ms)
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(0.12);
  });
});
