import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LEAD_SECONDS, MeterPlayer, TICK_MS } from '../meter/meter-player.svelte.ts';
import { surroundings } from '../timing-test/fixtures.ts';
import MeterScreen from './Meter.svelte';

function shown() {
  const world = surroundings();
  const player = new MeterPlayer({ audio: () => ({ base: world.base, offset: world.offset }) });
  const onback = vi.fn();
  const rendered = render(MeterScreen, { player, onback });
  const run = (ms: number) => {
    for (let t = 0; t < ms; t += TICK_MS) {
      world.state.page += TICK_MS;
      vi.advanceTimersByTime(TICK_MS);
    }
  };
  return { ...world, player, onback, rendered, run };
}

beforeEach(() =>
  vi.useFakeTimers({
    toFake: ['setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame'],
  }),
);
afterEach(() => vi.useRealTimers());

describe('the metronome screen', () => {
  it('offers every named meter, 4/4 chosen, and writes its accents as a line', () => {
    shown();
    const meters = screen.getAllByRole('radio').map((r) => r.textContent?.trim());
    expect(meters).toEqual(['3/4', '4/4', '5/4', '5/8', '6/8', '7/8', '9/8', '10/8', '12/8']);
    expect(screen.getByRole('radio', { name: '4/4' })).toBeChecked();
    expect(screen.getByLabelText('Accents')).toHaveTextContent('* . - . + . - .');
  });

  it('chooses a meter and draws its bar: a mark on each of its steps', async () => {
    const { rendered } = shown();
    expect(rendered.container.querySelectorAll('svg.ruler circle.mark')).toHaveLength(16);
    await fireEvent.click(screen.getByRole('radio', { name: '5/4' }));
    expect(rendered.container.querySelectorAll('svg.ruler circle.mark')).toHaveLength(20);
    expect(screen.getByLabelText('Accents')).toHaveTextContent('* . - . - . + . - .');
  });

  it('sets the tempo, the swing, the ternary swing and the accent grade on the player', async () => {
    const { player } = shown();
    await fireEvent.input(screen.getByRole('slider', { name: 'Tempo' }), {
      target: { value: '132' },
    });
    await fireEvent.input(screen.getByRole('slider', { name: 'Swing' }), {
      target: { value: '60' },
    });
    await fireEvent.input(screen.getByRole('slider', { name: 'Ternary swing' }), {
      target: { value: '40' },
    });
    await fireEvent.input(screen.getByRole('slider', { name: 'Accent grade' }), {
      target: { value: '25' },
    });
    expect([player.bpm, player.swing, player.ternary, player.grade]).toEqual([132, 0.6, 0.4, 0.25]);
  });

  it('mirrors the grouping of 5/4 as 2+3, and offers it nowhere else', async () => {
    const { player } = shown();
    const mirror = screen.getByRole('button', { name: 'Mirror the grouping' });
    expect(mirror).toBeDisabled();
    await fireEvent.click(screen.getByRole('radio', { name: '5/4' }));
    expect(mirror).toBeEnabled();
    await fireEvent.click(mirror);
    expect(player.mirror).toBe(true);
    expect(screen.getByLabelText('Accents')).toHaveTextContent('* . - . + . - . - .');
    await fireEvent.click(screen.getByRole('radio', { name: '6/8' }));
    expect(mirror).toBeDisabled();
    expect(mirror).toHaveAttribute('aria-pressed', 'false');
  });

  it('says where the ternary swing has nothing to move, and only there', async () => {
    shown();
    const hint = /no pulse of three eighths/;
    expect(screen.getByText(hint)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('radio', { name: '6/8' }));
    expect(screen.queryByText(hint)).toBeNull();
  });

  it('switches layers on and off, and offers the hemiola only where a meter has one', async () => {
    const { player } = shown();
    const drums = screen.getByRole('button', { name: 'Drums' });
    expect(drums).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(drums);
    expect(player.layers.drums).toBe(true);
    const hemiola = screen.getByRole('button', { name: 'Hemiola' });
    expect(hemiola).toBeDisabled();
    await fireEvent.click(screen.getByRole('radio', { name: '6/8' }));
    expect(hemiola).toBeEnabled();
    expect(screen.getByText(/bass on 3\/4's pulses, 2\+2\+2/)).toBeInTheDocument();
    await fireEvent.click(hemiola);
    expect(player.hemiola).toBe(true);
    expect(hemiola).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('radio', { name: '4/4' }));
    expect(hemiola).toHaveAttribute('aria-pressed', 'false');
  });

  it('plays and stops, and lights the eighth heard, counted by pulse', async () => {
    const { player, run, rendered } = shown();
    await fireEvent.click(screen.getByRole('radio', { name: '6/8' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(player.playing).toBe(true);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    run(LEAD_SECONDS * 1000 + 1500);
    await Promise.resolve();
    player.follow();
    await vi.waitFor(() =>
      expect(rendered.container.querySelectorAll('svg.ruler circle.lit').length).toBe(1),
    );
    expect(screen.getByText(/^6\/8 · pulse \d of 2$/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(player.playing).toBe(false);
    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('goes back to the lobby', async () => {
    const { onback } = shown();
    await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
    expect(onback).toHaveBeenCalledOnce();
  });
});
