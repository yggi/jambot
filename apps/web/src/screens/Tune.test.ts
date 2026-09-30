import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tone, world } from '../tune/fixtures.ts';
import { TICK_MS, Tuner } from '../tune/tuner.svelte.ts';
import { MicDenied } from '../tune/mic.ts';
import { ToneSender } from '../tune/sender.svelte.ts';
import TuneScreen from './Tune.svelte';

/** A sender with two MIDI ports, each keeping what it is sent, and a synth that keeps its notes. */
function senders(ports = ['a', 'b']) {
  const sent: Record<string, (readonly number[])[]> = Object.fromEntries(
    ports.map((id) => [id, []]),
  );
  const synth = { notes: [] as number[], silenced: 0 };
  const sender = new ToneSender({
    ports: () => ports.map((id) => ({ id, name: `Port ${id}` })),
    port: (id) => (id in sent ? { send: (data) => void sent[id]!.push(data) } : null),
    synth: () => ({
      currentTime: 0,
      play: (_part, note) => void synth.notes.push(note),
      silence: () => void synth.silenced++,
    }),
  });
  return { sender, sent, synth };
}

function shown(signal = tone(440), ports?: string[]) {
  const w = world();
  w.heard.signal = signal;
  const tuner = new Tuner({ mic: w.source, analyse: w.analyseHere });
  const onback = vi.fn();
  const { sender, sent, synth } = senders(ports);
  render(TuneScreen, { tuner, sender, onback });
  const hear = async (ticks = 1) => {
    await vi.advanceTimersByTimeAsync(TICK_MS * ticks);
  };
  return { ...w, tuner, onback, hear, sender, sent, synth };
}

beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
afterEach(() => vi.useRealTimers());

