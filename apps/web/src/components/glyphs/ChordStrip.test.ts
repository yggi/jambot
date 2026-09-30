import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ChordStrip from './ChordStrip.svelte';

const blocks = (container: HTMLElement) => [...container.querySelectorAll('rect.chord')];
const num = (el: Element, attribute: string) => Number(el.getAttribute(attribute));

describe('the chord strip glyph', () => {
  it('is a block for each chord of the bar, as long as the chord lasts', () => {
    const { container } = render(ChordStrip, { steps: [0, 8], lit: null, beat: null });
    const [a, b] = blocks(container);
    expect(blocks(container)).toHaveLength(2);
    expect(num(a!, 'width')).toBeCloseTo(num(b!, 'width'), 6);
    const uneven = render(ChordStrip, { steps: [0, 4], lit: null, beat: null });
    const [short, long] = blocks(uneven.container);
    expect(num(long!, 'width')).toBeGreaterThan(num(short!, 'width'));
  });

  it('is one whole block for a bar of one chord', () => {
    const one = render(ChordStrip, { steps: [0], lit: null, beat: null });
    const [whole] = blocks(one.container);
    const two = render(ChordStrip, { steps: [0, 8], lit: null, beat: null });
    expect(num(whole!, 'width')).toBeGreaterThan(num(blocks(two.container)[0]!, 'width'));
  });

  it('lights the chord sounding, and none before anything is', () => {
    const still = render(ChordStrip, { steps: [0, 8], lit: null, beat: null });
    expect(still.container.querySelectorAll('rect.lit')).toHaveLength(0);
    const { container } = render(ChordStrip, { steps: [0, 8], lit: 1, beat: 2 });
    expect(blocks(container).map((b) => b.classList.contains('lit'))).toEqual([false, true]);
  });

  it('moves a playhead across the bar with the beat, and has none before anything is heard', () => {
    const at = (beat: number | null) => {
      const { container, unmount } = render(ChordStrip, { steps: [0], lit: 0, beat });
      const head = container.querySelector('line.head');
      const x = head === null ? null : num(head, 'x1');
      unmount();
      return x;
    };
    expect(at(null)).toBeNull();
    const [b0, b1, b3] = [at(0), at(1), at(3)];
    expect(b1!).toBeGreaterThan(b0!);
    expect(b3!).toBeGreaterThan(b1!);
  });

  it('keeps every block inside the frame', () => {
    const { container } = render(ChordStrip, { steps: [0, 4, 8, 12], lit: 0, beat: 0 });
    for (const block of blocks(container)) {
      expect(num(block, 'x')).toBeGreaterThanOrEqual(0);
      expect(num(block, 'x') + num(block, 'width')).toBeLessThanOrEqual(40);
    }
  });
});
