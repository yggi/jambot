import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeAccess, fakeInput, fakePort, installMidi, uninstallMidi } from '@yggi/webmidi/testing';
import { BUS_GAIN } from './audio/output.ts';
import { fakeAudioContext } from './audio/fake-context.ts';
import {
  AS_PLAYED,
  KEYS,
  type SetupBook,
  chooseDevice,
  hardwareOutputs,
  addOutput,
  withCrossing,
  withProfile,
  ANY_INPUT,
  withPlays,
  inputRow,
  panelKey,
  withPanelActive,
  type ParsedNote,
  type PlaysChoice,
} from '@yggi/webmidi/core';
import { BINDING_KINDS } from '@yggi/webmidi/panels';
import { CONNECT_WAIT, Device, FADE_IN, FADE_OUT, VOLUME_KEY, taper } from './device.svelte.ts';
import { BAND } from './midi/patch.ts';

/** A device on a fake audio context, and the gain that is its current bus. */
function device() {
  const fake = fakeAudioContext();
  const made = vi.fn(function () {
    return fake.context;
  });
  vi.stubGlobal('AudioContext', made);
  const bus = () => fake.gains.filter((g) => g.connections.includes(fake.compressors[0])).at(-1)!;
  return { fake, made, bus, device: new Device() };
}

describe('the device’s master volume', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('is a fader position from 0 to 1 that a quiet setting has room in: its square is the gain', () => {
    expect(taper(0)).toBe(0);
    expect(taper(1)).toBe(1);
    expect(taper(0.5)).toBe(0.25);
  });

  it('starts whole, and keeps what was set, for the next visit', () => {
    const { device: first } = device();
    expect(first.volume).toBe(1);
    first.volume = 0.4;
    expect(localStorage.getItem(VOLUME_KEY)).toBe('0.4');
    expect(device().device.volume).toBe(0.4);
  });

  it('ignores what was kept that is no fader position', () => {
    for (const kept of ['loud', '2', '-1', 'NaN', '']) {
      localStorage.setItem(VOLUME_KEY, kept);
      expect(device().device.volume, kept).toBe(1);
    }
  });

  it('opens no audio to set the volume, since a browser starts audio only after a gesture, and gives it to the synth once there is one', () => {
    const { device: d, made, bus } = device();
    d.volume = 0.5;
    expect(made).not.toHaveBeenCalled();
    d.clockOf();
    expect(made).toHaveBeenCalledOnce();
    expect(bus().gain.events.at(-1)).toEqual(['setValueAtTime', BUS_GAIN * 0.25, 0]);
  });

  it('glides what plays to a new volume, without a step to click on', () => {
    const { device: d, bus } = device();
    d.clockOf();
    d.volume = 0.5;
    const [name, target, , tau] = bus().gain.events.at(-1)!;
    expect([name, target]).toEqual(['setTargetAtTime', BUS_GAIN * 0.25]);
    expect(tau).toBeGreaterThan(0);
    expect(tau).toBeLessThan(0.05);
  });
});

describe('the fades in and out of a session', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('mutes at once, so a session joined is silent until it fades in, then rises to the volume', () => {
    const { device: d, bus } = device();
    d.volume = 0.5;
    d.mute();
    expect(bus().gain.events.at(-1)).toEqual(['setValueAtTime', 0, 0]);
    d.fadeIn();
    expect(bus().gain.events.at(-1)).toEqual(['setTargetAtTime', BUS_GAIN * 0.25, 0, FADE_IN / 4]);
  });

  it('fades out over its time before it says it is done, and puts the volume back for what plays next', async () => {
    const { device: d, bus } = device();
    d.clockOf();
    let done = false;
    const fading = d.fadeOut().then(() => (done = true));
    expect(bus().gain.events.at(-1)).toEqual(['setTargetAtTime', 0, 0, FADE_OUT / 4]);
    await vi.advanceTimersByTimeAsync(FADE_OUT * 1000 - 1);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await fading;
    expect(done).toBe(true);
    d.restore();
    expect(bus().gain.events.at(-1)).toEqual(['setValueAtTime', BUS_GAIN, 0]);
  });
});

