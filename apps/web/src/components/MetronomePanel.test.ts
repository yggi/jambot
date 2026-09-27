import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ClickOutput } from '../audio/metronome-click.ts';
import { Metronome, type MetronomeSurroundings } from '../metronome.svelte.ts';
import MetronomePanel from './MetronomePanel.svelte';

/** Surroundings a test drives by hand, standing in for Web Audio. */
function fakeSurroundings(): MetronomeSurroundings {
  const output: ClickOutput = {
    currentTime: 0,
    latency: 0,
    resume: () => Promise.resolve(),
    click: { play: () => {} },
  };
  return {
    output: () => output,
    ticker: () => () => {},
    frame: () => () => {},
  };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => localStorage.clear());

describe('the metronome panel', () => {
  it('starts and stops from the toggle button', async () => {
    const metronome = new Metronome(() => 120, fakeSurroundings());
    render(MetronomePanel, { metronome });
    expect(screen.getByRole('button', { name: 'Start metronome' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Start metronome' }));
    await settle();
    expect(metronome.on).toBe(true);
    expect(screen.getByRole('button', { name: 'Stop metronome' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Stop metronome' }));
    expect(metronome.on).toBe(false);
  });

  it('picks a meter, pressed, from the four offered', async () => {
    const metronome = new Metronome(() => 120, fakeSurroundings());
    render(MetronomePanel, { metronome });
    expect(screen.getByRole('button', { name: '4/4' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: '6/8' }));
    expect(metronome.meter).toBe('6/8');
    expect(screen.getByRole('button', { name: '6/8' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4/4' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets the volume from the slider', async () => {
    const metronome = new Metronome(() => 120, fakeSurroundings());
    render(MetronomePanel, { metronome });
    await fireEvent.input(screen.getByRole('slider', { name: 'Volume' }), {
      target: { value: '30' },
    });
    expect(metronome.volume).toBe(0.3);
  });

  it('shows no pulse before anything is heard, then counts the pulse heard, of the meter’s pulses', async () => {
    const metronome = new Metronome(() => 120, fakeSurroundings());
    render(MetronomePanel, { metronome });
    expect(screen.getByText('Not running.')).toBeInTheDocument();
    metronome.pulse = 2;
    metronome.downbeat = false;
    await settle();
    expect(screen.getByText('Pulse 3 of 4')).toBeInTheDocument();
  });
});
