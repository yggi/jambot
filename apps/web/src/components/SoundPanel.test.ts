import { fireEvent, render, screen, within } from '@testing-library/svelte';
import {
  DRUM_PRESETS,
  KEYS,
  type SetupBook,
  BUILT_IN,
  HEARD,
  addOutput,
  chooseDevice,
  inputRow,
  withCrossing,
} from '@yggi/webmidi/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BAND } from '../midi/patch.ts';
import { MidiSettings } from '../midi/settings.svelte.ts';
import SoundPanel from './SoundPanel.svelte';

beforeEach(() => localStorage.clear());

const PORTS = {
  inputs: [{ id: 'in-1', name: 'KeyStep' }],
  outputs: [{ id: 'out-1', name: 'Juno' }],
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
function onJuno() {
  const settings = new MidiSettings();
  settings.book = chooseDevice(settings.book, 'o1', PORTS.outputs[0]!);
  return settings;
}

/** An output's device settings opened, from its button under the patch. */
async function inspect(slot = 1) {
  const devices = within(screen.getByRole('group', { name: 'Device settings' }));
  await fireEvent.click(devices.getByRole('button', { name: new RegExp(`^OUT ${slot} `) }));
  return within(screen.getByRole('dialog', { name: new RegExp(`^OUT ${slot}: `) }));
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

  it('plays a part on the built-in synth or not from its column, first in the patch, the MIDI outputs numbered after it', async () => {
    const { settings } = panel({ settings: onJuno() });
    expect(screen.queryByLabelText('Play the built-in synth')).toBeNull();
    const heads = within(screen.getByRole('table'))
      .getAllByRole('columnheader')
      .map((h) => h.querySelector('.slot')?.textContent)
      .filter(Boolean);
    expect(heads).toEqual(['BUILT-IN', 'OUT 1']);
    expect(jack('Stab', 'Synth')).toHaveAccessibleName('Stab to Synth: heard');
    await fireEvent.click(jack('Stab', 'Synth'));
    expect(settings.synth).toEqual(['lead', 'bass', 'pad', 'drums']);
    expect(settings.setup.name).toBe('Jambot - custom');
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

  it('draws two inputs under one name (Android names a device’s every port so) as one row, and says so', () => {
    const twin = { id: 'in-2', name: 'KeyStep' };
    panel({ ports: { ...PORTS, inputs: [...PORTS.inputs, twin] } });
    const inputs = within(screen.getByRole('table'))
      .getAllByRole('rowheader')
      .map((h) => h.querySelector('.label')?.textContent)
      .filter((label) => label === 'KeyStep');
    expect(inputs).toEqual(['KeyStep']);
    expect(screen.getByText('2 ports')).toBeInTheDocument();
  });

  it('sets what an input plays, which the Muse hears, as a custom variant of the setup (yggi/webmidi#43)', async () => {
    const { settings } = panel();
    const plays = screen.getByRole('combobox', { name: 'What KeyStep plays, heard by the Muse' });
    expect([...(plays as HTMLSelectElement).options].map((o) => o.textContent)).toEqual([
      'Not heard',
      'Default',
      'Lead',
      'Bass',
      'Pad',
      'Stab',
      'Drums',
    ]);
    await fireEvent.change(plays, { target: { value: 'drums' } });
    expect(settings.setup.plays).toEqual({ 'in:KeyStep': { row: 'drums', role: 'drums' } });
    expect(settings.setup.name).toBe('Jambot - custom');
    expect(screen.getByRole('button', { name: 'Save…' })).toBeEnabled();
  });

  it('routes a row to a channel from the jack’s picker', async () => {
    const { settings } = panel({ settings: onJuno() });
    await fireEvent.click(jack('Keys', 'Juno'));
    await fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '5' }));
    expect(settings.setup.routes[BAND]![KEYS]).toEqual({ o1: 5 });
    await fireEvent.click(jack(PORTS.inputs[0]!.name, 'Juno'));
    await fireEvent.click(screen.getByRole('button', { name: '= As played' }));
    expect(settings.setup.routes[BAND]![inputRow(PORTS.inputs[0]!)]).toEqual({ o1: 0 });
  });

  it('chooses the output’s device in its settings, and sends it the clock from the clock row', async () => {
    const { settings } = panel();
    const dialog = await inspect();
    await fireEvent.change(dialog.getByLabelText('Port'), { target: { value: 'out-1' } });
    expect(settings.setup.outputs).toEqual([BUILT_IN, { key: 'o1', id: 'out-1', name: 'Juno' }]);
    await fireEvent.click(screen.getByRole('button', { name: 'Clock to Juno' }));
    expect(settings.setup.clock).toEqual(['o1']);
  });

  it('keeps a device’s drum map and latency with the device, by its name', async () => {
    const { settings } = panel({ settings: onJuno() });
    await inspect();
    await fireEvent.change(screen.getByLabelText(/Drum map/), {
      target: { value: 'Novation Circuit' },
    });
    expect(settings.book.devices.Juno!.drums).toEqual(DRUM_PRESETS['Novation Circuit']);
    await fireEvent.change(screen.getByLabelText(/Latency/), { target: { value: '9' } });
    expect(settings.book.devices.Juno!.latency).toBe(9);
  });

  it('edits a drum sound’s note on an output in the patch, clamped to 0–127, the map then a custom one (yggi/webmidi#36)', async () => {
    const { settings } = panel({ settings: onJuno() });
    const kick = screen.getByLabelText(/^Kick on Juno/);
    expect(kick).toHaveValue(36);
    await fireEvent.change(kick, { target: { value: '200' } });
    expect(settings.book.devices.Juno!.drums[36]).toBe(127);
    await inspect();
    expect(screen.getByLabelText(/Drum map/)).toHaveValue('Custom');
  });

  it('offers no drum notes for an output the drums don’t go to', async () => {
    const settings = onJuno();
    settings.book = withCrossing(settings.book, BAND, 'drums', 'o1', undefined);
    panel({ settings });
    expect(screen.queryByLabelText(/^Kick on/)).toBeNull();
    await inspect();
    expect(screen.queryByLabelText(/Drum map/)).toBeNull();
  });

  it('sends a test note on the output’s first channel, once connected', async () => {
    const ontest = vi.fn();
    panel({ settings: onJuno(), ontest });
    await inspect();
    await fireEvent.click(screen.getByRole('button', { name: 'Test note' }));
    expect(ontest).toHaveBeenCalledWith('o1', 1);
  });

  it('shows a device of the setup that isn’t plugged in as such, and says how many are missing', () => {
    panel({ settings: onJuno(), ports: { inputs: [], outputs: [] }, message: 'MIDI connected.' });
    expect(screen.getByText(/1 of this setup’s devices isn’t plugged in/)).toBeInTheDocument();
    expect(screen.getByText('Not plugged in')).toBeInTheDocument();
  });

  it('opens an output’s settings from its head in the patch too, and closes them', async () => {
    panel({ settings: onJuno() });
    expect(screen.queryByRole('dialog')).toBeNull();
    await fireEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: /^OUT 1 Juno/ }),
    );
    expect(screen.getByRole('dialog', { name: 'OUT 1: Juno' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('removes an output from its settings; with the synth beside it, the last MIDI output goes, the synth playing on', async () => {
    const settings = onJuno();
    settings.book = addOutput(settings.book, { id: 'out-2', name: 'Other' }).book;
    panel({ settings });
    await (await inspect(2)).findByRole('heading', { name: 'Other' });
    await fireEvent.click(screen.getByRole('button', { name: 'Remove output' }));
    expect(settings.setup.outputs.map((o) => o.name)).toEqual(['', 'Juno']);
    expect(screen.queryByRole('dialog')).toBeNull();
    await inspect(1);
    await fireEvent.click(screen.getByRole('button', { name: 'Remove output' }));
    expect(settings.setup.outputs).toEqual([BUILT_IN]);
    expect(settings.setup.routes[BAND]!.lead).toEqual({ builtin: HEARD });
  });

  it('opens the synth’s own settings: its volume, the parts it plays, and taking it out of the setup', async () => {
    const onvolume = vi.fn();
    const { settings } = panel({ settings: onJuno(), volume: 0.5, onvolume });
    const devices = within(screen.getByRole('group', { name: 'Device settings' }));
    await fireEvent.click(devices.getByRole('button', { name: /^BUILT-IN Synth/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'BUILT-IN: Synth' }));
    expect(dialog.getByRole('slider', { name: /Volume/ })).toHaveValue('50');
    await fireEvent.input(dialog.getByRole('slider', { name: /Volume/ }), {
      target: { value: '25' },
    });
    expect(onvolume).toHaveBeenCalledWith(0.25);
    await fireEvent.click(dialog.getByRole('button', { name: 'Pad' }));
    expect(settings.synth).toEqual(['lead', 'bass', 'stab', 'drums']);
    await fireEvent.click(dialog.getByRole('button', { name: 'None' }));
    expect(settings.synth).toEqual([]);
    await fireEvent.click(dialog.getByRole('button', { name: 'All parts' }));
    expect(settings.synth).toHaveLength(5);
    await fireEvent.click(dialog.getByRole('button', { name: 'Remove from this setup' }));
    expect(settings.setup.outputs.map((o) => o.key)).toEqual(['o1']);
    expect(screen.queryByRole('dialog')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: '+ Synth' }));
    expect(settings.synth).toHaveLength(5);
  });

  it('forgets a device’s settings, offered only where it has its own', async () => {
    const settings = onJuno();
    panel({ settings });
    await inspect();
    expect(screen.queryByRole('button', { name: 'Forget Juno’s settings' })).toBeNull();
    await fireEvent.change(screen.getByLabelText(/Latency/), { target: { value: '9' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Forget Juno’s settings' }));
    expect(settings.book.devices).not.toHaveProperty('Juno');
  });

  it('shows what went wrong with MIDI, until dismissed', async () => {
    const ondismiss = vi.fn();
    panel({ problems: ['The test note couldn’t be sent (InvalidStateError: gone)'], ondismiss });
    expect(screen.getByRole('alert', { name: 'MIDI problems' })).toHaveTextContent(
      'The test note couldn’t be sent (InvalidStateError: gone)',
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(ondismiss).toHaveBeenCalledOnce();
  });

  it('resets the MIDI settings after asking', async () => {
    const settings = onJuno();
    panel({ settings });
    await fireEvent.click(screen.getByRole('button', { name: 'Reset MIDI settings…' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Reset MIDI settings' }));
    expect(settings.setup.outputs).toEqual([BUILT_IN, { key: 'o1', id: 'none', name: '' }]);
  });

  it('stops the patch alone when it throws, says why, and offers a way back', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const settings = new MidiSettings();
    const book = settings.book;
    settings.book = { ...book, setups: [], active: 'gone' } as SetupBook;
    panel({ settings });
    expect(screen.getByRole('alert')).toHaveTextContent('The MIDI settings hit a problem');
    expect(screen.getByRole('alert')).toHaveTextContent('TypeError');
    await fireEvent.click(
      within(screen.getByRole('alert')).getByRole('button', { name: 'Reset MIDI settings' }),
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(settings.book).toEqual(book);
    error.mockRestore();
  });
});
