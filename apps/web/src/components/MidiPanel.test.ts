import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CHANNELS, type MidiPort } from '../audio/midi-out.ts';
import type { MidiAccess } from '../midi/access.ts';
import { MidiSettings } from '../midi/settings.svelte.ts';
import MidiPanel from './MidiPanel.svelte';

beforeEach(() => localStorage.clear());

function fakeAccess(outPort: MidiPort = { send: vi.fn() }) {
  const listen = vi.fn();
  const outputPort = vi.fn(() => outPort);
  const access = {
    inputs: [{ id: 'in-1', name: 'Keys' }],
    outputs: [{ id: 'out-1', name: 'Synth' }],
    outputPort,
    listen,
  } as unknown as MidiAccess;
  return { access, listen, outputPort, outPort };
}

describe('MidiPanel', () => {
  it('offers to connect when there is no access yet', async () => {
    const onconnect = vi.fn();
    render(MidiPanel, {
      settings: new MidiSettings(),
      access: null,
      message: 'Without MIDI, the built-in synth and the keys still run the whole loop.',
      onconnect,
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI' }));
    expect(onconnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Send to output')).not.toBeInTheDocument();
  });

  it('offers the ports once connected, with no output chosen by default', () => {
    const { access } = fakeAccess();
    render(MidiPanel, { settings: new MidiSettings(), access, message: '', onconnect: () => {} });
    expect(screen.queryByRole('button', { name: 'Connect MIDI' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Send to output')).toHaveValue('none');
    expect(screen.getByRole('option', { name: 'Synth' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Keys' })).toBeInTheDocument();
  });

  it('resolves a chosen output port through access, and saves its id', async () => {
    const { access, outputPort, outPort } = fakeAccess();
    const settings = new MidiSettings();
    render(MidiPanel, { settings, access, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Send to output'), {
      target: { value: 'out-1' },
    });
    expect(outputPort).toHaveBeenCalledWith('out-1');
    expect(settings.outPortId).toBe('out-1');
    expect(settings.outPort).toBe(outPort);
  });

  it('listens to a chosen input port, and saves its id', async () => {
    const { access, listen } = fakeAccess();
    const settings = new MidiSettings();
    render(MidiPanel, { settings, access, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Listen to input'), {
      target: { value: 'all' },
    });
    expect(listen).toHaveBeenCalledWith('all');
    expect(settings.inPortId).toBe('all');
  });

  it('clamps a channel to 1–16', async () => {
    const settings = new MidiSettings();
    render(MidiPanel, { settings, access: null, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Lead'), { target: { value: '99' } });
    expect(settings.channels).toEqual({ ...DEFAULT_CHANNELS, lead: 16 });
    await fireEvent.change(screen.getByLabelText('Bass'), { target: { value: '0' } });
    expect(settings.channels.bass).toBe(1);
  });

  it('toggles the built-in synth, clock and thru', async () => {
    const settings = new MidiSettings();
    render(MidiPanel, { settings, access: null, message: '', onconnect: () => {} });
    await fireEvent.click(screen.getByLabelText('Play the built-in synth'));
    expect(settings.internal).toBe(false);
    await fireEvent.click(screen.getByLabelText('Send MIDI clock, start and stop'));
    expect(settings.clock).toBe(true);
    await fireEvent.click(screen.getByLabelText('Pass what you play to the output on channel'));
    expect(settings.thru).toBe(true);
  });
});
