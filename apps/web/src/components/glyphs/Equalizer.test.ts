import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Equalizer from './Equalizer.svelte';

const bars = (container: HTMLElement) => [...container.querySelectorAll('rect.bar')];
const height = (bar: Element) => Number(bar.getAttribute('height'));

describe('the equalizer', () => {
  it('draws a bar for each level, taller for a higher one, all on one baseline', () => {
    const { container } = render(Equalizer, { levels: [0.2, 1, 0.5, 0.2] });
    const drawn = bars(container);
    expect(drawn).toHaveLength(4);
    expect(height(drawn[1]!)).toBeGreaterThan(height(drawn[2]!));
    expect(height(drawn[2]!)).toBeGreaterThan(height(drawn[0]!));
    expect(height(drawn[0]!)).toBe(height(drawn[3]!));
    const bottoms = new Set(drawn.map((bar) => Number(bar.getAttribute('y')) + height(bar)));
    expect(bottoms.size).toBe(1);
  });

  it('keeps every bar inside the frame, even for a level out of range', () => {
    const { container } = render(Equalizer, { levels: [-1, 2] });
    for (const bar of bars(container)) {
      expect(height(bar)).toBeGreaterThan(0);
      expect(Number(bar.getAttribute('y'))).toBeGreaterThanOrEqual(0);
    }
  });
});
