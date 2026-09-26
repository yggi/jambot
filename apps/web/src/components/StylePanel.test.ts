import { INITIAL_STYLE, PRESETS, holding } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import StylePanel from './StylePanel.svelte';

const jazz = PRESETS.find((p) => p.name === 'Swing jazz')!;

describe('the style panel', () => {
  it('shows each slider at the target of its axis, and the preset it is given pressed', () => {
    render(StylePanel, {
      track: holding({ ...INITIAL_STYLE, ...jazz.style }),
      preset: jazz.name,
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
    render(StylePanel, { track: holding(INITIAL_STYLE), preset: null, onintent: () => {} });
    for (const p of PRESETS)
      expect(screen.getByRole('button', { name: p.name })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sends a preset or a slider as an intent', async () => {
    const onintent = vi.fn();
    render(StylePanel, { track: holding(INITIAL_STYLE), preset: 'Synth-pop', onintent });
    await fireEvent.click(screen.getByRole('button', { name: 'Swing jazz' }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'preset', preset: jazz });
    await fireEvent.input(screen.getByRole('slider', { name: /Entropy/ }), {
      target: { value: '20' },
    });
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'axis', axis: 'entropy', value: 0.2 });
  });
});
