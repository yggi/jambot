import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Stage from './Stage.svelte';
import type { BarView, Hud } from '../hud.ts';

const groove: BarView = {
  bar: 9,
  barInSection: 1,
  section: 'Groove',
  key: 'A aeolian',
  chords: [{ step: 0, symbol: 'Am7', numeral: 'i7' }],
  energy: 0.6,
};
const style = { preset: 'Synth-pop', glide: null };
const heard: Hud = { bar: groove, beat: 2, chord: groove.chords[0]!, next: [], style };
const ahead: Hud = { ...heard, beat: null };

describe('the stage', () => {
  it('is ready while stopped, and waits while the band starts', async () => {
    const { rerender } = render(Stage, { hud: ahead, playing: false });
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.queryByText('Am7')).toBeNull();
    await rerender({ hud: ahead, playing: true });
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows the section, the chord, the key and the bar heard, and the beats up to the one heard', () => {
    const { container } = render(Stage, { hud: heard, playing: true });
    expect(screen.getByText('Groove')).toBeInTheDocument();
    expect(screen.getByText('Am7')).toBeInTheDocument();
    expect(screen.getByText('A aeolian')).toBeInTheDocument();
    expect(screen.getByText('Bar 10')).toBeInTheDocument();
    expect(container.querySelectorAll('.beats i.on')).toHaveLength(3);
  });
});
