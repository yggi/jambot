import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Sections from './Sections.svelte';

const segs = (container: HTMLElement) => [...container.querySelectorAll('rect.seg')];
const width = (el: Element) => Number(el.getAttribute('width'));

describe('the sections glyph', () => {
  it('is a segment for each section, of one size, side by side in the frame', () => {
    const { container } = render(Sections, {
      sections: [1, 2, 3, 4, 5].map(() => ({ newKey: false })),
      progress: null,
    });
    const drawn = segs(container);
    expect(drawn).toHaveLength(5);
    expect(new Set(drawn.map(width)).size).toBe(1);
    const xs = drawn.map((s) => Number(s.getAttribute('x')));
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(xs[0]).toBeGreaterThanOrEqual(0);
    expect(xs.at(-1)! + width(drawn[0]!)).toBeLessThanOrEqual(40);
  });

  it('fills the section playing as far as its bar, and no other', () => {
    const at = (progress: number | null) => {
      const { container, unmount } = render(Sections, {
        sections: [{ newKey: false }, { newKey: false }, { newKey: false }],
        progress,
      });
      const fills = [...container.querySelectorAll('rect.fill')].map(width);
      unmount();
      return fills;
    };
    expect(at(null)).toEqual([]);
    const [quarter] = at(0.25);
    const [whole] = at(1);
    expect(at(0.25)).toHaveLength(1);
    expect(quarter).toBeGreaterThan(0);
    expect(whole).toBeGreaterThan(quarter!);
    expect(whole).toBeCloseTo(quarter! * 4, 6);
  });

  it('marks a section where the key changes', () => {
    const { container } = render(Sections, {
      sections: [{ newKey: false }, { newKey: true }, { newKey: false }, { newKey: true }],
      progress: 0.5,
    });
    const marks = [...container.querySelectorAll('circle.key')];
    expect(marks).toHaveLength(2);
    const xs = marks.map((m) => Number(m.getAttribute('cx')));
    const centres = segs(container).map((s) => Number(s.getAttribute('x')) + width(s) / 2);
    expect(xs).toEqual([centres[1], centres[3]]);
  });

  it('draws nothing for no sections', () => {
    const { container } = render(Sections, { sections: [], progress: null });
    expect(segs(container)).toHaveLength(0);
  });
});
