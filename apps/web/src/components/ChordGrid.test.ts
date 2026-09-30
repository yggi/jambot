import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ChordGrid from './ChordGrid.svelte';
import type { BarView } from '../hud.ts';

const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  section: 'Groove',
  key: 'A aeolian',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  melodic: [0, 2, 4, 5, 7, 9, 11],
  melodicName: 'plain',
  chords: [{ step: 0, symbol: 'Am', numeral: 'i' }],
  energy: 0.5,
  lead: 'improvising',
  motif: null,
  ...over,
});

const after = (n: number, count: number) => Array.from({ length: count }, (_, i) => bar(n + 1 + i));
const tiles = () => screen.getAllByRole('listitem');

describe('the chord grid', () => {
  it('is the bar heard and the next large, then two rows of three, eight bars in all', () => {
    render(ChordGrid, { heard: bar(9), next: after(9, 7) });
    expect(tiles()).toHaveLength(8);
    expect(tiles().map((t) => t.classList.contains('large'))).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(screen.getByRole('list', { name: 'The bar heard and the next' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'The bars after' })).toBeInTheDocument();
  });

  it('shows as many bars as are decided, and none before there is a bar', () => {
    const few = render(ChordGrid, { heard: bar(9), next: after(9, 2) });
    expect(tiles()).toHaveLength(3);
    few.unmount();
    const one = render(ChordGrid, { heard: bar(9), next: [] });
    expect(tiles()).toHaveLength(1);
    expect(screen.queryByRole('list', { name: 'The bars after' })).toBeNull();
    one.unmount();
    render(ChordGrid, { heard: null, next: after(9, 2) });
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('shows each bar’s chords as symbols over numerals', () => {
    const two = [
      { step: 0, symbol: 'Dm', numeral: 'iv' },
      { step: 8, symbol: 'E7', numeral: 'V7' },
    ];
    render(ChordGrid, { heard: bar(4), next: [bar(5, { chords: two })] });
    const [first, second] = tiles();
    expect(within(first!).getByText('Am')).toBeInTheDocument();
    expect(within(first!).getByText('i')).toBeInTheDocument();
    expect(within(second!).getByText('Dm E7')).toBeInTheDocument();
    expect(within(second!).getByText('iv V7')).toBeInTheDocument();
  });

  it('labels the bar where a section or a key changes, and nowhere else', () => {
    render(ChordGrid, {
      heard: bar(6),
      next: [
        bar(7),
        bar(8, { section: 'Drop' }),
        bar(9, { section: 'Drop', key: 'D dorian' }),
        bar(16, { section: 'Bridge', key: 'C ionian' }),
      ],
    });
    const items = tiles();
    expect(items.map((li) => li.classList.contains('cue'))).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);
    expect(within(items[2]!).getByText('Drop')).toBeInTheDocument();
    expect(within(items[3]!).getByText('D dorian')).toBeInTheDocument();
    expect(within(items[4]!).getByText('Bridge, C ionian')).toBeInTheDocument();
  });

  it('labels the small tiles too, where the plan changes in them', () => {
    render(ChordGrid, {
      heard: bar(1),
      next: [...after(1, 4), bar(6, { section: 'Bridge' }), bar(7, { section: 'Bridge' })],
    });
    const items = tiles();
    expect(items[5]!.classList.contains('large')).toBe(false);
    expect(within(items[5]!).getByText('Bridge')).toBeInTheDocument();
  });

  it('marks each bar the lead is to play a motif in, outlined in its player’s colour, as the offer standing now', () => {
    const ada = { source: '@c1/keys', name: 'Ada’s keys', colour: 4, bar: 3 };
    render(ChordGrid, {
      heard: bar(4),
      next: [
        bar(5, { lead: 'motif', motif: ada }),
        bar(6),
        bar(7, { lead: 'resting', motif: ada }),
      ],
    });
    const [, second, third, fourth] = tiles();
    const mark = within(second!).getByRole('img', {
      name: 'Motif from Ada’s keys, heard in bar 4',
    });
    expect(mark.style.getPropertyValue('--colour')).toBe('var(--source-4)');
    expect(within(third!).queryByRole('img')).toBeNull();
    expect(within(fourth!).queryByRole('img')).toBeNull();
  });

  it('lights the beats of the bar heard, up to the beat heard, and of no other', () => {
    const { container } = render(ChordGrid, { heard: bar(4), next: after(4, 2), beat: 1 });
    const beats = [...container.querySelectorAll('li')[0]!.querySelectorAll('.beats i')];
    expect(beats.map((b) => b.classList.contains('on'))).toEqual([true, true, false, false]);
    expect(container.querySelectorAll('li')[1]!.querySelectorAll('.beats i')).toHaveLength(0);
  });

  it('lights no beat before anything is heard', () => {
    const { container } = render(ChordGrid, { heard: bar(4), next: [], beat: null });
    expect(container.querySelectorAll('.beats i.on')).toHaveLength(0);
  });
});
