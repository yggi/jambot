import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Conductor from './Conductor.svelte';
import type { Position } from '../player.svelte.ts';

const position: Position = {
  bar: 9,
  beat: 2,
  section: 'groove',
  key: { tonic: 9, mode: 'aeolian' },
  chord: 'Am7',
};

describe('the conductor', () => {
  it('is ready while stopped, and waits while the band starts', async () => {
    const { rerender } = render(Conductor, { position: null, playing: false });
    expect(screen.getByText('Ready')).toBeInTheDocument();
    await rerender({ position: null, playing: true });
    expect(screen.getByText('…')).toBeInTheDocument();
  });

  it('shows the section, the chord, the key and the bar heard, and the beats up to the one heard', () => {
    const { container } = render(Conductor, { position, playing: true });
    expect(screen.getByText('Groove')).toBeInTheDocument();
    expect(screen.getByText('Am7')).toBeInTheDocument();
    expect(screen.getByText('A aeolian')).toBeInTheDocument();
    expect(screen.getByText('Bar 10')).toBeInTheDocument();
    expect(container.querySelectorAll('.beats i.on')).toHaveLength(3);
  });
});
