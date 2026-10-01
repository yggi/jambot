import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { BarFrame } from '../tracks.ts';
import Lane from './Lane.svelte';

/** `bars` bars of 4/4 laid end to end, as `tracksOf` frames them. */
const framed = (bars: number): BarFrame[] =>
  Array.from({ length: bars }, (_, i) => ({
    start: i * 16,
    steps: 16,
    pulses: [0, 4, 8, 12].map((p) => i * 16 + p),
  }));

const notes = [
  { step: 0, note: 48, length: 4 },
  { step: 8, note: 72, length: 4 },
];
const y = (el: Element) => Number(el.getAttribute('y'));

describe('a lane', () => {
  it('draws its notes, high notes higher', () => {
    const { container } = render(Lane, { label: 'Lead', notes, span: 64, frame: framed(4) });
    const [low, high] = [...container.querySelectorAll('rect.note')];
    expect(y(high!)).toBeLessThan(y(low!));
  });

  it('draws a backdrop of dim notes under its own, both on the one scale', () => {
    const under = [{ step: 4, note: 72, length: 4 }];
    const { container } = render(Lane, { label: 'Lead', notes, under, span: 64, frame: framed(4) });
    const backdrop = [...container.querySelectorAll('rect.note.under')];
    expect(backdrop).toHaveLength(1);
    expect(container.querySelectorAll('rect.note:not(.under)')).toHaveLength(2);
    const own = [...container.querySelectorAll('rect.note:not(.under)')][1]!;
    expect(y(backdrop[0]!)).toBe(y(own));
  });

  it('scales to the backdrop’s range too, so a note out of its own range is still inside the lane', () => {
    const under = [{ step: 4, note: 96, length: 4 }];
    const { container } = render(Lane, { label: 'Lead', notes, under, span: 64, frame: framed(4) });
    for (const rect of container.querySelectorAll('rect.note')) {
      expect(y(rect)).toBeGreaterThanOrEqual(0);
      expect(y(rect) + Number(rect.getAttribute('height'))).toBeLessThanOrEqual(60);
    }
  });

  it('is taller where asked, with room for the same notes', () => {
    const plain = render(Lane, { label: 'Lead', notes, span: 64, frame: framed(4) });
    expect(plain.container.querySelector('svg')).not.toHaveClass('tall');
    const tall = render(Lane, { label: 'Lead', notes, span: 64, frame: framed(4), tall: true });
    expect(tall.container.querySelector('svg')).toHaveClass('tall');
    expect(tall.container.querySelectorAll('rect.note')).toHaveLength(2);
  });

  it('draws nothing for no notes, and nothing out of place', () => {
    const { container } = render(Lane, { label: 'Lead', notes: [], span: 64, frame: framed(4) });
    expect(container.querySelectorAll('rect.note')).toHaveLength(0);
  });

  it('draws a line at each pulse of each bar, the bar’s start stronger, in a bar of any length', () => {
    const frame: BarFrame[] = [
      { start: 0, steps: 16, pulses: [0, 4, 8, 12] },
      { start: 16, steps: 14, pulses: [16, 22, 26] },
    ];
    const { container } = render(Lane, { label: 'Lead', notes, span: 30, frame });
    const lines = [...container.querySelectorAll('line:not(.playhead)')];
    expect(lines).toHaveLength(7);
    const starts = lines.filter((l) => l.classList.contains('bar'));
    expect(starts).toHaveLength(2);
    const at = (l: Element) => Number(l.getAttribute('x1'));
    expect(starts.map(at)).toEqual([0, (16 / 30) * 640]);
    expect(lines.map(at).every((x, i, all) => i === 0 || x > all[i - 1]!)).toBe(true);
  });

  it('tints a credited bar over its own length, and outlines the bar the Muse took', () => {
    const frame: BarFrame[] = [
      { start: 0, steps: 16, pulses: [0, 4, 8, 12] },
      { start: 16, steps: 14, pulses: [16, 22, 26] },
    ];
    const { container } = render(Lane, {
      label: 'Lead',
      notes,
      span: 30,
      frame,
      credited: [{ at: 1, colour: 2 }],
      taken: { at: 1, colour: 2 },
    });
    const tint = container.querySelector('rect.credited')!;
    expect(Number(tint.getAttribute('x'))).toBeCloseTo((16 / 30) * 640, 9);
    expect(Number(tint.getAttribute('width'))).toBeCloseTo((14 / 30) * 640, 9);
    const taken = container.querySelector('rect.taken')!;
    expect(Number(taken.getAttribute('x'))).toBeCloseTo((16 / 30) * 640 + 1, 9);
    expect(Number(taken.getAttribute('width'))).toBeCloseTo((14 / 30) * 640 - 2, 9);
  });

  it('draws the notes of a credited bar in its player’s colour by the bar they fall in', () => {
    const frame: BarFrame[] = [
      { start: 0, steps: 16, pulses: [0, 4, 8, 12] },
      { start: 16, steps: 14, pulses: [16, 22, 26] },
    ];
    const { container } = render(Lane, {
      label: 'Lead',
      notes: [
        { step: 15, note: 60, length: 1 },
        { step: 16, note: 62, length: 1 },
        { step: 29, note: 64, length: 1 },
      ],
      span: 30,
      frame,
      credited: [{ at: 1, colour: 3 }],
    });
    const fills = [...container.querySelectorAll('rect.note')].map(
      (n) => (n as SVGElement).style.fill,
    );
    expect(fills).toEqual(['', 'var(--source-3)', 'var(--source-3)']);
  });
});
