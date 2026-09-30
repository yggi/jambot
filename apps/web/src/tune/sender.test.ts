import { describe, expect, it } from 'vitest';
import type { Part } from '@jambot/engine';
import type { MidiPort } from '../audio/midi-out.ts';
import { HOLD_SECONDS, SYNTH, ToneSender, VELOCITY } from './sender.svelte.ts';

/** Two MIDI ports and a synth, each keeping what it is sent. */
function world() {
  const sent: Record<string, (readonly number[])[]> = { a: [], b: [] };
  const portOf = (id: string): MidiPort => ({ send: (data) => void sent[id]!.push(data) });
  const synth = {
    plays: [] as { part: string; note: number; velocity: number; at: number; duration: number }[],
    silenced: 0,
    now: 100,
  };
  const connected = new Set(['a', 'b']);
  const output = {
    get currentTime() {
      return synth.now;
    },
    play: (part: Part, note: number, velocity: number, at: number, duration: number) =>
      void synth.plays.push({ part, note, velocity, at, duration }),
    silence: () => void synth.silenced++,
  };
  const sender = new ToneSender({
    ports: () => [
      { id: 'a', name: 'Synth A' },
      { id: 'b', name: 'Synth B' },
    ],
    port: (id) => (connected.has(id) ? portOf(id) : null),
    synth: () => output,
  });
  return { sender, sent, synth, connected };
}

describe('the tone sender', () => {
  it('offers this device’s synth first, then every port there is', () => {
    const { sender } = world();
    expect(sender.destinations).toEqual([
      { id: SYNTH, name: 'This device’s synth' },
      { id: 'a', name: 'Synth A' },
      { id: 'b', name: 'Synth B' },
    ]);
    expect(sender.destination).toBe(SYNTH);
  });

  it('holds a note on a channel of a port: a note on, and a note off when released', () => {
    const { sender, sent } = world();
    sender.choose('a');
    sender.channel = 3;
    sender.note = 62;
    sender.hold();
    expect(sender.holding).toBe(true);
    expect(sent.a).toEqual([[0x92, 62, VELOCITY]]);
    sender.release();
    expect(sender.holding).toBe(false);
    expect(sent.a).toEqual([
      [0x92, 62, VELOCITY],
      [0x82, 62, 0],
    ]);
    expect(sent.b).toEqual([]);
  });

  it('numbers channels from 1 as a player does, every one of the sixteen', () => {
    for (let channel = 1; channel <= 16; channel++) {
      const { sender, sent } = world();
      sender.choose('a');
      sender.channel = channel;
      sender.hold();
      expect(sent.a![0]![0], `${channel}`).toBe(0x90 + channel - 1);
    }
  });

  it('holds one note at a time: a second hold lets the first go', () => {
    const { sender, sent } = world();
    sender.choose('a');
    sender.hold();
    sender.note = 70;
    sender.hold();
    expect(sent.a).toEqual([
      [0x90, 69, VELOCITY],
      [0x80, 69, 0],
      [0x90, 70, VELOCITY],
    ]);
  });

  it('moves by semitones or octaves, keeps to the notes MIDI has, and follows the note while it is held', () => {
    const { sender, sent } = world();
    sender.choose('a');
    sender.move(-12);
    expect(sender.note).toBe(57);
    expect(sent.a).toEqual([]);
    sender.hold();
    sender.move(1);
    expect(sender.note).toBe(58);
    expect(sent.a!.slice(1)).toEqual([
      [0x80, 57, 0],
      [0x90, 58, VELOCITY],
    ]);
    sender.move(-1000);
    expect(sender.note).toBe(0);
    sender.move(1000);
    expect(sender.note).toBe(127);
  });

  it('lets a held note go from the old channel or port before it sounds on the new one', () => {
    const { sender, sent } = world();
    sender.choose('a');
    sender.hold();
    sender.setChannel(5);
    expect(sent.a).toEqual([
      [0x90, 69, VELOCITY],
      [0x80, 69, 0],
      [0x94, 69, VELOCITY],
    ]);
    sender.choose('b');
    expect(sent.a!.at(-1)).toEqual([0x84, 69, 0]);
    expect(sent.b).toEqual([[0x94, 69, VELOCITY]]);
  });

  it('plays on the synth as the band’s lead, a little ahead and for a long time, and ends by silencing it', () => {
    const { sender, synth } = world();
    sender.note = 60;
    sender.hold();
    expect(synth.plays).toHaveLength(1);
    expect(synth.plays[0]).toMatchObject({
      part: 'lead',
      note: 60,
      velocity: VELOCITY,
      duration: HOLD_SECONDS,
    });
    expect(synth.plays[0]!.at).toBeGreaterThan(100);
    expect(synth.plays[0]!.at).toBeLessThan(100.1);
    sender.release();
    expect(synth.silenced).toBe(1);
    expect(sender.holding).toBe(false);
  });

  it('retunes a synth note that is held by ending it and sounding the next', () => {
    const { sender, synth } = world();
    sender.hold();
    sender.move(2);
    expect(synth.silenced).toBe(1);
    expect(synth.plays.map((p) => p.note)).toEqual([69, 71]);
  });

  it('says so, and holds nothing, when the port is not there', () => {
    const { sender, sent, connected } = world();
    sender.choose('a');
    connected.delete('a');
    sender.hold();
    expect(sender.holding).toBe(false);
    expect(sender.message).toMatch(/not connected/);
    expect(sent.a).toEqual([]);
    connected.add('a');
    sender.hold();
    expect(sender.message).toBe('');
    expect(sender.holding).toBe(true);
  });

  it('does not send a note off for a note it does not hold', () => {
    const { sender, sent, synth } = world();
    sender.choose('a');
    sender.release();
    expect(sent.a).toEqual([]);
    sender.choose(SYNTH);
    sender.release();
    expect(synth.silenced).toBe(0);
  });

  it('puts everything right with a panic: a note off and all-notes-off on the channel', () => {
    const { sender, sent } = world();
    sender.choose('a');
    sender.channel = 2;
    sender.hold();
    sender.panic();
    expect(sender.holding).toBe(false);
    expect(sent.a).toEqual([
      [0x91, 69, VELOCITY],
      [0x81, 69, 0],
      [0xb1, 123, 0],
      [0xb1, 120, 0],
    ]);
  });

  it('keeps the channel and the note to the ranges of MIDI', () => {
    const { sender } = world();
    sender.setChannel(0);
    expect(sender.channel).toBe(1);
    sender.setChannel(99);
    expect(sender.channel).toBe(16);
    sender.setChannel(Number.NaN);
    expect(sender.channel).toBe(16);
  });
});
