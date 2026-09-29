import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Ruler from './Ruler.svelte';

describe('a ruler', () => {
  it('ticks a span of n steps n + 1 times and lays each mark at its place along it', () => {
    const { container } = render(Ruler, {
      label: 'A ruler',
      span: 4,
      marks: [{ at: 0 }, { at: 2 }, { at: 4 }],
    });
    expect(container.querySelectorAll('line.tick')).toHaveLength(5);
    const ticks = [...container.querySelectorAll('line.tick')].map((t) => t.getAttribute('x1'));
    const marks = [...container.querySelectorAll('circle.mark')].map((m) => m.getAttribute('cx'));
    expect(marks).toEqual([ticks[0], ticks[2], ticks[4]]);
  });

  it('places a mark between ticks where it is not a whole step', () => {
    const { container } = render(Ruler, { label: 'A ruler', span: 2, marks: [{ at: 1.5 }] });
    const ticks = [...container.querySelectorAll('line.tick')].map((t) =>
      Number(t.getAttribute('x1')),
    );
    const cx = Number(container.querySelector('circle.mark')!.getAttribute('cx'));
    expect(cx).toBeGreaterThan(ticks[1]!);
    expect(cx).toBeLessThan(ticks[2]!);
  });

  it('says a word under a mark, accents, dims, fades and lights as asked, and is named for a screen reader', () => {
    const { container, getByRole } = render(Ruler, {
      label: 'A ruler',
      span: 4,
      marks: [
        { at: 0, text: 'one', accent: true },
        { at: 1, minor: true },
        { at: 2, faint: true },
        { at: 3, lit: true },
      ],
    });
    expect(container.querySelector('text.word')).toHaveTextContent('one');
    expect(container.querySelectorAll('text.word')).toHaveLength(1);
    const classes = [...container.querySelectorAll('circle.mark')].map((m) => [...m.classList]);
    expect(classes[0]).toContain('accent');
    expect(classes[1]).toContain('minor');
    expect(classes[2]).toContain('faint');
    expect(classes[3]).toContain('lit');
    expect(getByRole('img', { name: 'A ruler' })).toBeInTheDocument();
  });
});
