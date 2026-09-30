import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TrackSlider from './TrackSlider.svelte';

const props = (more: Partial<Parameters<typeof render>[1]> = {}) => ({
  label: 'Bass',
  level: 0.6,
  muted: false,
  soloed: false,
  onlevel: () => {},
  onmute: () => {},
  onsolo: () => {},
  ...more,
});

describe('a track slider', () => {
  it('is one group named for its track, with a mute, a volume and a solo in it', () => {
    render(TrackSlider, props());
    const group = screen.getByRole('group', { name: 'Bass' });
    expect(group).toContainElement(screen.getByRole('button', { name: 'Mute Bass' }));
    expect(group).toContainElement(screen.getByRole('slider', { name: 'Bass volume' }));
    expect(group).toContainElement(screen.getByRole('button', { name: 'Solo Bass' }));
  });

  it('puts the mute first and the solo last, the volume between', () => {
    const { container } = render(TrackSlider, props());
    const order = [...container.querySelectorAll('button, input')].map((el) =>
      el.getAttribute('aria-label'),
    );
    expect(order).toEqual(['Mute Bass', 'Bass volume', 'Solo Bass']);
  });

  it('shows the level, and sets it as the slider moves', async () => {
    const onlevel = vi.fn();
    render(TrackSlider, props({ onlevel }));
    const slider = screen.getByRole('slider', { name: 'Bass volume' });
    expect(slider).toHaveValue('60');
    await fireEvent.input(slider, { target: { value: '25' } });
    expect(onlevel).toHaveBeenCalledWith(0.25);
  });

  it('mutes and solos, and shows which is on', async () => {
    const [onmute, onsolo] = [vi.fn(), vi.fn()];
    const { rerender } = render(TrackSlider, props({ onmute, onsolo }));
    const mute = screen.getByRole('button', { name: 'Mute Bass' });
    const solo = screen.getByRole('button', { name: 'Solo Bass' });
    expect(mute).toHaveAttribute('aria-pressed', 'false');
    expect(solo).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(mute);
    await fireEvent.click(solo);
    expect(onmute).toHaveBeenCalledOnce();
    expect(onsolo).toHaveBeenCalledOnce();
    await rerender({ muted: true, soloed: true });
    expect(mute).toHaveAttribute('aria-pressed', 'true');
    expect(solo).toHaveAttribute('aria-pressed', 'true');
  });

  it('draws the mute as a speaker glyph, crossed out while muted', async () => {
    const { container, rerender } = render(TrackSlider, props());
    const glyph = () => screen.getByRole('button', { name: 'Mute Bass' }).querySelector('svg')!;
    expect(glyph()).toHaveAttribute('aria-hidden', 'true');
    expect(glyph().querySelector('path.cone')).not.toBeNull();
    expect(container.querySelector('line.cross')).toBeNull();
    await rerender({ muted: true });
    expect(container.querySelector('line.cross')).not.toBeNull();
  });

  it('keeps the slider quiet under a mute: a muted track still shows its level', () => {
    render(TrackSlider, props({ muted: true, level: 0.4 }));
    expect(screen.getByRole('slider', { name: 'Bass volume' })).toHaveValue('40');
  });
});
