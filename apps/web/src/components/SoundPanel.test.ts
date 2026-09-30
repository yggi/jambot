import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CHANNELS, DEFAULT_DRUM_NOTES, type MidiPort } from '../audio/midi-out.ts';
import type { MidiAccess } from '../midi/access.ts';
import { DRUM_NOTE_PRESETS } from '../midi/drum-presets.ts';
import { MidiSettings } from '../midi/settings.svelte.ts';
import SoundPanel from './SoundPanel.svelte';

beforeEach(() => localStorage.clear());

const PORTS = {
  inputs: [{ id: 'in-1', name: 'Keys' }],
  outputs: [{ id: 'out-1', name: 'Synth' }],
};

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

describe('SoundPanel', () => {
  it('offers to connect when there is no access yet', async () => {
    const onconnect = vi.fn();
    render(SoundPanel, {
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
    render(SoundPanel, {
      settings: new MidiSettings(),
      access,
      ports: PORTS,
      message: '',
      onconnect: () => {},
    });
    expect(screen.queryByRole('button', { name: 'Connect MIDI' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Send to output')).toHaveValue('none');
    expect(screen.getByRole('option', { name: 'Synth' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Keys' })).toBeInTheDocument();
  });

  it('resolves a chosen output port through access, and saves its id', async () => {
    const { access, outputPort, outPort } = fakeAccess();
    const settings = new MidiSettings();
    render(SoundPanel, { settings, access, ports: PORTS, message: '', onconnect: () => {} });
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
    render(SoundPanel, { settings, access, ports: PORTS, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Listen to input'), {
      target: { value: 'all' },
    });
    expect(listen).toHaveBeenCalledWith('all');
    expect(settings.inPortId).toBe('all');
  });

  it('clamps a channel to 1–16', async () => {
    const settings = new MidiSettings();
    render(SoundPanel, { settings, access: null, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Lead'), { target: { value: '99' } });
    expect(settings.channels).toEqual({ ...DEFAULT_CHANNELS, lead: 16 });
    await fireEvent.change(screen.getByLabelText('Bass'), { target: { value: '0' } });
    expect(settings.channels.bass).toBe(1);
  });

  it('opens on the GM drum notes preset, with every sound at its GM number', () => {
    const settings = new MidiSettings();
    render(SoundPanel, { settings, access: null, message: '', onconnect: () => {} });
    expect(screen.getByLabelText('Preset')).toHaveValue('GM');
    expect(screen.getByLabelText('Kick')).toHaveValue(DEFAULT_DRUM_NOTES.kick);
    expect(screen.getByLabelText('Ride')).toHaveValue(DEFAULT_DRUM_NOTES.ride);
  });

  it('sets every drum note from the chosen preset', async () => {
    const settings = new MidiSettings();
    render(SoundPanel, { settings, access: null, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Preset'), {
      target: { value: 'Novation Circuit' },
    });
    expect(settings.drumNotes).toEqual(DRUM_NOTE_PRESETS['Novation Circuit']);
    expect(screen.getByLabelText('Kick')).toHaveValue(60);
  });

  it('clamps a drum note to 0–127, and shows the preset as custom once it no longer matches one', async () => {
    const settings = new MidiSettings();
    render(SoundPanel, { settings, access: null, message: '', onconnect: () => {} });
    await fireEvent.change(screen.getByLabelText('Kick'), { target: { value: '200' } });
    expect(settings.drumNotes.kick).toBe(127);
    expect(screen.getByLabelText('Preset')).toHaveValue('');
    await fireEvent.change(screen.getByLabelText('Snare'), { target: { value: '-5' } });
    expect(settings.drumNotes.snare).toBe(0);
  });

  it('offers all notes off once connected, and calls it on click', async () => {
    const { access } = fakeAccess();
    const onpanic = vi.fn();
    render(SoundPanel, {
      settings: new MidiSettings(),
      access,
      message: '',
      onconnect: () => {},
      onpanic,
    });
    await fireEvent.click(screen.getByRole('button', { name: 'All notes off' }));
    expect(onpanic).toHaveBeenCalledTimes(1);
  });

  it('offers no all-notes-off control before connecting', () => {
    render(SoundPanel, {
      settings: new MidiSettings(),
      access: null,
      message: '',
      onconnect: () => {},
    });
    expect(screen.queryByRole('button', { name: 'All notes off' })).not.toBeInTheDocument();
  });

  it('toggles the built-in synth, clock and thru', async () => {
    const settings = new MidiSettings();
    render(SoundPanel, { settings, access: null, message: '', onconnect: () => {} });
    await fireEvent.click(screen.getByLabelText('Play the built-in synth'));
    expect(settings.internal).toBe(false);
    await fireEvent.click(screen.getByLabelText('Send MIDI clock, start and stop'));
    expect(settings.clock).toBe(true);
    await fireEvent.click(screen.getByLabelText('Pass what you play to the output on channel'));
    expect(settings.thru).toBe(true);
  });

  describe('laid out in sections', () => {
    const region = (name: string) => screen.getByRole('region', { name });

    it('splits the built-in synth from MIDI, and MIDI into its output and input', () => {
      const { access } = fakeAccess();
      render(SoundPanel, {
        settings: new MidiSettings(),
        access,
        ports: PORTS,
        message: '',
        onconnect: () => {},
      });
      expect(screen.getAllByRole('heading').map((h) => [h.tagName, h.textContent])).toEqual([
        ['H3', 'Built-in synth'],
        ['H3', 'MIDI'],
        ['H4', 'Output'],
        ['H4', 'Input'],
      ]);
      const synth = within(region('Built-in synth'));
      expect(synth.getByLabelText('Play the built-in synth')).toBeInTheDocument();
      expect(synth.queryByLabelText('Send to output')).toBeNull();
    });

    it('keeps what is sent in the output, and what is heard in the input', () => {
      const { access } = fakeAccess();
      render(SoundPanel, {
        settings: new MidiSettings(),
        access,
        ports: PORTS,
        message: '',
        onconnect: () => {},
      });
      const out = within(region('Output'));
      for (const label of ['Send to output', 'Lead', 'Drums', 'Preset', 'Kick'])
        expect(out.getByLabelText(label)).toBeInTheDocument();
      expect(out.getByLabelText('Send MIDI clock, start and stop')).toBeInTheDocument();
      const inn = within(region('Input'));
      expect(inn.getByLabelText('Listen to input')).toBeInTheDocument();
      expect(inn.getByLabelText('Pass what you play to the output on channel')).toBeInTheDocument();
      expect(inn.getByLabelText('Thru channel')).toBeInTheDocument();
      expect(inn.queryByLabelText('Send to output')).toBeNull();
      expect(out.queryByLabelText('Listen to input')).toBeNull();
    });
  });

  describe('looking at the ports again', () => {
    it('offers a refresh once connected, and asks for one on click', async () => {
      const { access } = fakeAccess();
      const onrefresh = vi.fn();
      render(SoundPanel, {
        settings: new MidiSettings(),
        access,
        ports: PORTS,
        message: '',
        onconnect: () => {},
        onrefresh,
      });
      await fireEvent.click(screen.getByRole('button', { name: 'Refresh ports' }));
      expect(onrefresh).toHaveBeenCalledTimes(1);
    });

    it('offers connecting before that, and no refresh', () => {
      render(SoundPanel, {
        settings: new MidiSettings(),
        access: null,
        message: '',
        onconnect: () => {},
      });
      expect(screen.queryByRole('button', { name: 'Refresh ports' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Connect MIDI' })).toBeInTheDocument();
    });

    it('lists the ports it is given, as they come and go', async () => {
      const { access } = fakeAccess();
      const { rerender } = render(SoundPanel, {
        settings: new MidiSettings(),
        access,
        ports: PORTS,
        message: '',
        onconnect: () => {},
      });
      expect(screen.queryByRole('option', { name: 'Launchpad' })).toBeNull();
      await rerender({
        ports: { ...PORTS, outputs: [...PORTS.outputs, { id: 'out-2', name: 'Launchpad' }] },
      });
      expect(screen.getByRole('option', { name: 'Launchpad' })).toBeInTheDocument();
    });

    it('shows a port chosen before that is not plugged in as not connected, not as a blank', () => {
      const { access } = fakeAccess();
      const settings = new MidiSettings();
      settings.outPortId = 'out-9';
      settings.inPortId = 'in-9';
      render(SoundPanel, { settings, access, ports: PORTS, message: '', onconnect: () => {} });
      expect(screen.getByLabelText('Send to output')).toHaveDisplayValue('Not connected');
      expect(screen.getByLabelText('Listen to input')).toHaveDisplayValue('Not connected');
    });
  });
});
