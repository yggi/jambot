import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { DRUM_PRESETS, KEYS, chooseDevice, inputRow, withCrossing } from '@yggi/webmidi/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BAND } from '../midi/patch.ts';
import { MidiSettings } from '../midi/settings.svelte.ts';
import SoundPanel from './SoundPanel.svelte';

beforeEach(() => localStorage.clear());

const PORTS = {
  inputs: [{ id: 'in-1', name: 'KeyStep' }],
  outputs: [{ id: 'out-1', name: 'Synth' }],
};

/** The panel, connected or not, on settings of its own. */
function panel(over: Record<string, unknown> = {}) {
  const settings = (over.settings as MidiSettings | undefined) ?? new MidiSettings();
  const props = {
    settings,
    connected: true,
    ports: PORTS,
    message: '',
    onconnect: () => {},
    ...over,
  };
  return { settings, ...render(SoundPanel, props) };
}

/** Settings whose one output is the synth plugged in. */
function onSynth() {
  const settings = new MidiSettings();
  settings.book = chooseDevice(settings.book, 'o1', PORTS.outputs[0]!);
  return settings;
}

const jack = (row: string, output: string) =>
  screen.getByRole('button', { name: new RegExp(`^${row} to ${output}: `) });

describe('SoundPanel', () => {
  it('offers to connect when there is no access yet, and says what Web MIDI said', async () => {
    const onconnect = vi.fn();
    panel({ connected: false, message: 'Not connected yet.', onconnect });
    expect(screen.getByRole('status')).toHaveTextContent('Not connected yet.');
    await fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    expect(onconnect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Refresh ports' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'All notes off' })).toBeNull();
  });

  it('waits while connecting', () => {
    panel({ connected: false, connecting: true });
    expect(screen.getByRole('button', { name: 'Connecting…' })).toBeDisabled();
  });

  it('offers a refresh and all notes off once connected, and asks for each on click', async () => {
    const [onrefresh, onpanic] = [vi.fn(), vi.fn()];
    panel({ onrefresh, onpanic });
    expect(screen.queryByRole('button', { name: 'Connect' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Refresh ports' }));
    await fireEvent.click(screen.getByRole('button', { name: 'All notes off' }));
    expect(onrefresh).toHaveBeenCalledOnce();
    expect(onpanic).toHaveBeenCalledOnce();
  });

  it('toggles the built-in synth', async () => {
    const { settings } = panel();
    await fireEvent.click(screen.getByLabelText('Play the built-in synth'));
    expect(settings.internal).toBe(false);
  });

  it('splits the built-in synth from MIDI', () => {
    panel();
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings.slice(0, 2)).toEqual(['Built-in synth', 'MIDI']);
    const synth = within(screen.getByRole('region', { name: 'Built-in synth' }));
    expect(synth.getByLabelText('Play the built-in synth')).toBeInTheDocument();
    expect(synth.queryByRole('table')).toBeNull();
  });

  it('patches the clock, the five parts with the drum sounds, the keys, then each input with what it plays', () => {
    panel();
    const rows = within(screen.getByRole('table'))
      .getAllByRole('rowheader')
      .map((h) => h.querySelector('.label')?.textContent);
    expect(rows).toEqual([
      'Clock',
      'Lead',
      'Bass',
      'Pad',
      'Stab',
      'Drums',
      'Kick',
      'Rim',
      'Snare',
      'Clap',
      'Closed hat',
      'Pedal hat',
      'Open hat',
      'Ride',
      'Keys',
      'KeyStep',
    ]);
    expect(jack('Lead', 'No device')).toHaveAccessibleName('Lead to No device: channel 1');
    expect(jack('Drums', 'No device')).toHaveAccessibleName('Drums to No device: channel 10');
    expect(jack('Keys', 'No device')).toHaveAccessibleName('Keys to No device: not sent');
    expect(
      screen.getByRole('combobox', { name: 'What KeyStep plays, heard by the Muse' }),
    ).toHaveValue('none');
  });

  it('sets what an input plays, which the Muse hears, as a custom variant of the setup (yggi/webmidi#43)', async () => {
    const { settings } = panel();
    const plays = screen.getByRole('combobox', { name: 'What KeyStep plays, heard by the Muse' });
    expect([...(plays as HTMLSelectElement).options].map((o) => o.textContent)).toEqual([
      'Not heard',
      'Default',
      'Lead',
      'Drums',
    ]);
    await fireEvent.change(plays, { target: { value: 'drums' } });
    expect(settings.setup.plays).toEqual({ 'in:KeyStep': { row: 'drums', role: 'drums' } });
    expect(settings.setup.name).toBe('Jambot - custom');
    expect(screen.getByRole('button', { name: 'Save…' })).toBeEnabled();
  });

  it('routes a row to a channel from the jack’s picker', async () => {
    const { settings } = panel({ settings: onSynth() });
    await fireEvent.click(jack('Keys', 'Synth'));
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '5' }));
    expect(settings.setup.routes[BAND]![KEYS]).toEqual({ o1: 5 });
    await fireEvent.click(jack(PORTS.inputs[0]!.name, 'Synth'));
    await fireEvent.click(screen.getByRole('button', { name: '= As played' }));
    expect(settings.setup.routes[BAND]![inputRow(PORTS.inputs[0]!)]).toEqual({ o1: 0 });
  });

  it('chooses the output’s device in the inspector, and sends it the clock from the clock row', async () => {
    const { settings } = panel();
    await fireEvent.change(screen.getByLabelText('Port'), { target: { value: 'out-1' } });
    expect(settings.setup.outputs).toEqual([{ key: 'o1', id: 'out-1', name: 'Synth' }]);
    await fireEvent.click(screen.getByRole('button', { name: 'Clock to Synth' }));
    expect(settings.setup.clock).toEqual(['o1']);
  });

  it('keeps a device’s drum map and latency with the device, by its name', async () => {
    const { settings } = panel({ settings: onSynth() });
    await fireEvent.change(screen.getByLabelText(/Drum map/), {
      target: { value: 'Novation Circuit' },
    });
    expect(settings.book.devices.Synth!.drums).toEqual(DRUM_PRESETS['Novation Circuit']);
    await fireEvent.change(screen.getByLabelText(/Latency/), { target: { value: '9' } });
    expect(settings.book.devices.Synth!.latency).toBe(9);
  });

  it('edits a drum sound’s note on an output in the patch, clamped to 0–127, the map then a custom one (yggi/webmidi#36)', async () => {
    const { settings } = panel({ settings: onSynth() });
    const kick = screen.getByLabelText(/^Kick on Synth/);
    expect(kick).toHaveValue(36);
    await fireEvent.change(kick, { target: { value: '200' } });
    expect(settings.book.devices.Synth!.drums[36]).toBe(127);
    expect(screen.getByLabelText(/Drum map/)).toHaveValue('Custom');
  });

  it('offers no drum notes for an output the drums don’t go to', () => {
    const settings = onSynth();
    settings.book = withCrossing(settings.book, BAND, 'drums', 'o1', undefined);
    panel({ settings });
    expect(screen.queryByLabelText(/^Kick on/)).toBeNull();
    expect(screen.queryByLabelText(/Drum map/)).toBeNull();
  });

  it('sends a test note on the output’s first channel, once connected', async () => {
    const ontest = vi.fn();
    panel({ settings: onSynth(), ontest });
    await fireEvent.click(screen.getByRole('button', { name: 'Test note' }));
    expect(ontest).toHaveBeenCalledWith('o1', 1);
  });

  it('shows a device of the setup that isn’t plugged in as such, and says how many are missing', () => {
    panel({ settings: onSynth(), ports: { inputs: [], outputs: [] }, message: 'MIDI connected.' });
    expect(screen.getByText(/1 of this setup’s devices isn’t plugged in/)).toBeInTheDocument();
    expect(screen.getByText('Not plugged in')).toBeInTheDocument();
  });
});