describe('the tuner screen', () => {
  it('waits for a press before it listens, and says so', async () => {
    const { tuner, log } = shown();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByText('Not listening.')).toBeInTheDocument();
    expect(log.opened).toEqual([]);
    expect(tuner.status).toBe('idle');
  });

  it('shows the note heard with its distance in cents and in Hz, and a needle', async () => {
    const { hear } = shown(tone(440, 12));
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    const note = within(screen.getByRole('region', { name: 'Note' }));
    expect(note.getByText('A4')).toBeInTheDocument();
    expect(note.getByText(/^\+12\.\d cents$/)).toBeInTheDocument();
    expect(note.getByText(/\+3\.\d\d Hz from 440\.00 Hz · heard 443\.\d\d Hz/)).toBeInTheDocument();
    expect(note.getByRole('img', { name: 'Distance from the note, in cents' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
  });

  it('calls a note in tune only within a few cents, and minus is flat', async () => {
    const { hear } = shown(tone(440, -2));
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    const note = within(screen.getByRole('region', { name: 'Note' }));
    expect(note.getByText(/^−2\.\d cents$/)).toBeInTheDocument();
    expect(note.getByText(/· in tune/)).toBeInTheDocument();
  });

  it('says to play a note when it hears none', async () => {
    const { hear } = shown(new Float64Array(16384));
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    expect(screen.getByText('Play a note.')).toBeInTheDocument();
    expect(screen.getByText('–', { selector: '.name' })).toBeInTheDocument();
  });

  it('draws the spectrum as a line, marks the octaves and the pitch on it, and shows the level', async () => {
    const { hear } = shown(tone(440));
    expect(
      screen.getByRole('img', { name: 'Spectrum by note' }).querySelector('path.line'),
    ).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    const plot = screen.getByRole('img', { name: 'Spectrum by note' });
    expect(plot.querySelector('path.line')?.getAttribute('d')).toMatch(/^M0,/);
    expect(plot.querySelectorAll('text.tick')).toHaveLength(8);
    expect(plot.querySelector('line.pitch')).not.toBeNull();
    expect(screen.getByText(/^-?\d+ dB$/)).toBeInTheDocument();
    expect(screen.getByText(/Pitch read over 85 ms/)).toBeInTheDocument();
  });

  it('reads a low note over a longer stretch, and says so', async () => {
    const { hear } = shown(tone(82.41));
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    expect(screen.getByText(/Pitch read over 341 ms/)).toBeInTheDocument();
  });

  it('measures against the reference chosen, typed or picked', async () => {
    const { tuner, hear } = shown(tone(432));
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    expect(screen.getByText(/^−31\.\d cents$/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: '432' }));
    expect(tuner.reference).toBe(432);
    expect(screen.getByRole('button', { name: '432' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/^[+−]0\.\d cents$/)).toBeInTheDocument();
    await fireEvent.input(screen.getByLabelText('A4 is'), { target: { value: '442' } });
    expect(tuner.reference).toBe(442);
    await fireEvent.input(screen.getByLabelText('A4 is'), { target: { value: '9' } });
    expect(tuner.reference).toBe(442);
  });

  it('stops on a second press, and goes back to the lobby', async () => {
    const { tuner, onback, log } = shown();
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(tuner.status).toBe('idle');
    expect(log.stopped).toBe(1);
    await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
    expect(onback).toHaveBeenCalledOnce();
  });

  it('offers a choice of input as soon as there are any, and moves to it', async () => {
    const w = world();
    const tuner = new Tuner({
      mic: {
        ...w.source,
        devices: () =>
          Promise.resolve([
            { id: 'a', label: 'Built-in' },
            { id: 'b', label: 'Interface' },
          ]),
      },
      analyse: w.analyseHere,
    });
    render(TuneScreen, { tuner, sender: senders().sender, onback: vi.fn() });
    await vi.advanceTimersByTimeAsync(1);
    expect(screen.getByLabelText('Listen to')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await vi.advanceTimersByTimeAsync(TICK_MS);
    await fireEvent.change(screen.getByLabelText('Listen to'), { target: { value: 'b' } });
    await vi.advanceTimersByTimeAsync(TICK_MS);
    expect(w.log.opened).toEqual([undefined, 'b']);
  });

  it('tells a person whose microphone is blocked what to do, and lets them try again', async () => {
    const w = world();
    const tuner = new Tuner({
      mic: { open: () => Promise.reject(new MicDenied()), devices: () => Promise.resolve([]) },
      analyse: w.analyseHere,
    });
    render(TuneScreen, { tuner, sender: senders().sender, onback: vi.fn() });
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('status')).toHaveTextContent(/blocked.*site settings/);
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
  });

  it('holds a note on the synth, and reads the sound against it while it is held', async () => {
    const { tuner, synth, hear } = shown(tone(440, 30));
    await fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    await hear();
    const send = within(screen.getByRole('region', { name: 'Send a note' }));
    expect(send.getByText('A4')).toBeInTheDocument();
    expect(send.getByText('440.00 Hz')).toBeInTheDocument();
    await fireEvent.click(send.getByRole('button', { name: 'Hold the note' }));
    expect(synth.notes).toEqual([69]);
    expect(tuner.target).toBe(69);
    await fireEvent.click(send.getByRole('button', { name: '+semitone' }));
    expect(synth.notes).toEqual([69, 70]);
    expect(synth.silenced).toBe(1);
    await hear();
    const note = within(screen.getByRole('region', { name: 'Note' }));
    expect(note.getByText('B♭4')).toBeInTheDocument();
    expect(note.getByText(/^−70\.\d cents$/)).toBeInTheDocument();
    await fireEvent.click(send.getByRole('button', { name: 'Release' }));
    expect(tuner.target).toBeNull();
    expect(send.getByRole('button', { name: 'Hold the note' })).toBeInTheDocument();
  });

  it('sends to a MIDI port on a channel, and shows the channel only for a port', async () => {
    const { sent } = shown();
    const send = within(screen.getByRole('region', { name: 'Send a note' }));
    expect(send.queryByLabelText('Channel')).toBeNull();
    await fireEvent.change(send.getByLabelText('To'), { target: { value: 'b' } });
    await fireEvent.input(send.getByLabelText('Channel'), { target: { value: '4' } });
    await fireEvent.click(send.getByRole('button', { name: '−octave' }));
    await fireEvent.click(send.getByRole('button', { name: 'Hold the note' }));
    expect(sent.b).toEqual([[0x93, 57, 100]]);
    await fireEvent.click(send.getByRole('button', { name: 'All notes off' }));
    expect(sent.b!.slice(1)).toEqual([
      [0x83, 57, 0],
      [0xb3, 123, 0],
      [0xb3, 120, 0],
    ]);
    expect(sent.a).toEqual([]);
  });

  it('says to connect a port when there is none, and keeps the synth to send to', async () => {
    shown(tone(440), []);
    const send = within(screen.getByRole('region', { name: 'Send a note' }));
    expect(send.getByText(/connect a MIDI port in the Sound card/)).toBeInTheDocument();
    expect(send.getAllByRole('option')).toHaveLength(1);
  });
});
