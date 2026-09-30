// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Waterfall, shade } from './waterfall.ts';

describe('shade', () => {
  it('runs from dark at the floor to bright at full scale, getting lighter as it gets louder, never out of range', () => {
    let previous = -1;
    for (let db = -90; db <= 0; db += 1) {
      const [r, g, b] = shade(db);
      for (const channel of [r, g, b]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
      const light = r + g + b;
      expect(light, `${db}`).toBeGreaterThanOrEqual(previous);
      previous = light;
    }
    expect(shade(-90)).toEqual(shade(-200));
    expect(shade(0)).toEqual(shade(12));
    expect(shade(-90)[0] + shade(-90)[1] + shade(-90)[2]).toBeLessThan(120);
    expect(shade(0)[0] + shade(0)[1] + shade(0)[2]).toBeGreaterThan(600);
  });

  it('reads silence, minus infinity and not a number, as the floor', () => {
    expect(shade(-Infinity)).toEqual(shade(-90));
    expect(shade(Number.NaN)).toEqual(shade(-90));
  });

  it('takes a range of its own', () => {
    expect(shade(-30, { floorDb: -30, topDb: 0 })).toEqual(shade(-90));
    expect(shade(0, { floorDb: -30, topDb: 0 })).toEqual(shade(0));
  });
});

describe('Waterfall', () => {
  const row = (db: number, bands = 4) => new Float64Array(bands).fill(db);

  it('keeps the newest rows, newest first, and forgets the oldest once it is full', () => {
    const w = new Waterfall(3);
    for (const db of [-10, -20, -30, -40]) w.push(row(db));
    expect(w.rows.map((r) => r[0])).toEqual([-40, -30, -20]);
    expect(w.size).toBe(3);
  });

  it('holds a copy, so a row that is reused later does not change what was seen', () => {
    const w = new Waterfall(2);
    const r = row(-10);
    w.push(r);
    r.fill(-99);
    expect(w.rows[0]![0]).toBe(-10);
  });

  it('paints its rows as pixels: a band a column, a look a line, the newest at the top, unfilled lines at the floor', () => {
    const w = new Waterfall(3);
    w.push(Float64Array.of(-90, 0));
    w.push(Float64Array.of(0, -90));
    const pixels = w.pixels(2);
    expect(pixels).toHaveLength(2 * 3 * 4);
    const at = (x: number, y: number) => [...pixels.subarray((y * 2 + x) * 4, (y * 2 + x) * 4 + 4)];
    expect(at(0, 0)).toEqual([...shade(0), 255]);
    expect(at(1, 0)).toEqual([...shade(-90), 255]);
    expect(at(0, 1)).toEqual([...shade(-90), 255]);
    expect(at(1, 1)).toEqual([...shade(0), 255]);
    expect(at(0, 2)).toEqual([...shade(-90), 255]);
  });

  it('clears', () => {
    const w = new Waterfall(3);
    w.push(row(-10));
    w.clear();
    expect(w.rows).toEqual([]);
  });
});
