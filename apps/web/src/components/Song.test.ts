import { METERS } from '@jambot/theory';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { BarView, ChordView, Hud, SectionView } from '../hud.ts';
import Song from './Song.svelte';

const chord = (symbol: string, step = 0, numeral = 'i'): ChordView => ({ step, symbol, numeral });
const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  section: n < 8 ? 'Intro' : 'Groove',
  key: 'A minor',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  melodic: [0, 2, 4, 5, 7, 9, 11],
  melodicName: 'plain',
  meter: METERS['4/4'],
  meterName: '4/4',
  chords: [chord(['Am', 'F', 'G', 'E7'][n % 4]!, 0, ['i', 'VI', 'VII', 'V7'][n % 4]!)],
  energy: 0.5,
  lead: 'improvising',
  motif: null,
  ...over,
});
const section = (index: number, over: Partial<SectionView> = {}): SectionView => ({
  index,
  section: index === 0 ? 'Intro' : 'Groove',
  key: 'A minor',
  newKey: false,
  meterName: '4/4',
  newMeter: false,
  bars: Array.from({ length: 8 }, (_, i) => bar(index * 8 + i)),
  ...over,
});

type View = Pick<Hud, 'bar' | 'beat' | 'chord' | 'next' | 'sections' | 'heading'>;
const hud = (heard: number | null, beat: number | null = 1): View => {
  const here = bar(heard ?? 0);
  return {
    bar: here,
    beat: heard === null ? null : beat,
    chord: heard === null ? null : here.chords[0]!,
    next: [bar((heard ?? 0) + 1)],
    sections: [section(Math.floor((heard ?? 0) / 8)), section(1), section(2)],
    heading: null,
  };
};

describe('the song view', () => {
  it('shows the chord sounding, large, with its numeral, and the next with the beats until it', () => {
    const { container } = render(Song, { hud: hud(2) });
    expect(container.querySelector('.now')).toHaveTextContent('G VII');
    expect(container.querySelector('.next')).toHaveTextContent('next E7');
    expect(container.querySelector('.in')).toHaveAttribute('aria-label', 'in 3');
    expect(container.querySelectorAll('.in i.left')).toHaveLength(3);
  });

  it('lays the section heard out bar by bar: those played, the one heard, those ahead', () => {
    const { container } = render(Song, { hud: hud(2) });
    const bars = within(screen.getByRole('list', { name: 'This section, bar by bar' }));
    expect(bars.getAllByRole('listitem')).toHaveLength(8);
    expect(container.querySelectorAll('.bars .played')).toHaveLength(2);
    expect(container.querySelector('.bars .heard')).toHaveTextContent('G');
    expect(container.querySelectorAll('.bars .ahead')).toHaveLength(5);
  });

  it('says the notes over the bar heard, and the sections after it', () => {
    render(Song, { hud: hud(2) });
    expect(screen.getByText('A B C D E F G')).toBeInTheDocument();
    expect(screen.getAllByRole('list', { name: 'Groove, bar by bar' })).toHaveLength(2);
  });

  it('shows what the band opens on, dimmed, before anything is heard', () => {
    const { container } = render(Song, { hud: hud(null) });
    expect(container.querySelector('.big')).toHaveClass('waiting');
    expect(container.querySelector('.now')).toHaveTextContent('Am');
    expect(container.querySelectorAll('.bars .ahead')).toHaveLength(8);
  });

  it('rings a bar that plays a person’s motif in their colour', () => {
    const view = hud(9);
    const own = section(1, {
      bars: section(1).bars.map((b, i) =>
        i === 3 ? { ...b, motif: { source: 'p1', bar: 9, name: 'Ada', colour: 2 } } : b,
      ),
    });
    const { container } = render(Song, { hud: { ...view, sections: [own] } });
    const ringed = container.querySelectorAll('.bars .motif');
    expect(ringed).toHaveLength(1);
    expect((ringed[0] as HTMLElement).style.getPropertyValue('--motif')).toBe('var(--source-2)');
  });
});
