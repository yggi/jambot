import { DRUM_NOTES, LOOKAHEAD, PARTS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CHANNELS, DEFAULT_DRUM_NOTES, MidiOut, type MidiPort } from './midi-out.ts';

/** A port that only remembers what it was sent, in order. */
function fakePort() {
  const sent: { data: number[]; timestamp: number }[] = [];
  const port: MidiPort = {
    send(data, timestamp = 0) {
      sent.push({ data: [...data], timestamp });
    },
  };
  return { port, sent };
}

/** Seconds to milliseconds, one to one, so timestamps in tests read as seconds. */
const toDeviceMs = (seconds: number) => seconds * 1000;

const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const CC = 0xb0;
const ALL_NOTES_OFF = 123;

describe('MidiOut', () => {
  it('sends nothing before a port is set', () => {
    const midi = new MidiOut();
    midi.play('lead', 60, 100, 0, 1, toDeviceMs);
    midi.advance(10, toDeviceMs);
  });

  it('sends a note on at its start, on the part’s channel', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('bass', 43, 100, 1, 0.5, toDeviceMs);
    expect(sent).toEqual([{ data: [NOTE_ON | 1, 43, 100], timestamp: 1000 }]);
  });

  it('sends every part on its default channel (lead 1, bass 2, pad and stab 3, drums 10)', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    for (const part of PARTS) midi.play(part, 60, 100, 0, 1, toDeviceMs);
    const channelSent = (channel: number) => sent.some((m) => m.data[0] === (NOTE_ON | channel));
    expect(channelSent(0)).toBe(true); // lead, channel 1
    expect(channelSent(1)).toBe(true); // bass, channel 2
    expect(channelSent(2)).toBe(true); // pad and stab, channel 3
    expect(channelSent(9)).toBe(true); // drums, channel 10
  });

  it('releases a note once its length has passed, and not before', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 72, 100, 0, 1, toDeviceMs);
    midi.advance(0.9, toDeviceMs);
    expect(sent.some((m) => m.data[0] === (NOTE_OFF | 0))).toBe(false);
    midi.advance(1, toDeviceMs);
    expect(sent.at(-1)).toEqual({ data: [NOTE_OFF | 0, 72, 0], timestamp: 1000 });
  });

  it(
    'keeps a pad sounding through a stab on the same pitch, and releases only once ' +
      'both are done, rather than letting the stab’s release cut the pad short (#5)',
    () => {
      const midi = new MidiOut();
      const { port, sent } = fakePort();
      midi.setPort(port, 0, toDeviceMs);
      midi.play('pad', 60, 100, 0, 2, toDeviceMs);
      midi.play('stab', 60, 110, 1, 0.1, toDeviceMs);
      midi.advance(1.1, toDeviceMs);
      // The stab's own release is due, but the pad still holds the pitch: no note-off yet.
      midi.advance(2, toDeviceMs);
      const ch = DEFAULT_CHANNELS.pad - 1;
      expect(sent).toEqual([
        { data: [NOTE_ON | ch, 60, 100], timestamp: 0 }, // the pad's attack
        { data: [NOTE_OFF | ch, 60, 0], timestamp: 1000 }, // retrigger: off then on, not a stray cut
        { data: [NOTE_ON | ch, 60, 110], timestamp: 1000 }, // the stab's attack
        { data: [NOTE_OFF | ch, 60, 0], timestamp: 2000 }, // the pad's true end, once nothing else holds it
      ]);
    },
  );

  it('retriggers when a note starts while another owner already holds it, off then on', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 64, 90, 0, 2, toDeviceMs);
    sent.length = 0;
    midi.play('lead', 64, 100, 0.5, 0.5, toDeviceMs);
    expect(sent).toEqual([
      { data: [NOTE_OFF | 0, 64, 0], timestamp: 500 },
      { data: [NOTE_ON | 0, 64, 100], timestamp: 500 },
    ]);
  });

  it('sends the GM note as-is by default, for every drum sound', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    for (const note of Object.values(DRUM_NOTES)) midi.play('drums', note, 100, 0, 0.1, toDeviceMs);
    expect(sent.map((m) => m.data[1])).toEqual(Object.values(DRUM_NOTES));
  });

  it('remaps a drum sound to its configured output note, leaving other parts untouched (L7)', () => {
    const midi = new MidiOut(DEFAULT_CHANNELS, false, { ...DEFAULT_DRUM_NOTES, kick: 60 });
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('drums', DRUM_NOTES.kick, 100, 0, 0.1, toDeviceMs);
    midi.play('lead', DRUM_NOTES.kick, 100, 0, 0.1, toDeviceMs); // the raw GM number, unrelated to drums
    expect(sent.map((m) => m.data)).toEqual([
      [NOTE_ON | 9, 60, 100],
      [NOTE_ON | 0, DRUM_NOTES.kick, 100],
    ]);
  });

  it('releases a remapped drum note at its own output note, not the GM one', () => {
    const midi = new MidiOut(DEFAULT_CHANNELS, false, { ...DEFAULT_DRUM_NOTES, kick: 60 });
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('drums', DRUM_NOTES.kick, 100, 0, 0.1, toDeviceMs);
    midi.advance(0.1, toDeviceMs);
    expect(sent.at(-1)).toEqual({ data: [NOTE_OFF | 9, 60, 0], timestamp: 100 });
  });

  it('lets two drum sounds mapped to the same pad retrigger, off then on, as any shared note does', () => {
    const midi = new MidiOut(DEFAULT_CHANNELS, false, {
      ...DEFAULT_DRUM_NOTES,
      rim: 62,
      snare: 62,
    });
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('drums', DRUM_NOTES.rim, 100, 0, 1, toDeviceMs);
    sent.length = 0;
    midi.play('drums', DRUM_NOTES.snare, 110, 0.2, 1, toDeviceMs);
    expect(sent).toEqual([
      { data: [NOTE_OFF | 9, 62, 0], timestamp: 200 },
      { data: [NOTE_ON | 9, 62, 110], timestamp: 200 },
    ]);
  });

  it('picks up a new drum note map from setDrumNotes, without touching what is already held', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.setDrumNotes({ ...DEFAULT_DRUM_NOTES, kick: 60 });
    midi.play('drums', DRUM_NOTES.kick, 100, 0, 0.1, toDeviceMs);
    expect(sent[0]!.data).toEqual([NOTE_ON | 9, 60, 100]);
  });

  it('wraps a channel outside 1–16 rather than throwing', () => {
    const midi = new MidiOut({ ...DEFAULT_CHANNELS, lead: 17 });
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 60, 100, 0, 1, toDeviceMs);
    expect(sent[0]!.data[0]).toBe(NOTE_ON | 0);
  });

  const allNotesOffChannels = (sent: { data: number[] }[]) =>
    new Set(
      sent
        .filter((m) => (m.data[0]! & 0xf0) === CC && m.data[1] === ALL_NOTES_OFF)
        .map((m) => m.data[0]! & 0x0f),
    );

  it('forgets what it held when the port changes, and silences the old port, not the new one', () => {
    const midi = new MidiOut();
    const { port: portA, sent: sentA } = fakePort();
    const { port: portB, sent: sentB } = fakePort();
    midi.setPort(portA, 0, toDeviceMs);
    midi.play('lead', 60, 100, 0, 100, toDeviceMs);
    midi.play('drums', 36, 100, 0, 0.1, toDeviceMs);
    midi.setPort(portB, 5, toDeviceMs);
    // The old port is silenced, on every channel it is configured for.
    expect(allNotesOffChannels(sentA)).toEqual(new Set([0, 1, 2, 9]));
    expect(sentB).toEqual([]);
    // Playing again after the switch never emits a leftover release for the old note.
    midi.play('lead', 60, 100, 6, 0.1, toDeviceMs);
    midi.advance(7, toDeviceMs);
    expect(sentB.filter((m) => m.data[0] === (NOTE_OFF | 0)).length).toBe(1);
  });

  it('sends all notes off on the old port when it changes to no port, at the given time', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 60, 100, 0, 10, toDeviceMs);
    midi.setPort(null, 5, toDeviceMs);
    expect(allNotesOffChannels(sent)).toEqual(new Set([0, 1, 2, 9]));
    const off = sent.filter((m) => (m.data[0]! & 0xf0) === CC && m.data[1] === ALL_NOTES_OFF);
    expect(off.every((m) => m.timestamp === 5000)).toBe(true);
  });

  it('sends all notes off when the channel mapping changes, on the channels it left', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 60, 100, 0, 10, toDeviceMs);
    midi.setChannels({ ...DEFAULT_CHANNELS, lead: 5 }, 2, toDeviceMs);
    expect(sent).toContainEqual({ data: [CC | 0, ALL_NOTES_OFF, 0], timestamp: 2000 });
  });

  it('does nothing when the port or channels are set to what they already are', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    sent.length = 0;
    midi.setPort(port, 1, toDeviceMs);
    midi.setChannels(DEFAULT_CHANNELS, 1, toDeviceMs);
    expect(sent).toEqual([]);
  });

  it('sends a clock tick only when the clock is on', () => {
    const midi = new MidiOut(DEFAULT_CHANNELS, false);
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.clockTick(1, toDeviceMs);
    expect(sent).toEqual([]);
    midi.setClock(true);
    midi.clockTick(1, toDeviceMs);
    expect(sent).toEqual([{ data: [0xf8], timestamp: 1000 }]);
  });

  it('sends start just before the given time, and stop at once, only with the clock on', () => {
    const midi = new MidiOut(DEFAULT_CHANNELS, true);
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.start(2, toDeviceMs);
    expect(sent).toEqual([{ data: [0xfa], timestamp: 1998 }]);
    sent.length = 0;
    midi.stop(3, toDeviceMs);
    expect(sent[0]).toEqual({ data: [0xfc], timestamp: 3000 });
  });

  it('sends all notes off past the lookahead on stop, on every channel in use, and forgets what it held', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 60, 100, 0, 10, toDeviceMs);
    midi.stop(3, toDeviceMs);
    const off = sent.find((m) => m.data[0] === (CC | 0) && m.data[1] === ALL_NOTES_OFF);
    expect(off).toEqual({
      data: [CC | 0, ALL_NOTES_OFF, 0],
      timestamp: (3 + LOOKAHEAD + 0.4) * 1000,
    });
  });

  it('panics: sends all notes off on every channel in use and forgets what it held', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    midi.setPort(port, 0, toDeviceMs);
    midi.play('lead', 60, 100, 0, 10, toDeviceMs);
    midi.play('drums', 36, 100, 0, 10, toDeviceMs);
    midi.panic(1, toDeviceMs);
    expect(allNotesOffChannels(sent)).toEqual(new Set([0, 1, 2, 9]));
    // Nothing left held: a note played after panic never emits a leftover release.
    sent.length = 0;
    midi.play('lead', 60, 100, 2, 0.1, toDeviceMs);
    midi.advance(3, toDeviceMs);
    expect(sent.filter((m) => m.data[0] === (NOTE_OFF | 0)).length).toBe(1);
  });

  it('clamps a timestamp before now to zero, rather than sending it late', () => {
    const midi = new MidiOut();
    const { port, sent } = fakePort();
    const negative = (seconds: number) => seconds * 1000 - 5000;
    midi.setPort(port, 0, negative);
    midi.play('lead', 60, 100, 0, 1, negative);
    expect(sent[0]!.timestamp).toBe(0);
  });
});
