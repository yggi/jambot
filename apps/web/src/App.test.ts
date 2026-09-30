import { PRESETS } from '@jambot/engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import App from './App.svelte';
import { fakeAudioContext } from './audio/fake-context.ts';
import { FADE_OUT } from './device.svelte.ts';

/** The page past its door: solo chosen, the band behind it. */
async function renderBand() {
  const rendered = render(App);
  await fireEvent.click(screen.getByRole('button', { name: 'Play with the band' }));
  return rendered;
}

/** The tempo played, as the metrum card's headline reads it. */
const tempo = () => screen.getByLabelText('Metrum').querySelector('summary .main');

describe('the app', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  describe('at the door', () => {
    it('meets a cold start with the lobby, not the band: a name made up, solo, join and host', () => {
      render(App);
      expect(screen.getByLabelText('Your name')).not.toHaveValue('');
      expect(screen.getByRole('button', { name: 'Play with the band' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Join a session' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Local' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Global' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Start the band' })).toBeNull();
    });

    it('keeps the sound card in reach, on both sides of the door', async () => {
      render(App);
      expect(screen.getByLabelText('Sound')).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Play with the band' }));
      expect(screen.getByLabelText('Sound')).toBeInTheDocument();
    });

    it('goes back to the lobby from solo, and a reload from solo lands on the door', async () => {
      const { unmount } = await renderBand();
      await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
      expect(screen.getByRole('button', { name: 'Play with the band' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Start the band' })).toBeNull();
      await fireEvent.click(screen.getByRole('button', { name: 'Play with the band' }));
      unmount();
      render(App);
      expect(screen.getByRole('button', { name: 'Play with the band' })).toBeInTheDocument();
    });

    it('opens the timing test from the lobby, takes a key press for a tap, and goes back', async () => {
      const fake = fakeAudioContext();
      vi.stubGlobal(
        'AudioContext',
        vi.fn(function () {
          return fake.context;
        }),
      );
      onTestFinished(() => void vi.unstubAllGlobals());
      render(App);
      await fireEvent.click(screen.getByRole('button', { name: 'Timing test' }));
      expect(screen.getByRole('region', { name: 'Timing test' })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Join a session' })).toBeNull();
      expect(screen.getByLabelText('Sound')).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Start the test' }));
      expect(await screen.findByRole('button', { name: 'Tap along' })).toBeInTheDocument();
      await fireEvent.keyDown(window, { key: 'a' });
      await fireEvent.keyDown(window, { key: 'Enter' });
      expect(screen.getByText('No hit near that tap')).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
      expect(screen.getByRole('button', { name: 'Play with the band' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Tap along' })).toBeNull();
    });

    it('hosts a session locally, closes it only when sure, and lands back at the door', async () => {
      vi.stubGlobal(
        'AudioContext',
        vi.fn(function () {
          return fakeAudioContext().context;
        }),
      );
      onTestFinished(() => void vi.unstubAllGlobals());
      render(App);
      await fireEvent.input(screen.getByLabelText('Session name'), { target: { value: 'Garage' } });
      await fireEvent.click(screen.getByRole('button', { name: 'Local' }));
      expect(await screen.findByText(/Nobody has joined yet/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start the band' })).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Close Garage?');
      await fireEvent.click(screen.getByRole('button', { name: 'Yes, close it' }));
      expect(await screen.findByRole('button', { name: 'Play with the band' })).toBeInTheDocument();
      expect(localStorage.getItem('jambot:host-session')).toBeNull();
    });

    it('fades the band out when leaving, and has the volume back for the next time', async () => {
      const fake = fakeAudioContext();
      vi.stubGlobal(
        'AudioContext',
        vi.fn(function () {
          return fake.context;
        }),
      );
      onTestFinished(() => void vi.unstubAllGlobals());
      await renderBand();
      await fireEvent.click(screen.getByRole('button', { name: 'Start the band' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument());
      const bus = () => fake.gains.filter((g) => g.connections.includes(fake.compressors[0]));
      await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
      // The band plays on while it fades: the door has not come yet.
      expect(screen.queryByRole('button', { name: 'Play with the band' })).toBeNull();
      expect(bus()[0]!.gain.events.at(-1)).toEqual(['setTargetAtTime', 0, 0, FADE_OUT / 4]);
      expect(
        await screen.findByRole('button', { name: 'Play with the band' }, { timeout: 2000 }),
      ).toBeInTheDocument();
      // What plays next opens at the volume again, not at the silence the fade left.
      expect(bus().at(-1)!.gain.events.at(-1)).toEqual(['setValueAtTime', 0.8, 0]);
    });

    it('keeps the volume a person set, on both sides of the door', async () => {
      const { unmount } = render(App);
      await fireEvent.input(screen.getByRole('slider', { name: /^Volume/ }), {
        target: { value: '40' },
      });
      await fireEvent.click(screen.getByRole('button', { name: 'Play with the band' }));
      expect(screen.getByRole('slider', { name: /^Volume/ })).toHaveValue('40');
      unmount();
      render(App);
      expect(screen.getByRole('slider', { name: /^Volume/ })).toHaveValue('40');
    });

    it('keeps the name a person gave for next time', async () => {
      const { unmount } = render(App);
      await fireEvent.input(screen.getByLabelText('Your name'), { target: { value: 'Ada' } });
      unmount();
      render(App);
      expect(screen.getByLabelText('Your name')).toHaveValue('Ada');
    });
  });

  it('offers the band, the presets and the style sliders', async () => {
    await renderBand();
    expect(screen.getByRole('heading', { name: 'Jambot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the band' })).toBeInTheDocument();
    for (const p of PRESETS)
      expect(screen.getByRole('radio', { name: p.name })).toBeInTheDocument();
    for (const name of ['Swing', 'Syncopation', 'Harmony', 'Articulation', 'Energy', 'Entropy'])
      expect(screen.getByRole('slider', { name: new RegExp(name) })).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('lays the page out as cards and levels, the sound folded above the music in the order of the composition', async () => {
    const { container } = await renderBand();
    const levels = [...container.querySelectorAll('h2, .card > summary .title')].map(
      (h) => h.textContent,
    );
    expect(levels.slice(0, 8)).toEqual([
      'Sound',
      'Transport',
      'Style',
      'Metrum',
      'Key',
      'Plan',
      'Chords',
      'Tracks',
    ]);
    expect(screen.getByLabelText('Sound')).not.toHaveAttribute('open');
    expect(screen.getByText('Playing with the band on this device.')).toBeInTheDocument();
  });

  it('starts from Synth-pop, and a preset sets the sliders and tempo at once while stopped', async () => {
    await renderBand();
    expect(screen.getByRole('radio', { name: 'Synth-pop' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(tempo()).toHaveTextContent('108 BPM');
    await fireEvent.click(screen.getByRole('radio', { name: 'Swing jazz' }));
    expect(screen.getByRole('radio', { name: 'Swing jazz' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('slider', { name: /Swing/ })).toHaveValue('100');
    expect(tempo()).toHaveTextContent('148 BPM');
  });

  it('nudges the tempo within the style’s licence, and names the style by its preset: energy, entropy and the nudge keep it, anything else makes it custom', async () => {
    await renderBand();
    const synthPop = () => screen.getByRole('radio', { name: 'Synth-pop' });
    for (const name of [/Energy/, /Entropy/]) {
      await fireEvent.input(screen.getByRole('slider', { name }), { target: { value: '90' } });
      expect(synthPop()).toHaveAttribute('aria-checked', 'true');
    }
    await fireEvent.click(screen.getByRole('button', { name: 'Faster' }));
    expect(tempo()).toHaveTextContent('111 BPM');
    expect(synthPop()).toHaveAttribute('aria-checked', 'true');
    // A preset brings its own tempo, and the nudge carries over to it.
    await fireEvent.click(screen.getByRole('radio', { name: 'Techno' }));
    expect(tempo()).toHaveTextContent('134 BPM');
    await fireEvent.click(screen.getByRole('button', { name: 'Slower' }));
    expect(tempo()).toHaveTextContent('130 BPM');
    await fireEvent.input(screen.getByRole('slider', { name: /Syncopation/ }), {
      target: { value: '80' },
    });
    expect(screen.getByRole('slider', { name: /Syncopation/ })).toHaveValue('80');
    expect(screen.getByRole('radio', { name: 'Techno' })).toHaveAttribute('aria-checked', 'false');
  });

  it('links to the prototype for what it does not do yet: the score and the Muse’s judgement', async () => {
    await renderBand();
    expect(screen.getByText(/drums, bass, chords and lead/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'prototype' })).toHaveAttribute(
      'href',
      '/prototype.html',
    );
  });

  it('shows the timing panel only with ?timing in the address, and exports it as a file (#27)', async () => {
    const { unmount } = render(App);
    expect(screen.queryByRole('region', { name: 'Timing' })).toBeNull();
    unmount();
    history.replaceState(null, '', '/?timing');
    const { createObjectURL, revokeObjectURL } = URL;
    try {
      const created = vi.fn<(blob: Blob) => string>(() => 'blob:timing');
      Object.assign(URL, { createObjectURL: created, revokeObjectURL: () => {} });
      const clicked = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      render(App);
      const panel = screen.getByRole('region', { name: 'Timing' });
      expect(panel).toHaveTextContent('Steps laid, missed');
      await fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      expect(clicked).toHaveBeenCalledOnce();
      expect(clicked.mock.contexts[0]).toHaveProperty(
        'download',
        expect.stringMatching(/^jambot-timing-.*\.json$/),
      );
      const report = JSON.parse(await created.mock.calls[0]![0].text());
      expect(report).toMatchObject({ report: 'jambot timing', version: 1, mode: 'solo' });
    } finally {
      Object.assign(URL, { createObjectURL, revokeObjectURL });
      vi.restoreAllMocks();
      history.replaceState(null, '', '/');
    }
  });

  describe('routing what is played to the keyboard or the pads', () => {
    beforeEach(() => {
      vi.stubGlobal(
        'AudioContext',
        vi.fn(function () {
          return fakeAudioContext().context;
        }),
      );
      localStorage.clear();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('lights the on-screen key for a computer key pressed, and unlights it on release', async () => {
      await renderBand();
      const c4 = () => screen.getByRole('button', { name: 'C4' }); // 'a' maps to C4 (60)
      expect(c4().className).not.toContain('down');
      await fireEvent.keyDown(window, { key: 'a' });
      expect(c4().className).toContain('down');
      await fireEvent.keyUp(window, { key: 'a' });
      expect(c4().className).not.toContain('down');
    });

    it('ignores a repeated keydown and an unmapped key', async () => {
      await renderBand();
      const c4 = () => screen.getByRole('button', { name: 'C4' });
      await fireEvent.keyDown(window, { key: 'a', repeat: true });
      expect(c4().className).not.toContain('down');
      await fireEvent.keyDown(window, { key: 'z' });
      expect(c4().className).not.toContain('down');
    });

    it('sends a computer key to the keyboard or the pads by its own map', async () => {
      await renderBand();
      await fireEvent.keyDown(window, { key: 'a' });
      expect(screen.getByRole('button', { name: 'C4' })).toHaveClass('down');
      // The pads are the drums' instrument, under the drums once selected.
      await fireEvent.click(screen.getByRole('button', { name: 'Drums' }));
      await fireEvent.keyDown(window, { key: '1' });
      expect(screen.getByRole('button', { name: 'Kick' })).toHaveClass('down');
    });

    it('routes a MIDI note by its channel: 10 to the pads, every other to the keyboard', async () => {
      const port = {
        name: 'Test Keys',
        onmidimessage: null as ((e: MIDIMessageEvent) => void) | null,
      };
      const access = { inputs: new Map([['1', port]]), outputs: new Map(), onstatechange: null };
      (navigator as unknown as { requestMIDIAccess: unknown }).requestMIDIAccess = vi.fn(
        async () => access,
      );

      await renderBand();
      await fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI' }));
      await fireEvent.change(screen.getByRole('combobox', { name: 'Listen to input' }), {
        target: { value: 'all' },
      });

      port.onmidimessage!({ data: [0x90, 64, 100] } as unknown as MIDIMessageEvent); // channel 1: E4
      await tick();
      expect(screen.getByRole('button', { name: 'E4' })).toHaveClass('down');

      await fireEvent.click(screen.getByRole('button', { name: 'Drums' }));
      port.onmidimessage!({ data: [0x99, 36, 100] } as unknown as MIDIMessageEvent); // channel 10: kick
      await tick();
      expect(screen.getByRole('button', { name: 'Kick' })).toHaveClass('down');

      delete (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
    });

    it('reconnects on load to a port chosen before, without a click', async () => {
      const access = { inputs: new Map(), outputs: new Map([['out-1', {}]]), onstatechange: null };
      const requestMIDIAccess = vi.fn(async () => access);
      (navigator as unknown as { requestMIDIAccess: unknown }).requestMIDIAccess =
        requestMIDIAccess;
      localStorage.setItem('jambot-midi-v1', JSON.stringify({ outPortId: 'out-1' }));

      render(App);
      await waitFor(() => expect(requestMIDIAccess).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Connect MIDI' })).not.toBeInTheDocument(),
      );
      expect(screen.getByLabelText('Send to output')).toHaveValue('out-1');

      delete (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
    });

    it('never auto-connects when no port was ever chosen, so a first-time visit asks no permission unprompted', () => {
      const requestMIDIAccess = vi.fn(async () => ({
        inputs: new Map(),
        outputs: new Map(),
        onstatechange: null,
      }));
      (navigator as unknown as { requestMIDIAccess: unknown }).requestMIDIAccess =
        requestMIDIAccess;

      render(App);
      expect(requestMIDIAccess).not.toHaveBeenCalled();

      delete (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
    });

    it('sends all notes off on waking from a hidden tab, so a suspend never leaves hardware stuck', async () => {
      const port = { send: vi.fn() };
      const access = {
        inputs: new Map(),
        outputs: new Map([['out-1', port]]),
        onstatechange: null,
      };
      (navigator as unknown as { requestMIDIAccess: unknown }).requestMIDIAccess = vi.fn(
        async () => access,
      );

      await renderBand();
      await fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI' }));
      await fireEvent.change(screen.getByRole('combobox', { name: 'Send to output' }), {
        target: { value: 'out-1' },
      });
      await fireEvent.keyDown(window, { key: 'a' }); // creates the output, sending a note on
      await tick();
      port.send.mockClear();

      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      document.dispatchEvent(new Event('visibilitychange'));

      expect(port.send.mock.calls.some(([data]) => data[1] === 123)).toBe(true); // all notes off

      vi.restoreAllMocks();
      delete (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
    });
  });
});
