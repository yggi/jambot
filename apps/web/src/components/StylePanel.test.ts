import { INITIAL_STYLE, PRESETS, holding } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import StylePanel from './StylePanel.svelte';

const jazz = PRESETS.find((p) => p.name === 'Swing jazz')!;

describe('the style panel', () => {
  it('shows each slider at the target of its axis, and the preset chosen', () => {
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

  it('sends a preset as an intent and marks it chosen', async () => {
    const onintent = vi.fn();
    render(StylePanel, { track: holding(INITIAL_STYLE), preset: 'Synth-pop', onintent });
    await fireEvent.click(screen.getByRole('button', { name: 'Swing jazz' }));
    expect(onintent).toHaveBeenCalledWith({ kind: 'preset', preset: jazz });
    expect(screen.getByRole('button', { name: 'Swing jazz' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('sends a slider as an intent; a style slider makes the preset custom, energy does not', async () => {
    const onintent = vi.fn();
    render(StylePanel, { track: holding(INITIAL_STYLE), preset: 'Synth-pop', onintent });
    await fireEvent.input(screen.getByRole('slider', { name: /Energy/ }), {
      target: { value: '90' },
    });
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'axis', axis: 'energy', value: 0.9 });
    expect(screen.getByRole('button', { name: 'Synth-pop' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await fireEvent.input(screen.getByRole('slider', { name: /Entropy/ }), {
      target: { value: '20' },
    });
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'axis', axis: 'entropy', value: 0.2 });
    expect(screen.getByRole('button', { name: 'Synth-pop' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
