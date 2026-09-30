import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Ring from './Ring.svelte';

const motif = {
  rows: 3,
  notes: [
    { step: 0, length: 4, row: 0 },
    { step: 4, length: 2, row: 2 },
    { step: 8, length: 8, row: 1 },
  ],
};

describe('the Muse’s ring glyph', () => {
  it('is a ring, empty while the Muse holds no motif', () => {
    const { container } = render(Ring, { motif: null, colour: 0, pulse: 0 });
    expect(container.querySelector('circle.ring')).not.toBeNull();
    expect(container.querySelectorAll('rect.note')).toHaveLength(0);
  });

  it('holds the motif’s contour inside: a mark for each note, higher notes higher, later steps further right', () => {
    const { container } = render(Ring, { motif, colour: 2, pulse: 0 });
    const notes = [...container.querySelectorAll('rect.note')];
    expect(notes).toHaveLength(3);
    const [low, high] = [notes[0]!, notes[1]!];
    expect(Number(high.getAttribute('y'))).toBeLessThan(Number(low.getAttribute('y')));
    expect(Number(notes[2]!.getAttribute('x'))).toBeGreaterThan(Number(low.getAttribute('x')));
  });

  it('draws the contour in its player’s colour', () => {
    const { container } = render(Ring, { motif, colour: 3, pulse: 0 });
    expect(container.querySelector('rect.note')!.getAttribute('style')).toContain('--source-3');
  });

  it('pings anew for each note played, and not before any', async () => {
    const still = render(Ring, { motif: null, colour: 0, pulse: 0 });
    expect(still.container.querySelectorAll('circle.ping')).toHaveLength(0);
    still.unmount();
    const { container, rerender } = render(Ring, { motif: null, colour: 0, pulse: 1 });
    const first = container.querySelector('circle.ping');
    expect(first).not.toBeNull();
    await rerender({ motif: null, colour: 0, pulse: 2 });
    expect(container.querySelector('circle.ping')).not.toBe(first);
  });

  it('keeps every mark inside the frame', () => {
    const { container } = render(Ring, { motif, colour: 0, pulse: 0 });
    for (const note of container.querySelectorAll('rect.note')) {
      expect(Number(note.getAttribute('x'))).toBeGreaterThanOrEqual(0);
      expect(
        Number(note.getAttribute('x')) + Number(note.getAttribute('width')),
      ).toBeLessThanOrEqual(40);
      expect(
        Number(note.getAttribute('y')) + Number(note.getAttribute('height')),
      ).toBeLessThanOrEqual(40);
    }
  });
});
