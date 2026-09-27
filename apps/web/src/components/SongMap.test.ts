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
    chords: [{ step: 0, symbol: ['Am', 'F', 'C', 'G'][i % 4]!, numeral: 'i' }],
    energy: i / 7,
    lead: 'improvising' as const,
    motif: null,
  }));
  return { index, section: name, key, newKey: false, bars, ...over };
};

describe('the song map', () => {
  it('shows four sections: each named, its bars as tall as their energy, and its chord loop', () => {
    const { container } = render(SongMap, {
      sections: [section(1), section(2, { section: 'Drop' }), section(3), section(4)],
      bar: 10,
    });
    const shown = screen.getAllByRole('listitem');
    expect(shown).toHaveLength(4);
    expect(within(shown[1]!).getByText('Drop')).toBeInTheDocument();
    expect(within(shown[0]!).getByText('Am F C G')).toBeInTheDocument();
    const heights = [...container.querySelectorAll<HTMLElement>('.bars i')]
      .slice(0, 8)
      .map((i) => i.style.height);
    expect(heights[0]).toBe('8%');
    expect(heights[7]).toBe('100%');
  });

  it('highlights the section playing, fills its past bars and rings the bar heard', () => {
    const { container } = render(SongMap, {
      sections: [section(1), section(2), section(3), section(4)],
      bar: 10,
    });
    const [now, ...later] = [...container.querySelectorAll('.sec')];
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
    const { container } = render(SongMap, {
      sections: [section(0), section(1), section(2), section(3)],
      bar: null,
    });
    expect(container.querySelectorAll('.bars i.past, .bars i.cur')).toHaveLength(0);
  });

  it('names a new key on the section where it comes', () => {
    render(SongMap, {
      sections: [section(1), section(2, { key: 'D dorian', newKey: true }), section(3), section(4)],
      bar: 8,
    });
    expect(screen.getByText('Groove, D dorian')).toBeInTheDocument();
  });
});
