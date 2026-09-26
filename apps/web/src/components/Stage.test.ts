import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Stage from './Stage.svelte';
import type { BarView, Hud } from '../hud.ts';

const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
  section: 'Groove',
  key: 'A aeolian',
  chords: [{ step: 0, symbol: 'Am7', numeral: 'i7' }],
  energy: 0.6,
  ...over,
});
const style = { preset: 'Synth-pop', glide: null };
const groove = bar(9);
const heard: Hud = {
  bar: groove,
  beat: 2,
  chord: groove.chords[0]!,
  next: [bar(10), bar(11), bar(12), bar(13)],
  style,
};
const opening = bar(0, { section: 'Intro', chords: [{ step: 0, symbol: 'Am', numeral: 'i' }] });
const idle: Hud = {
  bar: opening,
  beat: null,
  chord: opening.chords[0]!,
  next: [bar(1), bar(2), bar(3), bar(4)],
  style,
};

describe('the stage', () => {
  it('is ready while stopped, and shows the bar the band opens on, its key and chord', () => {
    render(Stage, { hud: idle, playing: false });
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Opens on')).toBeInTheDocument();
    expect(screen.getByText('A aeolian')).toBeInTheDocument();
    expect(screen.getByText('Am')).toHaveClass('symbol');
    expect(screen.getByText('i')).toHaveClass('numeral');
  });

  it('waits while the band starts', () => {
    render(Stage, { hud: idle, playing: true });
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows the section, the bar in it, the key and the chord heard with its numeral, and the beats up to the one heard', () => {
    const { container } = render(Stage, { hud: heard, playing: true });
    expect(screen.getByText('Groove')).toBeInTheDocument();
    expect(screen.getByText('Bar 2 of 8')).toBeInTheDocument();
    expect(screen.getByText('A aeolian')).toBeInTheDocument();
    const chord = screen.getByRole('group', { name: 'Chord' });
    expect(within(chord).getByText('Am7')).toBeInTheDocument();
    expect(within(chord).getByText('i7')).toBeInTheDocument();
    expect(container.querySelectorAll('.beats i.on')).toHaveLength(3);
  });

  it('shows the next four bars', () => {
    render(Stage, { hud: heard, playing: true });
    expect(screen.getByText('Next four bars')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(4);
  });
});
