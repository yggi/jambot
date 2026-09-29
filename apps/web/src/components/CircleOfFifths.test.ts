import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import CircleOfFifths from './CircleOfFifths.svelte';

const A_AEOLIAN = [0, 2, 4, 5, 7, 9, 11];

describe('the circle of fifths', () => {
  it('shows all twelve pitch classes, named as the prototype names them', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN });
    const group = screen.getByRole('group', { name: 'Circle of fifths' });
    expect(group.textContent?.replace(/\s+/g, '')).toBe('CC♯DE♭EFF♯GA♭AB♭B');
  });

  it('has no buttons when read-only', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN });
    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('has no buttons when onintent is given without a mode', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, onintent: () => {} });
    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('is a button per pitch class when interactive, marking the tonic pressed', () => {
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, mode: 'aeolian', onintent: () => {} });
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(12);
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'C' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('wishes for the pitch class clicked as tonic, keeping the mode', async () => {
    const onintent = vi.fn();
    render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, mode: 'dorian', onintent });
    await fireEvent.click(screen.getByRole('button', { name: 'D' }));
    expect(onintent).toHaveBeenCalledWith({ kind: 'key', wish: { tonic: 2, mode: 'dorian' } });
  });
});

/** The path's points as [x, y] pairs, for a rough shape check without the wheel's own constants. */
function pathPoints(d: string): [number, number][] {
  return [...d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)]);
}

const distanceFromCenter = ([x, y]: [number, number]) => Math.hypot(x - 100, y - 100);

describe('the harmonic-history radar', () => {
  it('draws no radar when history is omitted', () => {
    const { container } = render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN });
    expect(container.querySelector('path.history')).toBeNull();
  });

  it('draws no radar when every weight is silent', () => {
    const { container } = render(CircleOfFifths, {
      tonic: 9,
      scale: A_AEOLIAN,
      history: new Array(12).fill(0),
    });
    expect(container.querySelector('path.history')).toBeNull();
  });

  it('reaches the rim for the loudest pitch class and the centre for a silent one', () => {
    const history = new Array(12).fill(0);
    history[0] = 4; // C, loudest
    history[7] = 2; // G, half as loud
    // pitch class 2 (D) stays silent.
    const { container } = render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN, history });
    const path = container.querySelector('path.history')!;
    const points = pathPoints(path.getAttribute('d')!);
    expect(points).toHaveLength(12);
    const distances = points.map(distanceFromCenter);
    const rim = Math.max(...distances);
    expect(distances.filter((d) => d < 1)).not.toEqual([]); // the silent pitch classes sit at the centre
    expect(distances.filter((d) => Math.abs(d - rim) < 1)).not.toEqual([]); // the loudest reaches the rim
  });
});

describe('the scale figure', () => {
  it('is an open arc along the rim for a diatonic scale, with no chord across the wheel', () => {
    const { container } = render(CircleOfFifths, { tonic: 9, scale: A_AEOLIAN });
    const figure = container.querySelector('path.figure')!.getAttribute('d')!;
    expect(figure.match(/A/g)).toHaveLength(6); // seven notes, six rim segments
    expect(figure).not.toMatch(/Z|L/);
    expect(container.querySelector('path.chords')).toBeNull();
  });

  it('draws a chord over the hole in a scale that is not contiguous in fifths', () => {
    // A harmonic minor: G♯ sits apart from the other six.
    const { container } = render(CircleOfFifths, { tonic: 9, scale: [9, 11, 0, 2, 4, 5, 8] });
    expect(container.querySelector('path.chords')).not.toBeNull();
  });
});
