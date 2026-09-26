import { INITIAL_STYLE, PRESETS, holding } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import StylePanel from './StylePanel.svelte';
import type { StyleView } from '../hud.ts';

const jazz = PRESETS.find((p) => p.name === 'Swing jazz')!;

describe('the style panel', () => {
  it('shows each slider at the target of its axis, and the preset it is given pressed', () => {
    render(StylePanel, {
      track: holding({ ...INITIAL_STYLE, ...jazz.style }),
      style: { preset: jazz.name, glide: null },
      onintent: () => {},
    });
    expect(screen.getByRole('slider', { name: /Swing/ })).toHaveValue(
      String(Math.round(jazz.style.swing * 100)),
    );
    expect(screen.getByRole('button', { name: 'Swing jazz' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Techno' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('presses no preset for a custom style', () => {
    render(StylePanel, {
      track: holding(INITIAL_STYLE),
      style: { preset: null, glide: null },
      onintent: () => {},
    });
    for (const p of PRESETS)
      expect(screen.getByRole('button', { name: p.name })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sends a preset or a slider as an intent', async () => {
    const onintent = vi.fn();
    render(StylePanel, {
      track: holding(INITIAL_STYLE),
      style: { preset: 'Synth-pop', glide: null },
      onintent,
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Swing jazz' }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'preset', preset: jazz });
    await fireEvent.input(screen.getByRole('slider', { name: /Entropy/ }), {
      target: { value: '20' },
    });
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'axis', axis: 'entropy', value: 0.2 });
  });

  it('says where the style is: a preset playing, a glide under way, or a custom style', async () => {
    const at = (style: StyleView) =>
      render(StylePanel, { track: holding(INITIAL_STYLE), style, onintent: () => {} });
    const playing = at({ preset: 'Techno', glide: null });
    expect(screen.getByText('Playing Techno.')).toBeInTheDocument();
    playing.unmount();
    const moving = at({ preset: 'Funk', glide: { from: 'Techno', bar: 3, bars: 8 } });
    expect(screen.getByText('Moving from Techno to Funk, bar 3 of 8.')).toHaveClass('moving');
    moving.unmount();
    const fromCustom = at({ preset: 'Funk', glide: { from: null, bar: 1, bars: 8 } });
    expect(screen.getByText('Moving from Custom to Funk, bar 1 of 8.')).toBeInTheDocument();
    fromCustom.unmount();
    at({ preset: null, glide: { from: 'Techno', bar: 1, bars: 1 } });
    expect(
      screen.getByText('Custom style. Pick a preset to glide somewhere named.'),
    ).not.toHaveClass('moving');
  });
});
