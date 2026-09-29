import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import MusePanel from './MusePanel.svelte';
import type { MuseView } from '../hud.ts';

const empty: MuseView = { motif: null, log: [] };
const offered: MuseView = {
  motif: {
    source: 'the computer keys',
    name: 'the computer keys',
    colour: 2,
    bar: 5,
    rows: 4,
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
};

describe('the Muse panel', () => {
  it('says how to give it a motif while it has none, and offers nothing to forget', () => {
    render(MusePanel, { muse: empty, onforget: () => {} });
    expect(screen.getByRole('region', { name: 'Muse' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Play 3 to 12 notes within one bar. Jambot keeps the shape and plays it back in key from the bar after next.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Forget motif' })).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('draws the motif on offer, one mark a note in its player’s colour, says where it came from, and forgets it when asked', async () => {
    const onforget = vi.fn();
    const { container } = render(MusePanel, { muse: offered, onforget });
    expect(screen.getByRole('img', { name: 'Motif of 3 notes' })).toBeInTheDocument();
    expect(container.querySelectorAll('rect.note')).toHaveLength(3);
    expect(container.querySelectorAll('rect.altered')).toHaveLength(1);
    const plain = [...container.querySelectorAll<SVGElement>('rect.note:not(.altered)')];
    expect(plain.map((r) => r.style.fill)).toEqual(['var(--source-2)', 'var(--source-2)']);
    expect(screen.getByText('Motif from the computer keys, heard in bar 6.')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Forget motif' }));
    expect(onforget).toHaveBeenCalledOnce();
  });

  it('lists the log the latest first, counting bars from 1, with what was taken marked', () => {
    render(MusePanel, { muse: offered, onforget: () => {} });
    const items = within(screen.getByRole('list', { name: 'Muse log' })).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'Bar 6: Took a 3-note motif from the computer keys.',
      'Bar 5: Heard 2 notes. A motif needs at least 3.',
    ]);
    expect(items.map((i) => i.classList.contains('taken'))).toEqual([true, false]);
  });
});
