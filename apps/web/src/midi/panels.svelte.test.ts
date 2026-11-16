import { beforeEach, describe, expect, it } from 'vitest';
import {
  AS_PLAYED,
  type Forward,
  activeSetup,
  chooseDevice,
  inputRow,
  panelKey,
  panelsOf,
  withCrossing,
  withPanelActive,
} from '@yggi/webmidi/core';
import {
  EXAMPLE_MIXER,
  EXAMPLE_PLAY,
  type PanelRuntime,
  memoryPanelStore,
  panelOf,
  readLibrary,
} from '@yggi/webmidi/panels';
import { BAND } from './patch.ts';
import { PanelDeck } from './panels.svelte.ts';
import { MidiSettings } from './settings.svelte.ts';

beforeEach(() => localStorage.clear());

/** A deck over settings with one output (o1, a Juno), and what it sent. */
function deck(kept: unknown = null) {
  const made: { panels?: PanelDeck } = {};
  const settings = new MidiSettings({ onchange: () => made.panels?.adopt() });
  settings.book = chooseDevice(settings.book, 'o1', { id: 'out-1', name: 'Juno' });
  const sent: Forward[] = [];
  const store = memoryPanelStore(kept);
  const panels = (made.panels = new PanelDeck({
    settings,
    store,
    send: (f) => void sent.push(...f),
  }));
  return { settings, sent, store, panels };
}

/** Panel `id` active in the setup and its row sent to o1 on channel 3. */
const routed = ({ settings }: ReturnType<typeof deck>, id: string) => {
  settings.book = withCrossing(
    withPanelActive(settings.book, id, true),
    BAND,
    panelKey(id),
    'o1',
    3,
  );
};

/** The key of the example's keyboard, as the runtime knows it. */
const keysOf = (runtime: PanelRuntime) =>
  runtime.panel.controls.find((c) => c.type === 'keyboard')!.key;

