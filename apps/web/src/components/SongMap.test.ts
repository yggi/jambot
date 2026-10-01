import { METERS } from '@jambot/theory';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import SongMap from './SongMap.svelte';
import type { BarView, SectionView } from '../hud.ts';

const section = (index: number, over: Partial<SectionView> = {}): SectionView => {
  const name = over.section ?? 'Groove';
  const key = over.key ?? 'A aeolian';
  const bars: BarView[] = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    bar: index * 8 + i,
    barInSection: i,
    section: name,
    key,
    tonic: 9,
    scale: [0, 2, 4, 5, 7, 9, 11],
    melodic: [0, 2, 4, 5, 7, 9, 11],
    melodicName: 'plain',
    meter: METERS['4/4'],
    meterName: '4/4',
    chords: [{ step: 0, symbol: ['Am', 'F', 'C', 'G'][i % 4]!, numeral: 'i' }],
    energy: i / 7,
    lead: 'improvising' as const,
    motif: null,
  }));
  return {
    index,
    section: name,
    meterName: '4/4',
    newMeter: false,
    key,
    newKey: false,
    bars,
    ...over,
  };
};

const five = () => [1, 2, 3, 4, 5].map((i) => section(i));
const blocks = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('.sec')];
const labels = (block: Element) =>
  [...block.querySelectorAll('.bar')].map((b) => b.textContent?.trim());

describe('the song map', () => {
  it('lays the section heard and the next in a row, large, and the three after in another, smaller', () => {
    render(SongMap, { sections: five(), bar: 10 });
    const near = within(screen.getByRole('list', { name: 'The section playing and the next' }));
    const far = within(screen.getByRole('list', { name: 'The sections after' }));
    expect(near.getAllByRole('listitem')).toHaveLength(2);
    expect(far.getAllByRole('listitem')).toHaveLength(3);
    const [first, second, ...rest] = blocks(document.body);
    expect(first).toHaveClass('large');
    expect(second).toHaveClass('large');
    for (const block of rest) expect(block).toHaveClass('small');
  });

  it('shows what the bars reach: no second row for two sections, none for one', () => {
    const two = render(SongMap, { sections: [section(1), section(2)], bar: 10 });
    expect(two.container.querySelectorAll('.sec')).toHaveLength(2);
    expect(screen.queryByRole('list', { name: 'The sections after' })).toBeNull();
    two.unmount();
    const one = render(SongMap, { sections: [section(1)], bar: 10 });
    expect(one.container.querySelectorAll('.sec')).toHaveLength(1);
    one.unmount();
    const none = render(SongMap, { sections: [], bar: null });
    expect(none.container.querySelectorAll('.sec')).toHaveLength(0);
  });

  it('names every bar’s chord in a large block, and the first and the last only in a small one', () => {
    const { container } = render(SongMap, { sections: five(), bar: 10 });
    const [first, second, third] = blocks(container);
    expect(labels(first!)).toEqual(['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G']);
    expect(labels(second!)).toEqual(['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G']);
    expect(labels(third!)).toEqual(['Am', '', '', '', '', '', '', 'G']);
  });

  it('names both chords of a bar that has two, one above the other', () => {
    const now = section(1);
    const two = {
      ...now,
      bars: now.bars.map((b, i) =>
        i === 2
          ? {
              ...b,
              chords: [
                { step: 0, symbol: 'Dm', numeral: 'iv' },
                { step: 8, symbol: 'E7', numeral: 'V7' },
              ],
            }
          : b,
      ),
    };
    const { container } = render(SongMap, { sections: [two, section(2)], bar: 10 });
    const bar = blocks(container)[0]!.querySelectorAll('.bar')[2]!;
    expect([...bar.querySelectorAll('b')].map((b) => b.textContent)).toEqual(['Dm', 'E7']);
  });

  it('names each block by its section, and its key where that changes', () => {
    const { container } = render(SongMap, {
      sections: [
        section(1),
        section(2, { section: 'Drop' }),
        section(3, { key: 'D dorian', newKey: true }),
      ],
      bar: 10,
    });
    expect(blocks(container).map((b) => b.querySelector('.name')?.textContent)).toEqual([
      'Groove',
      'Drop',
      'Groove, D dorian',
    ]);
  });

  it('highlights the section playing, fills its past bars and rings the bar heard', () => {
    const { container } = render(SongMap, { sections: five(), bar: 10 });
    const [now, ...later] = blocks(container);
    expect(now).toHaveClass('now');
    for (const s of later) expect(s).not.toHaveClass('now');
    const bars = [...now!.querySelectorAll('.bars i')];
    expect(bars.map((i) => i.className.includes('past'))).toEqual([
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(bars.map((i) => i.className.includes('cur'))).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('rings no bar before anything is heard', () => {
    const { container } = render(SongMap, { sections: five(), bar: null });
    expect(container.querySelectorAll('.bars i.past, .bars i.cur')).toHaveLength(0);
  });

  it('draws each bar as tall as its energy', () => {
    const { container } = render(SongMap, { sections: five(), bar: 10 });
    const heights = [...blocks(container)[0]!.querySelectorAll<HTMLElement>('.bars i')].map(
      (i) => i.style.height,
    );
    expect(heights[0]).toBe('8%');
    expect(heights[7]).toBe('100%');
  });

  it('marks each bar the lead plays a motif in, in its player’s colour, the bars ahead only outlined', () => {
    const ada = { source: '@c1/keys', name: 'Ada’s keys', colour: 3, bar: 9 };
    const now = section(1);
    const credited = {
      ...now,
      bars: now.bars.map((b) => (b.bar >= 11 ? { ...b, lead: 'motif' as const, motif: ada } : b)),
    };
    const { container } = render(SongMap, { sections: [credited, section(2)], bar: 12 });
    const marks = [...container.querySelectorAll<HTMLElement>('.credits i.credited')];
    expect(marks).toHaveLength(5);
    expect(marks.map((m) => m.style.getPropertyValue('--colour'))).toEqual(
      Array(5).fill('var(--source-3)'),
    );
    expect(marks.map((m) => m.classList.contains('ahead'))).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it('marks no bar where the lead plays no motif, or rests though one stands', () => {
    const ada = { source: '@c1/keys', name: 'Ada’s keys', colour: 3, bar: 9 };
    const now = section(1);
    const resting = {
      ...now,
      bars: now.bars.map((b) => ({ ...b, lead: 'resting' as const, motif: ada })),
    };
    const { container } = render(SongMap, { sections: [resting], bar: 12 });
    expect(container.querySelector('.credits i.credited')).toBeNull();
  });
});
