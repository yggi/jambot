import { afterEach, describe, expect, it, vi } from 'vitest';
import { MidiAccess, portOptions } from './access.ts';

describe('portOptions', () => {
  it('names a port from the device, in the order given', () => {
    const ports = new Map([
      ['b', { name: 'Circuit Tracks' }],
      ['a', { name: 'Launchkey' }],
    ]);
    expect(portOptions(ports)).toEqual([
      { id: 'b', name: 'Circuit Tracks' },
      { id: 'a', name: 'Launchkey' },
    ]);
  });

  it('falls back to a plain name for a port that gives none', () => {
    expect(portOptions(new Map([['x', { name: null }]]))).toEqual([{ id: 'x', name: 'MIDI' }]);
  });
});

/** A fake `WebMidiAccess`, close enough for `MidiAccess` to drive. */
function fakeAccess() {
  const input = { id: 'in-1', name: 'Keys', onmidimessage: null as ((e: unknown) => void) | null };
  const output = { id: 'out-1', name: 'Synth', send: vi.fn() };
  const access = {
    inputs: new Map([[input.id, input]]),
    outputs: new Map([[output.id, output]]),
    onstatechange: null as (() => void) | null,
  };
  return { access, input, output };
}

/** `access`, typed as Web MIDI's own heavier interface for `navigator.requestMIDIAccess`. */
const asMidiAccess = (access: ReturnType<typeof fakeAccess>['access']) =>
  access as unknown as MIDIAccess;

describe('MidiAccess', () => {
  afterEach(() => {
    delete (navigator as { requestMIDIAccess?: unknown }).requestMIDIAccess;
  });

  it('reports there is no Web MIDI when the browser has none', async () => {
    const result = await MidiAccess.connect(() => {});
    expect(result).toContain('no Web MIDI');
  });

  it('reports a blocked request rather than throwing', async () => {
    navigator.requestMIDIAccess = () => Promise.reject(new DOMException('nope', 'SecurityError'));
    const result = await MidiAccess.connect(() => {});
    expect(result).toContain('blocked');
  });

  it('lists the ports Web MIDI gives once connected', async () => {
    const { access } = fakeAccess();
    navigator.requestMIDIAccess = () => Promise.resolve(asMidiAccess(access));
    const midi = await MidiAccess.connect(() => {});
    expect(midi).toBeInstanceOf(MidiAccess);
    if (typeof midi === 'string') throw new Error('expected a connection');
    expect(midi.inputs).toEqual([{ id: 'in-1', name: 'Keys' }]);
    expect(midi.outputs).toEqual([{ id: 'out-1', name: 'Synth' }]);
    expect(midi.outputPort('out-1')).toBe(access.outputs.get('out-1'));
    expect(midi.outputPort('missing')).toBeNull();
  });

  it('delivers a note only from a listened input, tagged with its name', async () => {
    const { access, input } = fakeAccess();
    navigator.requestMIDIAccess = () => Promise.resolve(asMidiAccess(access));
    const notes: { note: number; source: string }[] = [];
    const midi = await MidiAccess.connect((note, source) =>
      notes.push({ note: note.note, source }),
    );
    if (typeof midi === 'string') throw new Error('expected a connection');

    expect(input.onmidimessage).toBeNull(); // nothing is listened to yet

    midi.listen('in-1');
    input.onmidimessage!({ data: [0x90, 60, 100] });
    expect(notes).toEqual([{ note: 60, source: 'Keys' }]);

    midi.listen('none');
    expect(input.onmidimessage).toBeNull();
    expect(notes).toEqual([{ note: 60, source: 'Keys' }]);
  });

  it('listens to every input when told to listen to all', async () => {
    const { access, input } = fakeAccess();
    navigator.requestMIDIAccess = () => Promise.resolve(asMidiAccess(access));
    const notes: number[] = [];
    const midi = await MidiAccess.connect((note) => notes.push(note.note));
    if (typeof midi === 'string') throw new Error('expected a connection');
    midi.listen('all');
    input.onmidimessage!({ data: [0x90, 64, 100] });
    expect(notes).toEqual([64]);
  });

  it('re-applies what is listened to when the port list changes', async () => {
    const { access, input } = fakeAccess();
    navigator.requestMIDIAccess = () => Promise.resolve(asMidiAccess(access));
    const notes: number[] = [];
    const midi = await MidiAccess.connect((note) => notes.push(note.note));
    if (typeof midi === 'string') throw new Error('expected a connection');
    midi.listen('in-1');
    input.onmidimessage = null; // as if a fresh port object replaced the listened one
    access.onstatechange!();
    input.onmidimessage!({ data: [0x90, 60, 100] });
    expect(notes).toEqual([60]);
  });
});
