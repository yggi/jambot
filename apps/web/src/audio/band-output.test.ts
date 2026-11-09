// @vitest-environment node
import { DRUM_NOTES, LOOKAHEAD, STRAIGHT, type Part, type Timbre } from '@jambot/engine';
import {
  DRUM_PRESETS,
  type ClockOffset,
  clockOffset,
  fromJambot,
  withCrossing,
} from '@yggi/webmidi/core';
import { describe, expect, it } from 'vitest';
import { BAND, type BandRoute, bandRoutes, nameByPorts } from '../midi/patch.ts';
import { bandOutput, type BandOutputSettings } from './band-output.ts';
import {
  DEFAULT_CHANNELS,
  DEFAULT_DRUM_NOTES,
  MidiOut,
  type Channels,
  type DrumNotes,
  type MidiPort,
  type PartChannels,
} from './midi-out.ts';
import type { Output } from './output.ts';

const NOTE_ON = 0x90;

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
    output.play('lead', 60, 100, 0, 10, timbre);
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
const step = (seconds: number, length: number) => ({
  step: 0,
  section: {} as never,
  key: {} as never,
  chord: {} as never,
  seconds,
  length,
  swing: STRAIGHT,
  pulse: { start: 0, length: 4 },
});

/**
 * The band's output as it was before the book of setups (7113d55,
 * `audio/band-output.ts`), its MIDI half as a literal: one port, the
 * channels, the drum notes and the clock, each read live.
 */
function oldBandOutput(
  settings: {
    port(): MidiPort | null;
    channels(): Channels;
    drumNotes(): DrumNotes;
    clock(): boolean;
  },
  base: Output,
  offset: ClockOffset,
) {
  const midi = new MidiOut(settings.channels(), settings.clock(), settings.drumNotes());
  return {
    get currentTime() {
      midi.setClock(settings.clock());
      midi.setChannels(settings.channels(), base.currentTime, offset.toDeviceMs);
      midi.setDrumNotes(settings.drumNotes());
      midi.setPort(settings.port(), base.currentTime, offset.toDeviceMs);
      return base.currentTime;
    },
    play(part: Part, note: number, velocity: number, seconds: number, duration: number) {
      midi.play(part, note, velocity, seconds, duration, offset.toDeviceMs);
    },
    silence() {
      midi.stop(base.currentTime, offset.toDeviceMs);
    },
    panic() {
      midi.panic(base.currentTime, offset.toDeviceMs);
    },
    starting(seconds: number) {
      midi.start(seconds, offset.toDeviceMs);
    },
    tick(steps: { seconds: number; length: number }[]) {
      offset.update();
      midi.advance(base.currentTime + LOOKAHEAD, offset.toDeviceMs);
      for (const s of steps)
        for (let tick = 0; tick < 6; tick++)
          midi.clockTick(s.seconds + (tick * s.length) / 6, offset.toDeviceMs);
    },
  };
}

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
   * Start, steps ticked, every part played (the pad and the stab on one
   * channel and pitch, overlapping), a drum of every sound, a channel moved
   * while playing, a panic, and the stop.
   */
  function play(
    output: {
      readonly currentTime: number;
      play(
        part: Part,
        note: number,
        velocity: number,
        seconds: number,
        duration: number,
        timbre: Timbre,
      ): void;
      silence(): void;
      panic?(): void;
      starting?(seconds: number): void;
      tick?(steps: ReturnType<typeof step>[]): void;
    },
    base: { currentTime: number },
    moveLead: () => void,
  ) {
    void output.currentTime;
    output.starting?.(0.1);
    const length = 60 / 120 / 4;
    for (let i = 0; i < 64; i++) {
      const seconds = 0.1 + i * length;
      base.currentTime = Math.max(0, seconds - LOOKAHEAD);
      if (i === 40) moveLead();
      void output.currentTime;
      output.tick?.([step(seconds, length)]);
      const drum = Object.values(DRUM_NOTES)[i % Object.keys(DRUM_NOTES).length]!;
      output.play('drums', drum, 90 + (i % 30), seconds, length / 2, timbre);
      if (i % 4 === 0) output.play('bass', 40 + (i % 12), 100, seconds, length * 3, timbre);
      if (i % 8 === 0) output.play('pad', 64, 70, seconds, length * 8, timbre);
      if (i % 8 === 4) output.play('stab', 64, 110, seconds, length, timbre);
      if (i % 2 === 0) output.play('lead', 72 + (i % 7), 95, seconds, length * 1.5, timbre);
      if (i === 50) output.panic?.();
    }
    base.currentTime += 1;
    output.silence();
  }

  it('sends the same bytes at the same times as the band’s output did before', () => {
    const before = (() => {
      const base = fakeBase();
      const { port, sent } = fakePort();
      let channels: Channels = PREFS.channels;
      const old = oldBandOutput(
        {
          port: () => port,
          channels: () => channels,
          drumNotes: () => bandRoutes(fromJambot(PREFS, PORTS), () => null)[0]!.drumNotes,
          clock: () => PREFS.clock,
        },
        base.output,
        clockOffset(base.output, () => 0),
      );
      play(old, base.output, () => (channels = { ...channels, lead: 7 }));
      return sent;
    })();

    const after = (() => {
      const base = fakeBase();
      const { port, sent } = fakePort();
      // migrated with no ports seen, then named once they are, as the device does
      let book = nameByPorts(fromJambot(PREFS, { inputs: [], outputs: [] }), PORTS);
      const output = bandOutput(
        {
          internal: () => true,
          outputs: () => bandRoutes(book, (o) => (o.id === 'out-1' ? port : null)),
        },
        base.output,
        clockOffset(base.output, () => 0),
      );
      play(output, base.output, () => (book = withCrossing(book, BAND, 'lead', 'o1', 7)));
      return sent;
    })();

    expect(before.length).toBeGreaterThan(300);
    expect(before.some((m) => m.data[0] === 0xf8)).toBe(true);
    expect(before.some((m) => m.data[0] === (0x90 | 9) && m.data[1] === 60)).toBe(true);
    expect(after).toEqual(before);
  });
});