describe('the device’s MIDI ports', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    uninstallMidi();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  /** Web MIDI with two inputs and one output, that a test can plug more into (webmidi's fakes). */
  function midi() {
    const keys = fakeInput('in-1', 'Keys');
    const pads = fakeInput('in-2', 'Pads');
    const synth = fakePort('out-1', 'Synth');
    const access = fakeAccess([keys, pads], [synth]);
    installMidi(access);
    return { access, keys, pads, synth };
  }

  /** A device whose book is changed by `change`, before it connects. */
  const changed = (d: Device, change: (book: SetupBook) => SetupBook) =>
    (d.settings.book = change(d.settings.book));

  it('lists the ports once connected', async () => {
    midi();
    const { device: d } = device();
    expect(d.ports).toEqual({ inputs: [], outputs: [] });
    await d.connect(() => {});
    expect(d.ports).toEqual({
      inputs: [
        { id: 'in-1', name: 'Keys' },
        { id: 'in-2', name: 'Pads' },
      ],
      outputs: [{ id: 'out-1', name: 'Synth' }],
    });
  });

  it('plays a migrated store as it did: the input listened to alone, heard, and passed on to the output on the thru channel', async () => {
    const { keys, pads, synth } = midi();
    localStorage.setItem(
      'jambot-midi-v1',
      JSON.stringify({ outPortId: 'out-1', inPortId: 'in-1', thru: true, thruChannel: 3 }),
    );
    const { device: d } = device();
    expect(d.remembersPorts).toBe(true);
    const heard = vi.fn();
    await d.connect(heard);
    expect(hardwareOutputs(d.settings.setup)[0]!.name).toBe('Synth');
    expect(pads.onmidimessage).toBeNull();
    keys.play([0x90, 60, 100]);
    keys.play([0x80, 60, 0]);
    expect(
      heard.mock.calls.map(([note, source, part]) => [note.note, note.on, source, part]),
    ).toEqual([
      [60, true, 'Keys', 'lead'],
      [60, false, 'Keys', 'lead'],
    ]);
    expect(synth.sent).toEqual([
      { data: [0x92, 60, 100], timestamp: undefined },
      { data: [0x82, 60, 0], timestamp: undefined },
    ]);
    d.forwardKeys(64, 90, true, 0);
    expect(synth.sent.at(-1)).toEqual({ data: [0x92, 64, 90], timestamp: undefined });
  });

  it('passes on an input routed and not heard, without the Muse hearing it, and keeps its channel as played', async () => {
    const { keys, pads, synth } = midi();
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    changed(d, (book) => withCrossing(book, BAND, 'in:Pads', 'o1', AS_PLAYED));
    const heard = vi.fn();
    await d.connect(heard);
    expect(keys.onmidimessage).toBeNull();
    pads.play([0x95, 50, 80]);
    expect(heard).not.toHaveBeenCalled();
    expect(synth.sent).toEqual([{ data: [0x95, 50, 80], timestamp: undefined }]);
  });

  it('listens again when what is heard changes', async () => {
    const { keys, pads } = midi();
    const { device: d } = device();
    await d.connect(() => {});
    expect([keys.onmidimessage, pads.onmidimessage]).toEqual([null, null]);
    changed(d, (book) => withPlays(book, ANY_INPUT, 'default'));
    expect(keys.onmidimessage).not.toBeNull();
    expect(pads.onmidimessage).not.toBeNull();
  });

  it('gives a note the part its input plays, whatever its channel (yggi/webmidi#43)', async () => {
    const { pads } = midi();
    const { device: d } = device();
    changed(d, (book) => withPlays(book, 'in:Pads', { row: 'drums', role: 'drums' }));
    const heard = vi.fn();
    await d.connect(heard);
    pads.play([0x90, 36, 100]);
    expect(heard.mock.calls.map(([note, source, part]) => [note.note, source, part])).toEqual([
      [36, 'Pads', 'drums'],
    ]);
  });

  it('passes nothing on from the keys without a crossing of their row', async () => {
    const { synth } = midi();
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    await d.connect(() => {});
    d.forwardKeys(60, 100, true, 0);
    expect(synth.sent).toEqual([]);
  });

  it('passes a played note on at once to every output, whatever its latency: the band goes that much earlier, the played note lands that much later (#565)', async () => {
    const keys = fakeInput('in-1', 'Keys');
    const synth = fakePort('out-1', 'Synth');
    const slow = fakePort('out-2', 'Slow');
    installMidi(fakeAccess([keys], [synth, slow]));
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    changed(d, (book) => addOutput(book, { id: 'out-2', name: 'Slow' }).book);
    changed(d, (book) => withProfile(book, 'Slow', { latency: 30 }));
    changed(d, (book) => withCrossing(book, BAND, KEYS, 'o1', 1));
    changed(d, (book) => withCrossing(book, BAND, KEYS, 'o2', 1));
    await d.connect(() => {});
    d.forwardKeys(60, 100, true, 0);
    // (each at once and unstamped, as a port sends when it is given none: neither is sent early by its latency, and
    // an output of 0 ms is as it was)
    expect(synth.sent).toEqual([{ data: [0x90, 60, 100], timestamp: undefined }]);
    expect(slow.sent).toEqual([{ data: [0x90, 60, 100], timestamp: undefined }]);
  });

  it('picks up an output of the setup when it is plugged in later', async () => {
    const { access } = midi();
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-2', name: 'Launchpad' }));
    changed(d, (book) => withCrossing(book, BAND, KEYS, 'o1', 1));
    await d.connect(() => {});
    d.forwardKeys(60, 100, true, 0); // nowhere to go yet
    const back = fakePort('out-2', 'Launchpad');
    access.outputs.set(back.id, back);
    access.change();
    expect(d.ports.outputs.map((p) => p.name)).toEqual(['Synth', 'Launchpad']);
    d.forwardKeys(62, 100, true, 0);
    expect(back.sent.map((m) => m.data)).toEqual([[0x90, 62, 100]]);
  });

  it('looks again when a person asks, and lets go of a port that is gone', async () => {
    const { access, synth } = midi();
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    changed(d, (book) => withCrossing(book, BAND, KEYS, 'o1', 1));
    await d.connect(() => {});
    access.outputs.delete('out-1'); // gone without a state change reaching the page
    d.refresh();
    expect(d.ports.outputs).toEqual([]);
    d.forwardKeys(60, 100, true, 0);
    expect(synth.sent).toEqual([]);
  });

  it('sends a test note on an output, and its release a moment later', async () => {
    const { synth } = midi();
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    await d.connect(() => {});
    d.testNote('o1', 2);
    expect(synth.sent.map((m) => m.data)).toEqual([
      [0x91, 60, 100],
      [0x81, 60, 0],
    ]);
    expect(synth.sent[1]!.timestamp).toBeGreaterThan(0);
  });

  it('sweeps one output by its key: All notes off, All sound off and sustain off on the 16 channels, at once', async () => {
    const { synth } = midi();
    const { device: d } = device();
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    await d.connect(() => {});
    d.panicOutput('o1');
    expect(synth.sent.map((m) => m.data)).toEqual(
      Array.from({ length: 16 }, (_, ch) =>
        [123, 120, 64].map((controller) => [0xb0 | ch, controller, 0]),
      ).flat(),
    );
    expect(synth.sent.every((m) => m.timestamp === 0)).toBe(true);
    d.panicOutput('nowhere');
    expect(synth.sent).toHaveLength(48);
  });

  it('hands an input’s messages to the control panels its row crosses, and a panel’s touch out through the setup’s outputs', async () => {
    const { keys, synth } = midi();
    const { device: d } = device();
    const row = inputRow({ id: 'in-1', name: 'Keys' });
    changed(d, (book) =>
      withCrossing(
        withCrossing(
          withCrossing(
            withPanelActive(
              chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }),
              'mixer',
              true,
            ),
            BAND,
            row,
            panelKey('mixer'),
            AS_PLAYED,
          ),
          BAND,
          panelKey('mixer'),
          'o1',
          2,
        ),
        BAND,
        row,
        'o1',
        AS_PLAYED,
      ),
    );
    await d.connect(() => {});
    keys.play([0xb0, 40, 127]);
    expect(d.panels.runtimeOf('mixer')!.value('main').x).toBe(1);
    d.panels.played('mixer', [0xb0, 40, 64]);
    expect(synth.sent.map((m) => m.data)).toEqual([[0xb1, 40, 64]]);
  });

  describe('what a panel plays (yggi/jambot#703)', () => {
    const NUMBERS: Record<string, number | undefined> = {
      cc: 7,
      cc14: 1,
      note: 60,
      nrpn: 300,
      rpn: 5,
    };
    /** What the handler heard, by source: a note's own fields and the part it went to. */
    type Heard = {
      source: string;
      on: boolean;
      note: number;
      velocity: number;
      channel: number;
      part: string;
    };

    /** A device with a panel `t` of one fader bound as `kind`, playing `choice`, and what it hears. */
    function withPanel(kind: (typeof BINDING_KINDS)[number], choice: PlaysChoice) {
      const { keys } = midi();
      const { device: d } = device();
      const heard: Heard[] = [];
      const record = (n: ParsedNote, source: string, part: string) =>
        void heard.push({
          source,
          on: n.on,
          note: n.note,
          velocity: n.velocity,
          channel: n.channel,
          part,
        });
      d.hear(record);
      d.panels.edit({
        id: 't',
        name: 'T',
        children: [
          {
            type: 'fader',
            id: 'c',
            bind: [
              {
                kind,
                ...(NUMBERS[kind] === undefined ? {} : { number: NUMBERS[kind] }),
                channel: 2,
              },
            ],
          },
        ],
      });
      changed(d, (book) =>
        withPlays(
          withPlays(withPanelActive(book, 't', true), 'panel:t', choice),
          'in:Keys',
          choice,
        ),
      );
      return { keys, d, heard, record };
    }

    it.each(BINDING_KINDS)(
      'a %s binding’s message does what the same bytes from an input with that Plays do, among the parts played and on none',
      async (kind) => {
        for (const choice of ['default', { row: 'bass', role: 'bass' }, 'none'] as PlaysChoice[]) {
          const { keys, d, heard, record } = withPanel(kind, choice);
          await d.connect(record);
          const sent = [
            ...d.panels.runtimeOf('t')!.move('c', { x: 1 }),
            ...d.panels.runtimeOf('t')!.move('c', { x: 0 }),
          ];
          expect(sent.length).toBeGreaterThan(0);
          for (const message of sent) {
            d.panels.played('t', message);
            keys.play(message);
          }
          const bySource = (source: string) =>
            heard
              .filter((h) => h.source === source)
              .map((h) => [h.on, h.note, h.velocity, h.channel, h.part]);
          expect(bySource('panel:t')).toEqual(bySource('Keys'));
          // (a note is heard, by the part chosen; every other kind is no note, on an input or a panel)
          expect(bySource('panel:t').length).toBe(kind === 'note' && choice !== 'none' ? 2 : 0);
          if (kind === 'note' && choice !== 'none')
            expect(bySource('panel:t').map((h) => h[4])).toEqual(
              Array(2).fill(choice === 'default' ? 'lead' : 'bass'),
            );
        }
      },
    );

    it('is heard with no MIDI connected, and on none does nothing', () => {
      const { d, heard } = withPanel('note', 'default');
      const runtime = d.panels.runtimeOf('t')!;
      d.panels.played('t', runtime.move('c', { x: 1 })[0]!);
      expect(heard.map((h) => [h.source, h.note, h.on])).toEqual([['panel:t', 60, true]]);
      changed(d, (book) => withPlays(book, 'panel:t', 'none'));
      d.panels.played('t', runtime.move('c', { x: 0 })[0]!);
      expect(heard).toHaveLength(1);
    });
  });

  it('leaves out a port the browser keeps listed as disconnected', async () => {
    const { access } = midi();
    const { device: d } = device();
    await d.connect(() => {});
    const unplugged = Object.assign(fakePort('out-2', 'Unplugged'), { state: 'disconnected' });
    access.outputs.set(unplugged.id, unplugged);
    access.change();
    expect(d.ports.outputs.map((p) => p.name)).toEqual(['Synth']);
  });

  it('remembers an input chosen alone, not plugged in yet, so a load connects again', () => {
    localStorage.setItem('jambot-midi-v1', JSON.stringify({ outPortId: 'none', inPortId: 'in-1' }));
    const { device: d } = device();
    expect(d.remembersPorts).toBe(true);
  });

  it('has nothing to look at before it is connected, and remembers no port on a first visit', () => {
    const { device: d } = device();
    expect(() => d.refresh()).not.toThrow();
    expect(d.ports).toEqual({ inputs: [], outputs: [] });
    expect(d.remembersPorts).toBe(false);
  });

  it('says the browser is still asking when it hasn’t answered, and lets Connect be pressed again', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('navigator', { requestMIDIAccess: () => new Promise(() => {}) });
      const { device: d } = device();
      void d.connect(() => {});
      expect(d.connecting).toBe(true);
      await vi.advanceTimersByTimeAsync(CONNECT_WAIT);
      expect(d.connecting).toBe(false);
      expect(d.message).toMatch(/^Still waiting for the browser to allow MIDI/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('says what went wrong with a test note, and with a port that throws, instead of failing silently', async () => {
    const { synth } = midi();
    const { device: d } = device();
    d.testNote('o1', 1);
    expect(d.problems).toEqual([
      'The test note has no port to go to: choose a device that is plugged in',
    ]);
    changed(d, (book) => chooseDevice(book, 'o1', { id: 'out-1', name: 'Synth' }));
    await d.connect(() => {});
    synth.send = () => {
      throw new DOMException('port gone', 'InvalidStateError');
    };
    d.testNote('o1', 1);
    expect(d.problems.at(-1)).toBe('The test note couldn’t be sent (InvalidStateError: port gone)');
    d.dismissProblems();
    expect(d.problems).toEqual([]);
  });

  it('says a note it couldn’t play, and plays the next', async () => {
    const { keys } = midi();
    const { device: d } = device();
    changed(d, (book) => withPlays(book, 'in:Keys', 'default'));
    const heard: number[] = [];
    await d.connect((note) => {
      if (note.note === 61) throw new Error('no part');
      heard.push(note.note);
    });
    keys.play([0x90, 61, 100]);
    keys.play([0x90, 60, 100]);
    expect(heard).toEqual([60]);
    expect(d.problems).toEqual(['A note from Keys couldn’t be played (Error: no part)']);
  });

  it('says why it could not connect', async () => {
    installMidi(new Error('no'));
    const { device: d } = device();
    await d.connect(() => {});
    expect(d.access).toBeNull();
    expect(d.connecting).toBe(false);
    expect(d.message).toMatch(/blocked/);
  });
});
