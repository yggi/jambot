import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TrackPill from './TrackPill.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>the lane</p>' }));

describe('a track pill', () => {
  it('is its label, its track and a volume glyph that turns it over', async () => {
    const onview = vi.fn();
    render(TrackPill, { label: 'Lead', fader: false, level: 0.5, onview, children });
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('the lane')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Show Lead faders' }));
    expect(onview).toHaveBeenCalledOnce();
  });

  it('shows the faders in the track’s place: mute, volume, solo, and the way back', async () => {
    const p = { onmute: vi.fn(), onsolo: vi.fn(), onlevel: vi.fn(), onview: vi.fn() };
    render(TrackPill, { label: 'Lead', fader: true, level: 0.5, ...p, children });
    expect(screen.queryByText('the lane')).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Mute Lead' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Solo Lead' }));
    await fireEvent.input(screen.getByRole('slider', { name: 'Lead volume' }), {
      target: { value: '30' },
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Show Lead track' }));
    expect(p.onmute).toHaveBeenCalledOnce();
    expect(p.onsolo).toHaveBeenCalledOnce();
    expect(p.onlevel).toHaveBeenCalledWith(0.3);
    expect(p.onview).toHaveBeenCalledOnce();
  });

  it('shows on its toggle what it is: muted crossed out, soloed marked, the level in waves', async () => {
    const { rerender } = render(TrackPill, { label: 'Lead', fader: false, level: 1, children });
    const toggle = () => screen.getByRole('button', { name: 'Show Lead faders' });
    expect(toggle().querySelectorAll('.wave')).toHaveLength(3);
    await rerender({ level: 0, muted: true });
    expect(toggle().querySelector('.cross')).not.toBeNull();
    expect(toggle().querySelectorAll('.wave')).toHaveLength(0);
    await rerender({ muted: false, soloed: true, level: 0.5 });
    expect(toggle().querySelector('.solo-s')).not.toBeNull();
    expect(toggle().querySelectorAll('.wave')).toHaveLength(2);
  });

  it('has no toggle where it has no faders: another player’s track', () => {
    render(TrackPill, { label: 'Ada', children });
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('the lane')).toBeInTheDocument();
  });

  it('shows the pressed mute and solo', () => {
    render(TrackPill, { label: 'Lead', fader: true, muted: true, soloed: false, children });
    expect(screen.getByRole('button', { name: 'Mute Lead' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Solo Lead' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
