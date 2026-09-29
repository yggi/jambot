import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Gauge from './Gauge.svelte';

const left = (element: Element | null) => (element as HTMLElement).style.left;

describe('a gauge', () => {
  it('ticks the centre and puts the marker along the track by value', () => {
    const { container, getByRole } = render(Gauge, {
      label: 'A gauge',
      from: -2,
      to: 2,
      centre: 0,
      value: 1,
    });
    expect(left(container.querySelector('.centre'))).toBe('50%');
    expect(left(container.querySelector('.value'))).toBe('75%');
    expect(getByRole('img', { name: 'A gauge' })).toBeInTheDocument();
    expect(container.querySelector('.reach')).toBeNull();
    expect(container.querySelector('u')).toBeNull();
  });

  it('fills from the centre to the marker, on either side of it', () => {
    const fill = (value: number) => {
      const { container, unmount } = render(Gauge, {
        label: 'g',
        from: -1,
        to: 1,
        centre: 0,
        value,
        fill: true,
      });
      const u = container.querySelector('u') as HTMLElement;
      const span = [u.style.left, u.style.right];
      unmount();
      return span;
    };
    expect(fill(0.5)).toEqual(['50%', '25%']);
    expect(fill(-0.5)).toEqual(['25%', '50%']);
  });

  it('shows a band within reach', () => {
    const { container } = render(Gauge, {
      label: 'g',
      from: -1,
      to: 1,
      centre: 0,
      value: 0,
      reach: [-0.5, 1],
    });
    const band = container.querySelector('.reach') as HTMLElement;
    expect([band.style.left, band.style.right]).toEqual(['25%', '0%']);
  });
});
