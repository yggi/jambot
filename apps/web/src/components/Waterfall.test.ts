import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shade } from '../tune/waterfall.ts';
import Waterfall from './Waterfall.svelte';

/** A canvas that keeps what is put on it. */
function canvasSpy() {
  const puts: { data: Uint8ClampedArray; width: number; height: number }[] = [];
  let clears = 0;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((() => ({
    putImageData: (image: ImageData) =>
      puts.push({ data: image.data, width: image.width, height: image.height }),
    clearRect: () => void clears++,
  })) as never);
  return { puts, clears: () => clears };
}

// jsdom has no ImageData.
vi.stubGlobal(
  'ImageData',
  class {
    constructor(
      public data: Uint8ClampedArray,
      public width: number,
      public height: number,
    ) {}
  },
);

afterEach(() => vi.restoreAllMocks());

describe('the waterfall', () => {
  it('paints a line for each look, the newest at the top, a band a column', async () => {
    const { puts } = canvasSpy();
    const { rerender } = render(Waterfall, {
      bands: Float64Array.of(-90, 0, -45),
      listening: true,
      rows: 4,
    });
    await rerender({ bands: Float64Array.of(0, -90, -90), listening: true, rows: 4 });
    const last = puts.at(-1)!;
    expect([last.width, last.height]).toEqual([3, 4]);
    const pixel = (x: number, y: number) => [
      ...last.data.subarray((y * 3 + x) * 4, (y * 3 + x) * 4 + 3),
    ];
    expect(pixel(0, 0)).toEqual([...shade(0)]);
    expect(pixel(0, 1)).toEqual([...shade(-90)]);
    expect(pixel(1, 1)).toEqual([...shade(0)]);
    expect(pixel(2, 1)).toEqual([...shade(-45)]);
    expect(screen.getByRole('img', { name: /last five seconds/ })).toBeInTheDocument();
  });

  it('forgets what it saw when the tuner stops, and draws nothing until it listens', async () => {
    const { puts, clears } = canvasSpy();
    const { rerender } = render(Waterfall, { bands: null, listening: false, rows: 4 });
    expect(puts).toHaveLength(0);
    await rerender({ bands: Float64Array.of(0, 0), listening: true, rows: 4 });
    const seen = puts.length;
    await rerender({ bands: null, listening: false, rows: 4 });
    expect(clears()).toBeGreaterThan(0);
    await rerender({ bands: Float64Array.of(-90, -90), listening: true, rows: 4 });
    const fresh = puts.at(-1)!;
    expect(puts.length).toBe(seen + 1);
    // One look only: the second line is what has not been seen, the floor.
    expect([...fresh.data.subarray(2 * 4, 2 * 4 + 3)]).toEqual([...shade(-90)]);
  });
});
