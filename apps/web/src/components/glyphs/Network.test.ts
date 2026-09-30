import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Network from './Network.svelte';

const nodes = (container: HTMLElement) => [...container.querySelectorAll('circle.node')];
const links = (container: HTMLElement) => [...container.querySelectorAll('line.link')];

describe('the network glyph', () => {
  it('is a lone node with no link for one player', () => {
    const { container } = render(Network, { colours: [0], bar: null });
    expect(nodes(container)).toHaveLength(1);
    expect(links(container)).toHaveLength(0);
  });

  it('is a node for each player and a link from the first to each of the others', () => {
    const { container } = render(Network, { colours: [0, 1, 2, 3], bar: null });
    expect(nodes(container)).toHaveLength(4);
    expect(links(container)).toHaveLength(3);
  });

  it('colours each node as its player is, by the players’ colours', () => {
    const { container } = render(Network, { colours: [0, 3, 5], bar: null });
    const coloured = nodes(container).map(
      (n) => /var\(--source-(\d)\)/.exec(n.getAttribute('style') ?? '')?.[1],
    );
    expect(coloured).toEqual(['0', '3', '5']);
  });

  it('does not put two others in a straight line through the middle', () => {
    const { container } = render(Network, { colours: [0, 1, 2], bar: null });
    const [, a, b] = nodes(container).map(
      (n) => [Number(n.getAttribute('cx')) - 20, Number(n.getAttribute('cy')) - 20] as const,
    );
    // The cross product of the two arms is zero for a straight line through the middle.
    expect(Math.abs(a![0] * b![1] - a![1] * b![0])).toBeGreaterThan(1);
  });

  it('puts the first node in the middle and the others round it, evenly, on one circle', () => {
    const { container } = render(Network, { colours: [0, 1, 2, 3], bar: null });
    const [first, ...others] = nodes(container).map((n) => [
      Number(n.getAttribute('cx')),
      Number(n.getAttribute('cy')),
    ]) as [number, number][];
    expect(first).toEqual([20, 20]);
    const radii = others.map(([x, y]) => Math.round(Math.hypot(x - 20, y - 20) * 100));
    expect(new Set(radii).size).toBe(1);
    expect(radii[0]).toBeGreaterThan(0);
  });

  it('pings anew for each bar heard, and not before any', async () => {
    const still = render(Network, { colours: [0, 1], bar: null });
    expect(still.container.querySelectorAll('circle.ping')).toHaveLength(0);
    still.unmount();
    const { container, rerender } = render(Network, { colours: [0, 1], bar: 4 });
    const first = container.querySelector('circle.ping');
    expect(first).not.toBeNull();
    await rerender({ colours: [0, 1], bar: 5 });
    expect(container.querySelector('circle.ping')).not.toBe(first);
  });
});
