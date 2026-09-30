import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Radar from './Radar.svelte';

const AXES = 6;
/** The vertices of the shape, as points from the frame's centre, y up. */
const vertices = (container: HTMLElement) =>
  container
    .querySelector('polygon.shape')!
    .getAttribute('points')!
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x: x! - 20, y: 20 - y! };
    });
const radius = (v: { x: number; y: number }) => Math.hypot(v.x, v.y);
/** How far round from the top, clockwise, in turns. */
const turn = (v: { x: number; y: number }) => (Math.atan2(v.x, v.y) / (2 * Math.PI) + 1) % 1;

const at = (values: number[]) => vertices(render(Radar, { values }).container);

describe('the radar', () => {
  it('has a vertex for each axis, the first at the top and the rest clockwise', () => {
    const shape = at(Array(AXES).fill(0.5));
    expect(shape).toHaveLength(AXES);
    expect(shape.map((v) => Math.round(turn(v) * AXES) % AXES)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(shape[0]!.x).toBeCloseTo(0, 3);
    expect(shape[0]!.y).toBeGreaterThan(0);
  });

  it('is a regular polygon where every axis is equal', () => {
    for (const value of [0, 0.3, 1]) {
      const radii = at(Array(AXES).fill(value)).map(radius);
      for (const r of radii) expect(r).toBeCloseTo(radii[0]!, 3);
    }
  });

  it('moves a vertex outward as its axis rises, and only that vertex', () => {
    const base = at(Array(AXES).fill(0.4));
    const raised = at([0.4, 0.4, 0.4, 0.4, 0.9, 0.4]);
    expect(radius(raised[4]!)).toBeGreaterThan(radius(base[4]!));
    for (const i of [0, 1, 2, 3, 5]) expect(radius(raised[i]!)).toBeCloseTo(radius(base[i]!), 3);
    expect(turn(raised[4]!)).toBeCloseTo(turn(base[4]!), 3);
  });

  it('draws the middle of a glide as the middle between its ends, so nothing jumps', () => {
    const from = [0, 1, 0.2, 0.8, 0.5, 0.1];
    const to = [1, 0, 0.6, 0.2, 0.5, 0.9];
    const middle = from.map((v, i) => (v + to[i]!) / 2);
    const [a, b, m] = [at(from), at(to), at(middle)];
    for (let i = 0; i < AXES; i++) {
      expect(m[i]!.x).toBeCloseTo((a[i]!.x + b[i]!.x) / 2, 2);
      expect(m[i]!.y).toBeCloseTo((a[i]!.y + b[i]!.y) / 2, 2);
    }
  });

  it('stays on the frame at an axis of 0 and of 1, and never collapses to a point', () => {
    for (const v of [...at(Array(AXES).fill(1)), ...at(Array(AXES).fill(0))]) {
      expect(radius(v)).toBeLessThanOrEqual(20);
      expect(radius(v)).toBeGreaterThan(0);
    }
  });

  it('is hidden from a screen reader, as a glyph is', () => {
    const { container } = render(Radar, { values: Array(AXES).fill(0.5) });
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
