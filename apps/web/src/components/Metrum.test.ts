import { TEMPO_REACH, clockOf } from '@jambot/engine';
import { METERS, type MeterName, stepsOf } from '@jambot/theory';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Metronome } from '../metronome.svelte.ts';
import Metrum from './Metrum.svelte';

const tempo = { bpm: 108, base: 108, nudge: 0, low: -TEMPO_REACH, high: TEMPO_REACH };

const props = (metronome: Metronome, more: Partial<Parameters<typeof render>[1]> = {}) => ({
  tempo,
  swing: 0,
  metronome,
  heard: null,
  playing: false,
  onintent: () => {},
  ...more,
});

beforeEach(() => localStorage.clear());

describe('the metrum', () => {
  it('reads the tempo, the meter and the swing value in its header, folded by default', () => {
    const { container } = render(Metrum, props(new Metronome(), { swing: 1 }));
    expect(container.querySelector('summary .main')).toHaveTextContent('108 BPM');
    expect(container.querySelector('summary .sub')).toHaveTextContent('4/4 · swing 67 %');
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('asks for the meter of the next section, and rests on a client, which follows its host’s', async () => {
    const onmeter = vi.fn();
    const { rerender } = render(Metrum, props(new Metronome(), { asked: METERS['4/4'], onmeter }));
    const choice = screen.getByRole('radiogroup', { name: 'Meter for the next section' });
    expect(screen.getByRole('radio', { name: '4/4' })).toHaveAttribute('aria-checked', 'true');
    await fireEvent.click(screen.getByRole('radio', { name: '7/8' }));
    expect(onmeter).toHaveBeenCalledWith(METERS['7/8']);
    await rerender({ following: true });
    expect(choice.querySelectorAll('[role="radio"]:not([disabled])')).toHaveLength(0);
  });

  it('names itself in its own header, over the tempo', () => {
    const { container } = render(Metrum, props(new Metronome()));
    expect(container.querySelector('summary .title')).toHaveTextContent('Metrum');
  });

  it('says in its header that the click is on', () => {
    const metronome = new Metronome();
    metronome.on = true;
    const { container } = render(Metrum, props(metronome));
    expect(container.querySelector('summary .sub')).toHaveTextContent(
      '4/4 · swing 50 % · clicking',
    );
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
      unmount();
      return left;
    };
    expect(marker(0)).toBe('0%');
    expect(marker(1)).toBe('100%');
  });

  it('reads the swing as the share of a beat its first eighth holds, and the secondary swing as the sixteenths’: 50 straight, 67 the triplet', () => {
    const readings = (swing: number) => {
      const { container, unmount } = render(Metrum, props(new Metronome(), { swing }));
      const read = (label: string) =>
        [...container.querySelectorAll('.reading')]
          .find((r) => r.textContent?.includes(label))
          ?.textContent?.replace(label, '')
          .trim();
      const found = [read('Swing'), read('Secondary swing')];
      unmount();
      return found;
    };
    expect(readings(0)).toEqual(['50 %', '50 %']);
    expect(readings(0.5)).toEqual(['50 %', '67 %']);
    expect(readings(1)).toEqual(['67 %', '50 %']);
  });

  it('says in its header where the sixteenths swing too', () => {
    const { container } = render(Metrum, props(new Metronome(), { swing: 0.5 }));
    expect(container.querySelector('summary .sub')).toHaveTextContent(
      '4/4 · swing 50 % · 16ths 67 %',
    );
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

  it('lights the eighth heard, on the ruler and on the glyph, click or no click', async () => {
    const { container, rerender } = render(Metrum, props(new Metronome(), { playing: true }));
    const lit = (selector: string) => container.querySelectorAll(`${selector} circle.lit`);
    expect(lit('svg.ruler')).toHaveLength(0);
    expect(lit('summary svg.glyph')).toHaveLength(0);
    await rerender({ heard: 6 });
    expect(lit('svg.ruler')).toHaveLength(1);
    expect(lit('summary svg.glyph')).toHaveLength(1);
    await rerender({ heard: null });
    expect(lit('summary svg.glyph')).toHaveLength(0);
  });

  it('draws the bar in its summary as a glyph of lamps that moves with the swing', () => {
    const lamps = (swing: number) => {
      const { container, unmount } = render(Metrum, props(new Metronome(), { swing }));
      const drawn = [...container.querySelectorAll('summary svg.glyph circle.lamp')].map((c) =>
        [c.getAttribute('cx'), c.getAttribute('cy')].join(),
      );
      unmount();
      return drawn;
    };
    expect(lamps(0)).toHaveLength(8);
    expect(lamps(1)[1]).not.toBe(lamps(0)[1]);
    expect(lamps(1)[2]).toBe(lamps(0)[2]);
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
    await fireEvent.input(screen.getByRole('slider', { name: 'Click volume' }), {
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

  it('draws the bar of the meter it is given, in the header and on the ruler, and keeps its place (finite: every named meter)', () => {
    for (const name of Object.keys(METERS) as MeterName[]) {
      const meter = METERS[name];
      const { container, unmount } = render(Metrum, props(new Metronome(), { meter }));
      expect([name, container.querySelector('summary .sub')?.textContent]).toEqual([
        name,
        `${name} · swing 50 %`,
      ]);
      expect([
        name,
        container.querySelectorAll('svg.ruler circle.mark').length,
        container.querySelectorAll('svg.ruler line.tick').length,
        container.querySelectorAll('summary svg.glyph circle.lamp').length,
      ]).toEqual([name, stepsOf(meter), stepsOf(meter) + 1, meter.cycle]);
      unmount();
    }
  });

  it('lights the eighth of the bar heard by the song’s clock, a bar of 7/8 being 14 steps long', async () => {
    const clock = clockOf([
      { bar: 0, meter: METERS['4/4'] },
      { bar: 1, meter: METERS['7/8'] },
    ]);
    const { container, rerender } = render(
      Metrum,
      props(new Metronome(), { meter: METERS['7/8'], clock, playing: true }),
    );
    const lit = () =>
      [...container.querySelectorAll('svg.ruler circle.mark')].flatMap((m, i) =>
        m.classList.contains('lit') ? [i] : [],
      );
    // 16 steps of 4/4's bar 0, then bar 1 of 7/8: step 16 is its first, step 29 its last.
    await rerender({ heard: 16 });
    expect(lit()).toEqual([0]);
    await rerender({ heard: 16 + 13 });
    expect(lit()).toEqual([12]);
    await rerender({ heard: 16 + 14 });
    expect(lit()).toEqual([0]);
  });

  it('says what the click sounds between the pulses, the pulses alone to begin with, and sets it', async () => {
    const metronome = new Metronome();
    render(Metrum, props(metronome));
    const group = screen.getByRole('radiogroup', { name: 'Click between the pulses' });
    expect(screen.getByRole('radio', { name: 'Pulses' })).toBeChecked();
    expect(group).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('radio', { name: 'Eighths' }));
    expect(metronome.subdivision).toBe('eighths');
    expect(screen.getByRole('radio', { name: 'Eighths' })).toBeChecked();
    await fireEvent.click(screen.getByRole('radio', { name: 'Sixteenths' }));
    expect(metronome.subdivision).toBe('sixteenths');
  });
});
