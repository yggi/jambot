import { PRESETS } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import App from './App.svelte';

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

  it('links to the prototype for what it does not do yet: the score, MIDI out and the Muse', () => {
    render(App);
    expect(screen.getByText(/drums, bass, chords and lead/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'prototype' })).toHaveAttribute(
      'href',
      '/prototype.html',
    );
  });
});
