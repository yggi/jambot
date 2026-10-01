import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Contour from './Contour.svelte';

const motif = (cycle: number, pulses: number[]) => ({
  cycle,
  pulses,
  colour: 1,
  rows: 3,
  notes: [
    { step: 0, length: 2, row: 0, altered: false },
    { step: cycle - 2, length: 2, row: 2, altered: true },
  ],
});

describe('a motif drawn on its cycle', () => {
  it('lays its steps over the whole width, whatever the cycle: the last note ends at the right edge', () => {
    for (const cycle of [10, 12, 14, 16, 24]) {
      const { container, unmount } = render(Contour, { motif: motif(cycle, [0]) });
      const last = [...container.querySelectorAll('rect.note')].at(-1)!;
      const x = Number(last.getAttribute('x'));
      const width = Number(last.getAttribute('width'));
      expect(x + width + 1).toBeCloseTo(320, 9);
      unmount();
    }
  });

  it('marks each pulse of its bar but the first as a line, 4/4’s three and 7/8’s two', () => {
    const lines = (cycle: number, pulses: number[]) => {
      const { container, unmount } = render(Contour, { motif: motif(cycle, pulses) });
      const found = [...container.querySelectorAll('line')].map((l) =>
        Number(l.getAttribute('x1')),
      );
      unmount();
      return found;
    };
    expect(lines(16, [0, 4, 8, 12])).toEqual([80, 160, 240]);
    expect(lines(14, [0, 6, 10])).toEqual([(6 * 320) / 14, (10 * 320) / 14]);
  });

  it('draws no pulses where it is asked for none', () => {
    const { container } = render(Contour, { motif: motif(16, [0, 4, 8, 12]), beats: false });
    expect(container.querySelectorAll('line')).toHaveLength(0);
  });
});
