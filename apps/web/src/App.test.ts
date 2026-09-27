import { PRESETS } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.svelte';

/**
 * Just enough of Web Audio for `Player.playAlong` to run without throwing:
 * every method `webAudioOutput`, `drumKit` and `voices` call, doing
 * nothing. What matters here is where a note is routed, not what it
 * sounds like.
 */
function fakeAudioContext() {
  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    setTargetAtTime: () => {},
  });
  const node = () => ({ connect: (to: unknown) => to });
  return {
    sampleRate: 44100,
    currentTime: 0,
    outputLatency: 0,
    baseLatency: 0,
    destination: node(),
    createDynamicsCompressor: () => node(),
    createGain: () => ({ ...node(), gain: param() }),
    createBiquadFilter: () => ({ ...node(), type: '', Q: param(), frequency: param() }),
    createOscillator: () => ({ ...node(), type: '', frequency: param(), start() {}, stop() {} }),
    createBuffer: () => ({ getChannelData: () => new Float32Array(1) }),
    createBufferSource: () => ({ ...node(), buffer: null, start() {}, stop() {} }),
    resume: () => Promise.resolve(),
  };
}

describe('the app', () => {
  it('offers the band, the presets and the style sliders', () => {
    render(App);
    expect(screen.getByRole('heading', { name: 'Jambot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the band' })).toBeInTheDocument();
    for (const p of PRESETS)
      expect(screen.getByRole('button', { name: p.name })).toBeInTheDocument();
    for (const name of ['Swing', 'Syncopation', 'Harmony', 'Articulation', 'Energy', 'Entropy'])
      expect(screen.getByRole('slider', { name: new RegExp(name) })).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('starts from Synth-pop, and a preset sets the sliders and tempo at once while stopped', async () => {
    render(App);
    expect(screen.getByRole('button', { name: 'Synth-pop' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Tempo')).toHaveTextContent('108 BPM');
    await fireEvent.click(screen.getByRole('button', { name: 'Swing jazz' }));
    expect(screen.getByRole('button', { name: 'Swing jazz' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('slider', { name: /Swing/ })).toHaveValue('100');
    expect(screen.getByLabelText('Tempo')).toHaveTextContent('148 BPM');
  });

  it('nudges the tempo, and names the style by its preset: energy and entropy keep it, anything else makes it custom', async () => {
    render(App);
    const synthPop = () => screen.getByRole('button', { name: 'Synth-pop' });
    for (const name of [/Energy/, /Entropy/]) {
      await fireEvent.input(screen.getByRole('slider', { name }), { target: { value: '90' } });
      expect(synthPop()).toHaveAttribute('aria-pressed', 'true');
    }
    await fireEvent.click(screen.getByRole('button', { name: 'Faster' }));
    expect(screen.getByLabelText('Tempo')).toHaveTextContent('110 BPM');
    expect(synthPop()).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(screen.getByRole('button', { name: 'Slower' }));
    expect(synthPop()).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.input(screen.getByRole('slider', { name: /Syncopation/ }), {
      target: { value: '80' },
    });
    expect(screen.getByRole('slider', { name: /Syncopation/ })).toHaveValue('80');
    expect(synthPop()).toHaveAttribute('aria-pressed', 'false');
  });

  it('links to the prototype for what it does not do yet: the score and the Muse’s judgement', () => {
    render(App);
    expect(screen.getByText(/drums, bass, chords and lead/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'prototype' })).toHaveAttribute(
      'href',
      '/prototype.html',
    );
  });

  describe('routing what is played to the keyboard or the pads', () => {
    beforeEach(() => {
      vi.stubGlobal('AudioContext', vi.fn(fakeAudioContext));
      localStorage.clear();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      localStorage.clear();
    });

    it('sends a computer key to the keyboard or the pads by its own map', async () => {
      render(App);
      await fireEvent.keyDown(window, { key: 'a' });
      expect(screen.getByRole('button', { name: 'C4' })).toHaveClass('down');
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

      render(App);
      await fireEvent.click(screen.getByRole('button', { name: 'Connect MIDI' }));
      await fireEvent.change(screen.getByRole('combobox', { name: 'Listen to input' }), {
        target: { value: 'all' },
      });

      port.onmidimessage!({ data: [0x99, 36, 100] } as unknown as MIDIMessageEvent); // channel 10: kick
      await tick();
      expect(screen.getByRole('button', { name: 'Kick' })).toHaveClass('down');

      port.onmidimessage!({ data: [0x90, 64, 100] } as unknown as MIDIMessageEvent); // channel 1: E4
      await tick();
      expect(screen.getByRole('button', { name: 'E4' })).toHaveClass('down');

      delete (navigator as unknown as { requestMIDIAccess?: unknown }).requestMIDIAccess;
    });
  });
});
