import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Muse from './Muse.svelte';
import type { MuseView } from '../hud.ts';

const empty: MuseView = { motif: null, log: [], memory: [], quiet: null };
const offered: MuseView = {
  motif: {
    source: 'the computer keys',
    name: 'the computer keys',
    colour: 2,
    bar: 5,
    rows: 4,
    cycle: 16,
    pulses: [0, 4, 8, 12],
    notes: [
      { step: 0, length: 4, row: 1, altered: false },
      { step: 4, length: 2, row: 3, altered: true },
      { step: 8, length: 8, row: 0, altered: false },
    ],
  },
  log: [
    { bar: 5, text: 'Took a 3-note motif from the computer keys.', taken: true },
    { bar: 4, text: 'Heard 2 notes. A motif needs at least 3.', taken: false },
  ],
  memory: [],
  quiet: null,
};

describe('the Muse card', () => {
  const summary = (container: HTMLElement) => ({
    title: container.querySelector('summary .title')?.textContent,
    main: container.querySelector('summary .main')?.textContent,
    sub: container.querySelector('summary .sub')?.textContent,
  });

  it('is listening while it holds no motif, and says how to give it one', () => {
    const { container } = render(Muse, { muse: empty, pulse: 0, onforget: () => {} });
    expect(summary(container)).toEqual({
      title: 'Muse',
      main: 'Listening',
      sub: 'Play 3 to 12 notes in one bar',
    });
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('has taken a motif once it holds one, and says whose and in which bar, counted from 1', () => {
    const { container } = render(Muse, { muse: offered, pulse: 0, onforget: () => {} });
    expect(summary(container)).toEqual({
      title: 'Muse',
      main: 'Took a motif',
      sub: 'from the computer keys · bar 6',
    });
  });

  it('holds the motif in its ring, and pings for each note played', () => {
    const { container } = render(Muse, { muse: offered, pulse: 3, onforget: () => {} });
    expect(container.querySelectorAll('summary svg.glyph rect.note')).toHaveLength(3);
    expect(container.querySelector('summary svg.glyph circle.ping')).not.toBeNull();
  });

  it('has no prose in its details: no help, no status sentence', () => {
    const { container } = render(Muse, { muse: offered, pulse: 0, onforget: () => {} });
    expect(container.querySelector('details p')).toBeNull();
    render(Muse, { muse: empty, pulse: 0, onforget: () => {} });
    expect(screen.queryByText(/Play a few notes within a bar/)).toBeNull();
  });

  it('offers nothing to forget nor draws anything while it holds no motif', () => {
    render(Muse, { muse: empty, pulse: 0, onforget: () => {} });
    expect(screen.getByLabelText('Muse')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Forget motif' })).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.queryByRole('list', { name: 'Muse memory' })).toBeNull();
  });

  it('draws the motif on offer, one mark a note in its player’s colour, and forgets it when asked', async () => {
    const onforget = vi.fn();
    const { container } = render(Muse, { muse: offered, pulse: 0, onforget });
    expect(screen.getByRole('img', { name: 'Motif of 3 notes' })).toBeInTheDocument();
    expect(container.querySelectorAll('.offer svg rect.note')).toHaveLength(3);
    expect(container.querySelectorAll('.offer svg rect.altered')).toHaveLength(1);
    const plain = [...container.querySelectorAll<SVGElement>('.offer svg rect.note:not(.altered)')];
    expect(plain.map((r) => r.style.fill)).toEqual(['var(--source-2)', 'var(--source-2)']);
    await fireEvent.click(screen.getByRole('button', { name: 'Forget motif' }));
    expect(onforget).toHaveBeenCalledOnce();
  });

  it('counts the bars of quiet against the bars it waits, as a meter that spends its steps', () => {
    const { container } = render(Muse, {
      muse: { ...offered, quiet: { bars: 5, of: 16 } },
      pulse: 0,
      onforget: () => {},
    });
    const meter = screen.getByRole('meter', { name: 'Quiet bars' });
    expect(meter).toHaveAttribute('aria-valuenow', '5');
    expect(meter).toHaveAttribute('aria-valuemax', '16');
    expect(container.querySelectorAll('.patience span')).toHaveLength(16);
    expect(container.querySelectorAll('.patience span.spent')).toHaveLength(5);
  });

  it('says in the summary how many it remembers while it holds no motif', () => {
    const { container } = render(Muse, {
      muse: {
        ...empty,
        memory: [
          {
            rows: 1,
            cycle: 16,
            pulses: [0, 4, 8, 12],
            notes: [],
            source: 's',
            name: 's',
            colour: 0,
            bar: 0,
            strength: 1,
            heard: 1,
            confirmed: false,
            offered: false,
          },
        ],
      },
      pulse: 0,
      onforget: () => {},
    });
    expect(container.querySelector('summary .sub')?.textContent).toBe('1 remembered');
  });

  it('lists the log the latest first, counting bars from 1, with what was taken marked', () => {
    render(Muse, { muse: offered, pulse: 0, onforget: () => {} });
    const items = within(screen.getByRole('list', { name: 'Muse log' })).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'Bar 6: Took a 3-note motif from the computer keys.',
      'Bar 5: Heard 2 notes. A motif needs at least 3.',
    ]);
    expect(items.map((i) => i.classList.contains('taken'))).toEqual([true, false]);
  });
});