describe('the panels of the MIDI page', () => {
  it('starts a first visit with the two examples in the library, none of them active', () => {
    const { panels, settings } = deck();
    expect(panels.library.panels.map((p) => p.id)).toEqual([EXAMPLE_MIXER.id, EXAMPLE_PLAY.id]);
    expect(panelsOf(settings.setup)).toEqual([]);
    expect(panels.runtimeOf(EXAMPLE_PLAY.id)).toBeUndefined();
  });

  it('keeps a library a person emptied empty', () => {
    const { panels } = deck({ version: 1, panels: [] });
    expect(panels.library.panels).toEqual([]);
  });

  it('plays a panel the setup has active, its touch sent where its row crosses an output, on the channel the crossing says', () => {
    const d = deck();
    routed(d, EXAMPLE_MIXER.id);
    const runtime = d.panels.runtimeOf(EXAMPLE_MIXER.id)!;
    expect(runtime).toBeDefined();
    const [data] = runtime.move('main', { x: 1 });
    d.panels.played(EXAMPLE_MIXER.id, data!);
    expect(d.sent).toEqual([{ output: 'o1', data: [0xb2, 40, 127] }]);
  });

  it('sends as played on an as-played crossing, and nothing where the row is crossed with no output', () => {
    const d = deck();
    routed(d, EXAMPLE_MIXER.id);
    d.settings.book = withCrossing(
      d.settings.book,
      BAND,
      panelKey(EXAMPLE_MIXER.id),
      'o1',
      AS_PLAYED,
    );
    d.panels.played(EXAMPLE_MIXER.id, [0xb4, 40, 9]);
    expect(d.sent).toEqual([{ output: 'o1', data: [0xb4, 40, 9] }]);
    d.sent.length = 0;
    d.settings.book = withCrossing(
      d.settings.book,
      BAND,
      panelKey(EXAMPLE_MIXER.id),
      'o1',
      undefined,
    );
    d.panels.played(EXAMPLE_MIXER.id, [0xb4, 40, 9]);
    expect(d.sent).toEqual([]);
  });

  it('hands a message from an input to the panels its row crosses, and to no other', () => {
    const d = deck();
    routed(d, EXAMPLE_MIXER.id);
    d.settings.book = withCrossing(
      d.settings.book,
      BAND,
      inputRow({ id: '', name: 'Keys' }),
      panelKey(EXAMPLE_MIXER.id),
      AS_PLAYED,
    );
    d.panels.heard('Keys', new Uint8Array([0xb0, 40, 127]));
    expect(d.panels.runtimeOf(EXAMPLE_MIXER.id)!.value('main').x).toBe(1);
    d.panels.heard('Other', new Uint8Array([0xb0, 40, 0]));
    expect(d.panels.runtimeOf(EXAMPLE_MIXER.id)!.value('main').x).toBe(1);
  });

  it('is no row the band’s own parts cross: a part’s notes never reach a panel', () => {
    const d = deck();
    routed(d, EXAMPLE_MIXER.id);
    expect(activeSetup(d.settings.book).routes[BAND]!.lead).not.toHaveProperty(
      panelKey(EXAMPLE_MIXER.id),
    );
  });

  it('releases a panel’s held notes where its row was crossed when the panel is taken out of the setup', () => {
    const d = deck();
    routed(d, EXAMPLE_PLAY.id);
    const runtime = d.panels.runtimeOf(EXAMPLE_PLAY.id)!;
    d.panels.played(EXAMPLE_PLAY.id, runtime.strike(keysOf(runtime), 60)[0]!);
    d.sent.length = 0;
    d.settings.book = withPanelActive(d.settings.book, EXAMPLE_PLAY.id, false);
    expect(d.sent.map((f) => f.output)).toEqual(['o1']);
    expect(d.sent[0]!.data[0]! & 0xf0).toBe(0x80);
    expect(d.panels.runtimeOf(EXAMPLE_PLAY.id)).toBeUndefined();
  });

  it('shows the first active panel, and none once it is out', () => {
    const d = deck();
    expect(d.panels.shown).toBeNull();
    routed(d, EXAMPLE_PLAY.id);
    expect(d.panels.shown).toBe(EXAMPLE_PLAY.id);
    d.settings.book = withPanelActive(d.settings.book, EXAMPLE_PLAY.id, false);
    expect(d.panels.shown).toBeNull();
  });

  it('makes a new panel: in the library, kept, active in the setup, and shown', () => {
    const d = deck();
    const id = d.panels.create();
    expect(panelOf(d.panels.library, id)).toBeDefined();
    expect(panelOf(readLibrary(d.store.kept), id)).toBeDefined();
    expect(panelsOf(d.settings.setup)).toContain(id);
    expect(d.panels.shown).toBe(id);
    expect(d.panels.create()).not.toBe(id);
  });

  it('keeps an edited panel, and plays it anew', () => {
    const d = deck();
    routed(d, EXAMPLE_MIXER.id);
    const before = d.panels.runtimeOf(EXAMPLE_MIXER.id);
    d.panels.edit({ ...EXAMPLE_MIXER, name: 'Mixer two' });
    expect(panelOf(readLibrary(d.store.kept), EXAMPLE_MIXER.id)!.name).toBe('Mixer two');
    expect(d.panels.runtimeOf(EXAMPLE_MIXER.id)).not.toBe(before);
  });

  it('deletes a panel from the library and, with its routes, from the setup', () => {
    const d = deck();
    routed(d, EXAMPLE_MIXER.id);
    d.panels.remove(EXAMPLE_MIXER.id);
    expect(panelOf(d.panels.library, EXAMPLE_MIXER.id)).toBeUndefined();
    expect(panelsOf(d.settings.setup)).toEqual([]);
    expect(activeSetup(d.settings.book).routes[BAND]).not.toHaveProperty(
      panelKey(EXAMPLE_MIXER.id),
    );
  });

  it('silences every panel’s held notes on all notes off', () => {
    const d = deck();
    routed(d, EXAMPLE_PLAY.id);
    const runtime = d.panels.runtimeOf(EXAMPLE_PLAY.id)!;
    d.panels.played(EXAMPLE_PLAY.id, runtime.strike(keysOf(runtime), 60)[0]!);
    d.sent.length = 0;
    d.panels.silence();
    expect(d.sent.every((f) => (f.data[0]! & 0xf0) === 0x80)).toBe(true);
  });
});
