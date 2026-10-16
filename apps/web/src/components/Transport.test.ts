import { METERS } from '@jambot/theory';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Transport from './Transport.svelte';

type Props = ComponentProps<typeof Transport>;

const props = (more: Partial<Props> = {}): Props => ({
  main: 'Groove 3/8',
  sub: '108 BPM · 4/4 · A minor',
  meter: METERS['4/4'],
  step: null,
  phase: null,
  playing: false,
  ontoggle: () => {},
  ...more,
});

describe('the transport', () => {
  it('starts the band, and stops it while it plays', async () => {
    const ontoggle = vi.fn();
    const { rerender } = render(Transport, props({ ontoggle }));
    await fireEvent.click(screen.getByRole('button', { name: 'Start the band' }));
    await rerender({ playing: true });
    await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(ontoggle).toHaveBeenCalledTimes(2);
  });

  it('says what a second Stop does while the band ends', () => {
    render(Transport, props({ playing: true, phase: 'ending' }));
    expect(screen.getByRole('button', { name: 'Stop' })).toHaveAttribute(
      'title',
      'Stop again to stop now',
    );
  });

  it('rests for a client, which follows its host’s band, and says so', () => {
    render(Transport, props({ following: true }));
    const button = screen.getByRole('button', { name: 'Start the band' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'The host starts and stops the band');
  });

  it('says its two lines, in the transport region', () => {
    render(Transport, props());
    const region = screen.getByRole('region', { name: 'Transport' });
    expect(region).toHaveTextContent('Groove 3/8');
    expect(region).toHaveTextContent('108 BPM · 4/4 · A minor');
  });

  it('draws a cell per pulse, as wide as the pulse, and lights the one heard and its eighths', () => {
    const { container } = render(Transport, props({ meter: METERS['7/8'], step: 6 }));
    const cells = container.querySelectorAll('.cell');
    expect(cells).toHaveLength(3);
    expect((container.querySelector('.cells') as HTMLElement).style.gridTemplateColumns).toBe(
      '3fr 2fr 2fr',
    );
    expect([...cells].map((c) => c.classList.contains('on'))).toEqual([false, true, false]);
    expect(cells[1]!.querySelectorAll('i.on')).toHaveLength(1);
  });

  it('hatches the beats still to come in the count-in', () => {
    const { container } = render(Transport, props({ phase: 'counting', playing: true, step: 4 }));
    const cells = [...container.querySelectorAll('.cell')];
    expect(cells.map((c) => c.classList.contains('ahead'))).toEqual([false, false, true, true]);
  });

  it('lights nothing while nothing is heard', () => {
    const { container } = render(Transport, props());
    expect(container.querySelectorAll('.cell.on, .cell.ahead, i.on')).toHaveLength(0);
  });

  it('has a loop toggle that holds its own state, wired to nothing yet', async () => {
    render(Transport, props());
    const loop = screen.getByRole('button', { name: /loop/ });
    expect(loop).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(loop);
    expect(loop).toHaveAttribute('aria-pressed', 'true');
  });
});
