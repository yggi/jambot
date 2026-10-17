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
  swingLevel: '16n',
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
    const heard = screen.getByRole('region', { name: 'Intro, bar by bar' });
    expect(within(heard).getAllByRole('listitem')).toHaveLength(8);
    expect(heard.querySelectorAll('.played')).toHaveLength(2);
    expect(heard.querySelector('.heard')).toHaveTextContent('G');
    expect(heard.querySelectorAll('.ahead')).toHaveLength(5);
    expect(container.querySelectorAll('.heard')).toHaveLength(1);
  });

  it('shows the sections after it in the same form, a bar to a tile, all ahead', () => {
    render(Song, { hud: hud(2) });
    const later = screen.getAllByRole('region', { name: 'Groove, bar by bar' });
    expect(later).toHaveLength(2);
    for (const section of later) {
      expect(within(section).getAllByRole('listitem')).toHaveLength(8);
      expect(section.querySelectorAll('.ahead')).toHaveLength(8);
    }
  });

  it('lays a bar’s chords as wide as they last', () => {
    const view = hud(2);
    const split = section(0, {
      bars: section(0).bars.map((b, i) =>
        i === 2 ? { ...b, chords: [chord('Am', 0), chord('E7', 12, 'V7')] } : b,
      ),
    });
    const { container } = render(Song, { hud: { ...view, sections: [split] } });
    const chords = container.querySelectorAll<HTMLElement>('.heard .part');
    expect([...chords].map((c) => c.textContent?.trim().replace(/\s+/g, ' '))).toEqual([
      'Am i',
      'E7 V7',
    ]);
    expect([...chords].map((c) => c.style.flexGrow)).toEqual(['0.75', '0.25']);
  });

  it('says the notes over the bar heard', () => {
    render(Song, { hud: hud(2) });
    expect(screen.getByText('A B C D E F G')).toBeInTheDocument();
  });

  it('shows what the band opens on, dimmed, before anything is heard', () => {
    const { container } = render(Song, { hud: hud(null) });
    expect(container.querySelector('.big')).toHaveClass('waiting');
    expect(container.querySelector('.now')).toHaveTextContent('Am');
    expect(container.querySelectorAll('.bars .heard, .bars .played')).toHaveLength(0);
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
