import { TEMPO_REACH } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Metronome } from '../metronome.svelte.ts';
import Metrum from './Metrum.svelte';

const tempo = { bpm: 108, base: 108, nudge: 0, low: -TEMPO_REACH, high: TEMPO_REACH };

const props = (metronome: Metronome, more: Partial<Parameters<typeof render>[1]> = {}) => ({
  tempo,
  swing: 0,
  metronome,
  playing: false,
  onintent: () => {},
  ...more,
});

beforeEach(() => localStorage.clear());

describe('the metrum', () => {
  it('reads the tempo, the meter and the swing value in its header, folded by default', () => {
    const { container } = render(Metrum, props(new Metronome(), { swing: 1 }));
    expect(container.querySelector('summary .name')).toHaveTextContent('108 BPM');
    expect(container.querySelector('summary .sub')).toHaveTextContent('4/4 · swing 100 %');
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('names itself in its own header, over the tempo', () => {
    const { container } = render(Metrum, props(new Metronome()));
    expect(container.querySelector('summary .heading')).toHaveTextContent('Metrum');
  });

  it('says in its header that the click is on', () => {
    const metronome = new Metronome();
    metronome.on = true;
    const { container } = render(Metrum, props(metronome));
    expect(container.querySelector('summary .sub')).toHaveTextContent('4/4 · swing 0 % · clicking');
  });

  it('nudges the tempo through the same intent, and a client’s nudges rest', async () => {
    const onintent = vi.fn();
    const { rerender } = render(Metrum, props(new Metronome(), { onintent }));
    await fireEvent.click(screen.getByRole('button', { name: 'Faster' }));
    expect(onintent).toHaveBeenCalledOnce();
    await rerender({ following: true });
    expect(screen.getByRole('button', { name: 'Faster' })).toBeDisabled();
  });

  it('shows the swing as a gauge, empty at none and full at all', () => {
    const marker = (swing: number) => {
      const { container, unmount } = render(Metrum, props(new Metronome(), { swing }));
      const left = (container.querySelector('[aria-label^="Swing"] .value') as HTMLElement).style
        .left;
      const reading = screen.getByText(`${Math.round(swing * 100)} %`);
      expect(reading).toBeInTheDocument();
      unmount();
      return left;
    };
    expect(marker(0)).toBe('0%');
    expect(marker(1)).toBe('100%');
  });

  it('draws the bar’s 16 steps and moves the offbeat eighths with the swing', () => {
    const { container, unmount } = render(Metrum, props(new Metronome()));
    const straight = [...container.querySelectorAll('svg.ruler circle.mark')].map((m) =>
      m.getAttribute('cx'),
    );
    expect(straight).toHaveLength(16);
    expect(container.querySelectorAll('svg.ruler line.tick')).toHaveLength(17);
    unmount();
    const swung = render(Metrum, props(new Metronome(), { swing: 1 }));
    const cx = [...swung.container.querySelectorAll('svg.ruler circle.mark')].map((m) =>
      Number(m.getAttribute('cx')),
    );
    expect(cx[2]).toBeGreaterThan(Number(straight[2]));
    expect(cx[4]).toBe(Number(straight[4]));
  });

  it('lights the eighth heard', async () => {
    const metronome = new Metronome();
    const { container } = render(Metrum, props(metronome, { playing: true }));
    expect(container.querySelectorAll('svg.ruler circle.lit')).toHaveLength(0);
    metronome.eighth = 3;
    metronome.pulse = 1;
    await Promise.resolve();
    expect(container.querySelectorAll('svg.ruler circle.lit')).toHaveLength(1);
  });

  it('switches the click on and off, and sets its volume', async () => {
    const metronome = new Metronome();
    render(Metrum, props(metronome));
    const click = screen.getByRole('button', { name: 'Click' });
    expect(click).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(click);
    expect(metronome.on).toBe(true);
    expect(click).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(click);
    expect(metronome.on).toBe(false);
    await fireEvent.input(screen.getByRole('slider', { name: 'Volume' }), {
      target: { value: '30' },
    });
    expect(metronome.volume).toBe(0.3);
  });

  it('says what the click is doing: off, waiting for the band, or the pulse counted', async () => {
    const metronome = new Metronome();
    const { rerender } = render(Metrum, props(metronome));
    expect(screen.getByText('Off')).toBeInTheDocument();
    metronome.on = true;
    await Promise.resolve();
    expect(screen.getByText('Waiting for the band')).toBeInTheDocument();
    await rerender({ playing: true });
    metronome.pulse = 2;
    await Promise.resolve();
    expect(screen.getByText('Pulse 3 of 4')).toBeInTheDocument();
  });
});
