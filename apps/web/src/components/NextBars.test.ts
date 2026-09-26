import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import NextBars from './NextBars.svelte';
import type { BarView } from '../hud.ts';

const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  section: 'Groove',
  key: 'A aeolian',
  chords: [{ step: 0, symbol: 'Am', numeral: 'i' }],
  energy: 0.5,
  lead: 'improvising',
  ...over,
});

describe('the next four bars', () => {
  it('show each bar’s chords as symbols over numerals', () => {
    const two = [
      { step: 0, symbol: 'Dm', numeral: 'iv' },
      { step: 8, symbol: 'E7', numeral: 'V7' },
    ];
    render(NextBars, { before: bar(4), bars: [bar(5), bar(6, { chords: two })] });
    const [first, second] = screen.getAllByRole('listitem');
    expect(within(first!).getByText('Am')).toBeInTheDocument();
    expect(within(first!).getByText('i')).toBeInTheDocument();
    expect(first).not.toHaveClass('two');
    expect(within(second!).getByText('Dm E7')).toBeInTheDocument();
    expect(within(second!).getByText('iv V7')).toBeInTheDocument();
    expect(second).toHaveClass('two');
  });

  it('cue where the section or the key changes, and nowhere else', () => {
    render(NextBars, {
      before: bar(6),
      bars: [
        bar(7),
        bar(8, { section: 'Drop' }),
        bar(9, { section: 'Drop', key: 'D dorian' }),
        bar(16, { section: 'Bridge', key: 'C ionian' }),
      ],
    });
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.classList.contains('cue'))).toEqual([false, true, true, true]);
    expect(within(items[1]!).getByText('Drop')).toBeInTheDocument();
    expect(within(items[2]!).getByText('D dorian')).toBeInTheDocument();
    expect(within(items[3]!).getByText('Bridge, C ionian')).toBeInTheDocument();
  });
});
