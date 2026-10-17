import { INITIAL_STYLE, PRESETS, holding } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import StylePanel from './StylePanel.svelte';
import { STYLE_AXES, axesOf, type StyleView } from '../hud.ts';

const jazz = PRESETS.find((p) => p.name === 'Swing jazz')!;
const axes = axesOf(INITIAL_STYLE);
const view = (over: Partial<StyleView> = {}): StyleView => ({
  preset: 'Synth-pop',
  glide: null,
  axes,
  ...over,
});
const props = (over: Partial<Parameters<typeof render<typeof StylePanel>>[1]> = {}) => ({
  track: holding(INITIAL_STYLE),
  style: view(),
  onintent: () => {},
  ...over,
});

describe('the style card', () => {
  it('is folded by default and names the closest style in its header, over what the band does', () => {
    const { container } = render(StylePanel, props());
    expect(container.querySelector('summary .title')).toHaveTextContent('Style');
    expect(container.querySelector('summary .main')).toHaveTextContent('Synth-pop');
    expect(container.querySelector('summary .sub')).toHaveTextContent('Playing Synth-pop');
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('says a glide under way, and a custom style by its most telling axes', () => {
    const gliding = render(StylePanel, {
      ...props(),
      style: view({ preset: 'Ambient', glide: { from: 'Funk', bar: 2, bars: 8 } }),
    });
    expect(gliding.container.querySelector('summary .main')).toHaveTextContent('Ambient');
    expect(gliding.container.querySelector('summary .sub')).toHaveTextContent('Gliding to Ambient');
    gliding.unmount();
    const { container } = render(StylePanel, {
      ...props(),
      style: view({
        preset: null,
        axes: { ...axes, harm: 0.9, energy: 0.1, sync: 0.5, artic: 0.5 },
      }),
    });
    expect(container.querySelector('summary .main')).toHaveTextContent('Custom');
    expect(container.querySelector('summary .sub')).toHaveTextContent('Custom · rich, sparse');
  });

  it('draws the glyph from the axes of the style heard, not those it is going to', () => {
    const heard = { ...axes, sync: 0 };
    const { container } = render(StylePanel, {
      ...props({ track: holding({ ...INITIAL_STYLE, sync: 1 }) }),
      style: view({ axes: heard }),
    });
    const glyph = container.querySelector('summary polygon.shape')!;
    const [x, y] = glyph.getAttribute('points')!.split(' ')[0]!.split(',').map(Number);
    // the first vertex is the syncopation, at the top: a sync of 0 sits at the inner radius
    expect(x).toBeCloseTo(20, 2);
    expect(20 - y!).toBeCloseTo(3, 2);
    expect(container.querySelectorAll('summary polygon.shape')).toHaveLength(1);
    expect(glyph.getAttribute('points')!.split(' ')).toHaveLength(STYLE_AXES.length);
  });

  it('shows each axis at its target, and the preset it is given pressed', () => {
    render(StylePanel, {
      ...props({ track: holding({ ...INITIAL_STYLE, ...jazz.style }) }),
      style: view({ preset: jazz.name }),
    });
    expect(screen.getByRole('slider', { name: 'Harmony' })).toHaveValue(
      String(Math.round(jazz.style.harm * 100)),
    );
    // Swing is the meter's, set on the Metrum card (#360).
    expect(screen.queryByRole('slider', { name: 'Swing' })).toBeNull();
    expect(screen.getByRole('radio', { name: 'Swing jazz' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Techno' })).toHaveAttribute('aria-checked', 'false');
  });

  it('has a gauge and a nudge for each of the five axes', () => {
    render(StylePanel, props());
    expect(screen.getAllByRole('slider')).toHaveLength(5);
    expect(screen.getAllByRole('group', { name: /^Nudge / })).toHaveLength(5);
    expect(screen.getAllByRole('img', { name: /^\w+ \d+ %$/ })).toHaveLength(5);
  });

  it('presses no preset for a custom style', () => {
    render(StylePanel, { ...props(), style: view({ preset: null }) });
    for (const p of PRESETS)
      expect(screen.getByRole('radio', { name: p.name })).toHaveAttribute('aria-checked', 'false');
  });

  it('sends a preset, a drag or a nudge as an intent', async () => {
    const onintent = vi.fn();
    render(StylePanel, props({ onintent }));
    await fireEvent.click(screen.getByRole('radio', { name: 'Swing jazz' }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'preset', preset: jazz });
    await fireEvent.input(screen.getByRole('slider', { name: 'Entropy' }), {
      target: { value: '20' },
    });
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'axis', axis: 'entropy', value: 0.2 });
    const at = INITIAL_STYLE.sync;
    await fireEvent.click(screen.getByRole('button', { name: 'Syncopation up' }));
    expect(onintent).toHaveBeenLastCalledWith({
      kind: 'axis',
      axis: 'sync',
      value: Math.round((at + 0.1) * 100) / 100,
    });
    await fireEvent.click(screen.getByRole('button', { name: 'Syncopation down' }));
    expect(onintent).toHaveBeenLastCalledWith({
      kind: 'axis',
      axis: 'sync',
      value: Math.max(0, Math.round((at - 0.1) * 100) / 100),
    });
  });

  it('nudges to the end of an axis and no further', async () => {
    const onintent = vi.fn();
    render(
      StylePanel,
      props({ track: holding({ ...INITIAL_STYLE, energy: 0.95, entropy: 0 }), onintent }),
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Energy up' }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'axis', axis: 'energy', value: 1 });
    expect(screen.getByRole('button', { name: 'Entropy down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Entropy up' })).toBeEnabled();
  });

  it('rests a client’s drag and presets, disables its nudges with the reason, and says the host sets it', () => {
    const { container } = render(StylePanel, props({ following: true }));
    for (const slider of screen.getAllByRole('slider')) expect(slider).toBeDisabled();
    for (const p of PRESETS) expect(screen.getByRole('radio', { name: p.name })).toBeDisabled();
    for (const axis of STYLE_AXES) {
      const label = {
        sync: 'Syncopation',
        harm: 'Harmony',
        artic: 'Articulation',
        energy: 'Energy',
        entropy: 'Entropy',
      }[axis];
      for (const side of ['up', 'down']) {
        const nudge = screen.getByRole('button', { name: `${label} ${side}` });
        expect(nudge).toBeDisabled();
        expect(nudge).toHaveAttribute('title', 'The host sets the style');
      }
    }
    expect(container.querySelector('summary .sub')).toHaveTextContent('the host sets it');
  });
});
