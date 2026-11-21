import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import {
  DRUM_PRESETS,
  KEYS,
  type SetupBook,
  BUILT_IN,
  HEARD,
  addOutput,
  chooseDevice,
  inputRow,
  panelKey,
  withCrossing,
  withPanelActive,
} from '@yggi/webmidi/core';
import { EXAMPLE_MIXER, EXAMPLE_PLAY, memoryPanelStore } from '@yggi/webmidi/panels';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BAND } from '../midi/patch.ts';
import { MidiSettings } from '../midi/settings.svelte.ts';
import { PanelDeck } from '../midi/panels.svelte.ts';
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

/** An output's details opened, from its head in the patch: the matrix's own dialog (webmidi v0.5.0). */
async function inspect(slot = 1) {
  await fireEvent.click(
    within(screen.getByRole('table')).getByRole('button', { name: new RegExp(`^OUT ${slot} `) }),
  );
  return within(screen.getByRole('dialog', { name: /^Details of / }));
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

  it('patches the clock, the five parts, the keys, then each input with what it plays (a kit’s members are no rows: webmidi v0.5.0)', () => {
    panel();
    const rows = within(screen.getByRole('table'))
      .getAllByRole('rowheader')
      .map((h) => h.querySelector('.label')?.textContent);
    expect(rows).toEqual(['Clock', 'Lead', 'Bass', 'Pad', 'Stab', 'Drums', 'Keys', 'KeyStep']);
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

  it('edits a drum sound’s note on an output in its details, clamped to 0–127, the map then a custom one (yggi/webmidi#36)', async () => {
    const { settings } = panel({ settings: onJuno() });
    expect(screen.queryByLabelText(/^Kick/)).toBeNull();
    await inspect();
    const kick = screen.getByLabelText(/^Kick: General MIDI 36 goes out as/);
    expect(kick).toHaveValue(36);
    await fireEvent.change(kick, { target: { value: '200' } });
    expect(settings.book.devices.Juno!.drums[36]).toBe(127);
    expect(screen.getByLabelText(/Drum map/)).toHaveValue('Custom');
  });

  it('offers no drum notes for an output the drums don’t go to', async () => {
    const settings = onJuno();
    settings.book = withCrossing(settings.book, BAND, 'drums', 'o1', undefined);
    panel({ settings });
    expect(screen.queryByLabelText(/^Kick/)).toBeNull();
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

  it('offers Measure link in an output’s details only where a measurement is given, and sends nothing until it is pressed', async () => {
    const onmeasure = vi.fn(() => new Promise<never>(() => {}));
    panel({ settings: onJuno() });
    await inspect();
    expect(screen.queryByRole('button', { name: 'Measure link' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    cleanup();
    panel({ settings: onJuno(), onmeasure });
    await inspect();
    expect(screen.getByRole('button', { name: 'Measure link' })).toBeInTheDocument();
    expect(onmeasure).not.toHaveBeenCalled();
  });

  it('sends all notes off to one output, by its key, from its details', async () => {
    const [ontest, onpanicoutput] = [vi.fn(), vi.fn()];
    panel({ settings: onJuno(), ontest, onpanicoutput });
    await inspect();
    await fireEvent.click(screen.getByRole('button', { name: /notes off/i }));
    expect(onpanicoutput).toHaveBeenCalledWith('o1');
  });

  it('shows a device of the setup that isn’t plugged in as such, and says how many are missing', () => {
    panel({ settings: onJuno(), ports: { inputs: [], outputs: [] }, message: 'MIDI connected.' });
    expect(screen.getByText(/1 of this setup’s devices isn’t plugged in/)).toBeInTheDocument();
    expect(screen.getByText('Not plugged in')).toBeInTheDocument();
  });

  it('opens an output’s details from its head in the patch, and closes them', async () => {
    panel({ settings: onJuno() });
    expect(screen.queryByRole('dialog')).toBeNull();
    await inspect();
    expect(screen.getByRole('dialog', { name: 'Details of Juno' })).toBeInTheDocument();
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
    await fireEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: /^BUILT-IN Synth/ }),
    );
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

  describe('control panels', () => {
    /** Settings with the Juno, and a deck over them whose sends are recorded. */
    function withPanels() {
      const made: { deck?: PanelDeck } = {};
      const settings = new MidiSettings({ onchange: () => made.deck?.adopt() });
      settings.book = chooseDevice(settings.book, 'o1', PORTS.outputs[0]!);
      const sent: { output: string; data: readonly number[] }[] = [];
      const deck = (made.deck = new PanelDeck({
        settings,
        store: memoryPanelStore(),
        send: (f) => void sent.push(...f),
      }));
      return { settings, deck, sent };
    }

    it('offers the library’s panels as chips over the patch, and adds one as a row and a column', async () => {
      const { settings, deck } = withPanels();
      panel({ settings, deck });
      await fireEvent.click(screen.getByRole('button', { name: /DM-8 mixer/ }));
      expect(settings.setup.panels).toEqual([EXAMPLE_MIXER.id]);
      expect(deck.shown).toBe(EXAMPLE_MIXER.id);
      const rows = within(screen.getByRole('table'))
        .getAllByRole('rowheader')
        .map((h) => h.querySelector('.label')?.textContent);
      expect(rows).toContain('DM-8 mixer');
    });

    it('gives a panel’s row the Plays choice an input’s has, none by default, and keeps what is chosen with the panel', async () => {
      const { settings, deck } = withPanels();
      panel({ settings, deck });
      await fireEvent.click(screen.getByRole('button', { name: /DM-8 mixer/ }));
      const plays = screen.getByRole('combobox', {
        name: 'What DM-8 mixer plays, heard by the Muse',
      });
      expect(plays).toHaveValue('none');
      await fireEvent.change(plays, { target: { value: 'bass' } });
      expect(settings.setup.plays).toEqual({ 'panel:mixer': { row: 'bass', role: 'bass' } });
    });

    it('plays the shown panel, its touches going out through the setup’s outputs', async () => {
      const { settings, deck, sent } = withPanels();
      settings.book = withCrossing(
        withPanelActive(settings.book, EXAMPLE_MIXER.id, true),
        BAND,
        panelKey(EXAMPLE_MIXER.id),
        'o1',
        3,
      );
      panel({ settings, deck });
      const main = screen.getByRole('slider', { name: /Main/ });
      await fireEvent.keyDown(main, { key: 'End' });
      expect(sent.length).toBeGreaterThan(0);
      expect(sent.every((f) => f.output === 'o1' && (f.data[0]! & 0x0f) === 2)).toBe(true);
    });

    it('edits the shown panel, makes a new one and deletes it', async () => {
      const { settings, deck } = withPanels();
      panel({ settings, deck });
      await fireEvent.click(screen.getByRole('button', { name: 'New panel' }));
      expect(deck.library.panels.map((p) => p.id)).toContain('p3');
      expect(deck.shown).toBe('p3');
      expect(screen.getByRole('button', { name: 'Done editing' })).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Delete this panel' }));
      expect(deck.library.panels.map((p) => p.id)).toEqual([EXAMPLE_MIXER.id, EXAMPLE_PLAY.id]);
      expect(settings.setup.panels ?? []).toEqual([]);
    });

    describe('Try in the editor (yggi/jambot#714)', () => {
      /** The play panel active and routed to the Juno on channel 3, rendered; `sent` is what the deck sent out. */
      function playPanel() {
        const made = withPanels();
        made.settings.book = withCrossing(
          withPanelActive(made.settings.book, EXAMPLE_PLAY.id, true),
          BAND,
          panelKey(EXAMPLE_PLAY.id),
          'o1',
          3,
        );
        panel({ settings: made.settings, deck: made.deck });
        return made;
      }
      /** Press the C4 key and move Mod, as a person does, wherever the panel is drawn. */
      const play = async () => {
        await fireEvent.keyDown(screen.getByRole('button', { name: 'C4' }), { key: 'Enter' });
        await fireEvent.keyDown(screen.getByRole('slider', { name: 'Mod' }), { key: 'ArrowUp' });
      };
      const tryButton = () => screen.getByRole('button', { name: 'Try' });

      it('sends what a tried control makes the way a played one goes: the same bytes to the same outputs, a note and a control change', async () => {
        const played = playPanel();
        await play();
        const expected = played.sent.map((f) => [f.output, [...f.data]]);
        expect(expected.length).toBe(2);
        expect(expected[0]).toEqual(['o1', [0x92, 60, 100]]);
        expect(expected[1]![1]).toEqual([0xb2, 1, expect.any(Number)]);
        cleanup();
        const tried = playPanel();
        await fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        await fireEvent.click(tryButton());
        await play();
        expect(tried.sent.map((f) => [f.output, [...f.data]])).toEqual(expected);
      });

      it('sends nothing with Try off: a press in the editor chooses', async () => {
        const { sent } = playPanel();
        await fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(tryButton()).toHaveAttribute('aria-pressed', 'false');
        // (a press chooses the control: the editor draws each with an Edit button over it)
        await fireEvent.click(screen.getByRole('button', { name: 'Edit Mod' }));
        expect(sent).toEqual([]);
      });

      it('releases the held notes when Try is turned off: the deck sees the note-offs', async () => {
        const { sent } = playPanel();
        await fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        await fireEvent.click(tryButton());
        await fireEvent.keyDown(screen.getByRole('button', { name: 'C4' }), { key: 'Enter' });
        expect(sent.map((f) => [...f.data])).toEqual([[0x92, 60, 100]]);
        await fireEvent.click(tryButton());
        expect(sent.map((f) => [...f.data])).toEqual([
          [0x92, 60, 100],
          [0x82, 60, 0],
        ]);
      });

      it('is silent for a panel the setup does not have: no row, so no output', async () => {
        const { settings, deck, sent } = withPanels();
        deck.edit({
          id: 'q',
          name: 'Q',
          children: [{ type: 'button', id: 'b', label: 'B', bind: [{ kind: 'note', number: 60 }] }],
        });
        deck.shown = 'q';
        panel({ settings, deck });
        expect(settings.setup.panels ?? []).toEqual([]);
        // (not active: it is not shown to play, and the editor has nothing to edit)
        expect(sent).toEqual([]);
      });
    });

    it('shows no panels where none is given', () => {
      panel({ settings: onJuno() });
      expect(screen.queryByRole('button', { name: 'New panel' })).toBeNull();
    });
  });
});
