import { DRUMMER, EMPTY_LAYER, type LearnedLayer } from '@jambot/engine';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Cells from './Cells.svelte';
import type { BarView } from '../hud.ts';

/** A bar heard, as much of it as the card reads. */
const bar = (sectionIndex: number, fragments: Partial<BarView['fragments']> = {}): BarView =>
  ({
    bar: sectionIndex * 8,
    sectionIndex,
    section: 'Groove',
    fragments: { meter: '4/4', rhythm: 'Funk drums', clave: null, ...fragments },
  }) as BarView;

const layer: LearnedLayer = {
  ...EMPTY_LAYER,
  filed: [
    {
      fragment: {
        id: 'drummer song 1, bar 8',
        text: '&kick step=16n &bd ~ ~ ~',
        association: [{ point: { sync: 0.25, harm: 0.5 }, weight: 0.1, facet: 'rhythm' }],
      },
      meta: { source: DRUMMER, created: 'song 1, bar 8', tags: ['groove', 'Garage'] },
      prose: '',
    },
  ],
};

const props = (over: Partial<Parameters<typeof render<typeof Cells>>[1]> = {}) => ({
  bar: null,
  layer: null,
  memory: [],
  players: {},
  ...over,
});

const names = () =>
  within(screen.getByRole('table', { name: 'Fragments' }))
    .getAllByRole('button')
    .map((b) => b.textContent?.trim());

describe('the cells card', () => {
  it('says there is nothing yet, before the band has met any fragment', () => {
    const { container } = render(Cells, props());
    expect(container.querySelector('summary .main')).toHaveTextContent('None yet');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('logs each section heard, once, and counts the sections that took each fragment', async () => {
    const card = render(Cells, props({ bar: bar(0) }));
    await card.rerender(props({ bar: { ...bar(0), bar: 1 } }));
    await card.rerender(props({ bar: bar(1, { rhythm: 'Techno drums' }) }));
    expect(names()).toEqual(['4/4', 'Techno drums', 'Funk drums']);
    const row = (name: string) => screen.getByRole('button', { name }).closest('tr')!;
    expect(row('4/4')).toHaveTextContent('§1');
    expect(within(row('4/4')).getAllByRole('cell')[4]).toHaveTextContent('2');
    expect(within(row('Funk drums')).getAllByRole('cell')[4]).toHaveTextContent('1');
    expect(row('Techno drums')).toHaveTextContent('playing');
    expect(card.container.querySelector('summary .sub')).toHaveTextContent(
      '0 filed · 3 retrieved · 0 from the Muse',
    );
  });

  it('filters the table by where a fragment has been', async () => {
    render(Cells, props({ bar: bar(0), layer }));
    expect(names()).toEqual(['4/4', 'Funk drums', 'drummer song 1, bar 8']);
    await fireEvent.click(screen.getByRole('radio', { name: 'Filed' }));
    expect(names()).toEqual(['drummer song 1, bar 8']);
    await fireEvent.click(screen.getByRole('radio', { name: 'Muse' }));
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('None of these yet.')).toBeInTheDocument();
  });

  it('opens a row picked: its text, its point, its tags; a second pick closes it', async () => {
    render(Cells, props({ layer }));
    const name = screen.getByRole('button', { name: 'drummer song 1, bar 8' });
    await fireEvent.click(name);
    expect(name).toHaveAttribute('aria-expanded', 'true');
    const detail = screen.getByRole('region', { name: 'drummer song 1, bar 8' });
    expect(detail).toHaveTextContent('&kick step=16n &bd ~ ~ ~');
    expect(within(detail).getByLabelText('Found at')).toHaveTextContent('sync 0.25');
    expect(within(detail).getByLabelText('Tags')).toHaveTextContent('groove');
    await fireEvent.click(name);
    expect(screen.queryByRole('region', { name: 'drummer song 1, bar 8' })).toBeNull();
  });

  describe('carrying what the band learned (#398)', () => {
    const carry = (more = {}) => ({
      playing: false,
      onexport: () => {},
      onexportfiles: () => {},
      onimport: () => null,
      ...more,
    });

    it('exports the layer, and its fragments only where it filed some', async () => {
      const onexport = vi.fn();
      const onexportfiles = vi.fn();
      const { rerender } = render(
        Cells,
        props({ layer: EMPTY_LAYER, carry: carry({ onexport, onexportfiles }) }),
      );
      await fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      expect(onexport).toHaveBeenCalledOnce();
      expect(screen.queryByRole('button', { name: /Export fragments/ })).toBeNull();
      await rerender(props({ layer, carry: carry({ onexport, onexportfiles }) }));
      await fireEvent.click(screen.getByRole('button', { name: 'Export fragments (1)' }));
      expect(onexportfiles).toHaveBeenCalledOnce();
    });

    it('imports a file while the band is stopped, and says how it went', async () => {
      const onimport = vi.fn(() => null);
      render(Cells, props({ layer: EMPTY_LAYER, carry: carry({ onimport }) }));
      const input = screen.getByLabelText('Import') as HTMLInputElement;
      const file = new File(['{"format":"jambot-learned-layer"}'], 'layer.json');
      await fireEvent.change(input, { target: { files: [file] } });
      await vi.waitFor(() =>
        expect(onimport).toHaveBeenCalledWith('{"format":"jambot-learned-layer"}'),
      );
      await vi.waitFor(() => expect(screen.getByText(/Imported/)).toBeInTheDocument());
    });

    it('waits for the band to stop to import, and a client carries none', async () => {
      const { rerender } = render(
        Cells,
        props({ layer: EMPTY_LAYER, carry: carry({ playing: true }) }),
      );
      expect(screen.getByLabelText('Import')).toBeDisabled();
      expect(screen.getByText(/Stop the band to import/)).toBeInTheDocument();
      await rerender(props({ layer: null, carry: null }));
      expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
    });
  });
});
