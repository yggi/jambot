import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Lane from './Lane.svelte';

const notes = [
  { step: 0, note: 48, length: 4 },
  { step: 8, note: 72, length: 4 },
];
const y = (el: Element) => Number(el.getAttribute('y'));

describe('a lane', () => {
  it('draws its notes, high notes higher', () => {
    const { container } = render(Lane, { label: 'Lead', notes, span: 64 });
    const [low, high] = [...container.querySelectorAll('rect.note')];
    expect(y(high!)).toBeLessThan(y(low!));
  });

  it('draws a backdrop of dim notes under its own, both on the one scale', () => {
    const under = [{ step: 4, note: 72, length: 4 }];
    const { container } = render(Lane, { label: 'Lead', notes, under, span: 64 });
    const backdrop = [...container.querySelectorAll('rect.note.under')];
    expect(backdrop).toHaveLength(1);
    expect(container.querySelectorAll('rect.note:not(.under)')).toHaveLength(2);
    const own = [...container.querySelectorAll('rect.note:not(.under)')][1]!;
    expect(y(backdrop[0]!)).toBe(y(own));
  });

  it('scales to the backdrop’s range too, so a note out of its own range is still inside the lane', () => {
    const under = [{ step: 4, note: 96, length: 4 }];
    const { container } = render(Lane, { label: 'Lead', notes, under, span: 64 });
    for (const rect of container.querySelectorAll('rect.note')) {
      expect(y(rect)).toBeGreaterThanOrEqual(0);
      expect(y(rect) + Number(rect.getAttribute('height'))).toBeLessThanOrEqual(60);
    }
  });

  it('is taller where asked, with room for the same notes', () => {
    const plain = render(Lane, { label: 'Lead', notes, span: 64 });
    expect(plain.container.querySelector('svg')).not.toHaveClass('tall');
    const tall = render(Lane, { label: 'Lead', notes, span: 64, tall: true });
    expect(tall.container.querySelector('svg')).toHaveClass('tall');
    expect(tall.container.querySelectorAll('rect.note')).toHaveLength(2);
  });

  it('draws nothing for no notes, and nothing out of place', () => {
    const { container } = render(Lane, { label: 'Lead', notes: [], span: 64 });
    expect(container.querySelectorAll('rect.note')).toHaveLength(0);
  });
});
