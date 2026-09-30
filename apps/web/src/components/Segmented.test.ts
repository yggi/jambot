import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Segmented from './Segmented.svelte';

const options = [
  { value: 'a', text: 'A' },
  { value: 'b', text: 'b', name: 'the second', disabled: true },
  { value: 'c', text: 'C' },
];

describe('a segmented choice', () => {
  it('is a radio group with exactly one segment checked, and a name for a short text', () => {
    render(Segmented, { label: 'Pick', options, value: 'c', onselect: () => {} });
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(screen.getByRole('radiogroup', { name: 'Pick' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'the second' })).toHaveAttribute(
      'title',
      'the second',
    );
  });

  it('selects the segment pressed, and dims the ones that are not offered', async () => {
    const onselect = vi.fn();
    render(Segmented, { label: 'Pick', options, value: 'a', onselect });
    await fireEvent.click(screen.getByRole('radio', { name: 'C' }));
    expect(onselect.mock.calls).toEqual([['c']]);
    expect(screen.getByRole('radio', { name: 'the second' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'C' })).toBeEnabled();
  });

  it('rests every segment when disabled', () => {
    render(Segmented, { label: 'Pick', options, value: 'a', disabled: true, onselect: () => {} });
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  describe('in rows', () => {
    const eight = Array.from({ length: 8 }, (_, i) => ({ value: `v${i}`, text: `Option ${i}` }));
    const cells = () => screen.getAllByRole('radio');
    const corners = (cell: HTMLElement) =>
      ['tl', 'tr', 'bl', 'br'].filter((corner) => cell.classList.contains(corner));

    it('lays the options out in the columns given, and is still one radio group', () => {
      render(Segmented, {
        label: 'Pick',
        options: eight,
        value: 'v0',
        columns: 4,
        onselect: () => {},
      });
      expect(screen.getByRole('radiogroup', { name: 'Pick' }).getAttribute('style')).toContain(
        'repeat(4, 1fr)',
      );
      expect(cells()).toHaveLength(8);
      expect(cells().map((r) => r.getAttribute('aria-checked'))[0]).toBe('true');
    });

    it('gives the four corner cells the outline’s curve, and no other cell', () => {
      render(Segmented, {
        label: 'Pick',
        options: eight,
        value: 'v0',
        columns: 4,
        onselect: () => {},
      });
      expect(cells().map(corners)).toEqual([['tl'], [], [], ['tr'], ['bl'], [], [], ['br']]);
    });

    it('lets the last cell take the rest of a row that is not full, so no gap shows', () => {
      const seven = eight.slice(0, 7);
      render(Segmented, {
        label: 'Pick',
        options: seven,
        value: 'v0',
        columns: 3,
        onselect: () => {},
      });
      const last = cells().at(-1)!;
      expect(last.getAttribute('style')).toContain('span 3');
      expect(corners(last)).toEqual(['bl', 'br']);
      expect(
        cells()
          .slice(0, -1)
          .map((c) => c.getAttribute('style')),
      ).not.toContain(expect.stringContaining('span'));
    });

    it('keeps the ends of one row, when the options fit in it', () => {
      render(Segmented, {
        label: 'Pick',
        options: eight.slice(0, 3),
        value: 'v0',
        columns: 4,
        onselect: () => {},
      });
      expect(cells().map(corners)).toEqual([['tl', 'bl'], [], ['tr', 'br']]);
    });

    it('is one row of joined segments without columns, with no corner cells', () => {
      render(Segmented, { label: 'Pick', options: eight, value: 'v0', onselect: () => {} });
      expect(cells().map(corners)).toEqual(eight.map(() => []));
    });

    it('selects the cell pressed, as a row does', async () => {
      const onselect = vi.fn();
      render(Segmented, { label: 'Pick', options: eight, value: 'v0', columns: 4, onselect });
      await fireEvent.click(cells()[6]!);
      expect(onselect.mock.calls).toEqual([['v6']]);
    });
  });
});
