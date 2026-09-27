import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PianoRoll from './PianoRoll.svelte';

describe('a piano roll', () => {
  it('says nothing played, given no notes, and draws nothing', () => {
    const { container } = render(PianoRoll, { notes: [] });
    expect(screen.getByText('Nothing played in the last bar yet.')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('draws one rectangle per note, named by how many', () => {
    const { container } = render(PianoRoll, {
      notes: [
        { step: 0, note: 60, length: 4 },
        { step: 4, note: 64, length: 2 },
      ],
    });
    expect(screen.getByRole('img', { name: 'Pattern of 2 notes' })).toBeInTheDocument();
    expect(container.querySelectorAll('rect.note')).toHaveLength(2);
  });

  it('gives two notes at the same step and different pitches their own row', () => {
    const { container } = render(PianoRoll, {
      notes: [
        { step: 0, note: 48, length: 4 },
        { step: 0, note: 60, length: 4 },
      ],
    });
    const [low, high] = [...container.querySelectorAll('rect.note')] as SVGRectElement[];
    expect(low!.getAttribute('y')).not.toBe(high!.getAttribute('y'));
    // The lower pitch draws lower on the roll (a larger y, SVG's origin at the top).
    expect(Number(low!.getAttribute('y'))).toBeGreaterThan(Number(high!.getAttribute('y')));
  });
});
