import { barLoop, repeatSection } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { loopView } from '../looper.ts';
import LoopMenu from './LoopMenu.svelte';

type Props = ComponentProps<typeof LoopMenu>;

const props = (more: Partial<Props> = {}): Props => ({
  view: loopView(null, 12),
  playing: true,
  onsection: () => {},
  onbars: () => {},
  ...more,
});

const trigger = () => screen.getByRole('button', { name: 'Loop' });

describe('the loop menu (#628, #629)', () => {
  it('opens under its trigger and closes on Escape, giving the focus back', async () => {
    render(LoopMenu, props());
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    await fireEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Loop menu' })).toBeInTheDocument();
    await fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('group', { name: 'Loop menu' })).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('closes on a tap outside, and stays open on a tap inside', async () => {
    render(LoopMenu, props());
    await fireEvent.click(trigger());
    await fireEvent.pointerDown(screen.getByRole('heading', { name: /Looper/ }));
    expect(screen.getByRole('group', { name: 'Loop menu' })).toBeInTheDocument();
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group', { name: 'Loop menu' })).toBeNull();
  });

  it('asks the section to repeat once or lock, and the looper for a window, closing on the choice', async () => {
    const onsection = vi.fn();
    const onbars = vi.fn();
    render(LoopMenu, props({ onsection, onbars }));
    for (const [name, call] of [
      ['Repeat once', () => expect(onsection).toHaveBeenLastCalledWith('repeat')],
      ['Lock', () => expect(onsection).toHaveBeenLastCalledWith('lock')],
      ['Loop the last bar', () => expect(onbars).toHaveBeenLastCalledWith(1)],
      ['Loop the last 2 bars', () => expect(onbars).toHaveBeenLastCalledWith(2)],
      ['Loop the last 4 bars', () => expect(onbars).toHaveBeenLastCalledWith(4)],
    ] as const) {
      await fireEvent.click(trigger());
      await fireEvent.click(screen.getByRole('button', { name }));
      call();
      expect(screen.queryByRole('group', { name: 'Loop menu' })).toBeNull();
    }
  });

  it('says on its trigger what plays, lit, and in the panel which choice is on and what it does', async () => {
    const { rerender } = render(LoopMenu, props());
    expect(trigger()).toHaveTextContent('loop');
    expect(trigger()).not.toHaveClass('lit');

    await rerender({ view: loopView(repeatSection(8, null), 12) });
    expect(trigger()).toHaveTextContent('locked');
    expect(trigger()).toHaveClass('lit');
    await fireEvent.click(trigger());
    expect(screen.getByRole('button', { name: 'Lock' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Repeat once' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByText(/Tap Lock again to let it go/)).toBeInTheDocument();
    // The looper rests while a section plays again, and says why.
    expect(screen.getByRole('button', { name: 'Loop the last 2 bars' })).toBeDisabled();
    expect(screen.getByText('Let the section go to use the looper.')).toBeInTheDocument();

    await rerender({ view: loopView(barLoop(12, 2), 12) });
    expect(trigger()).toHaveTextContent('2 bars');
    expect(screen.getByRole('button', { name: 'Loop the last 2 bars' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Repeat once' })).toBeDisabled();
    expect(screen.getByText('Let the looper go to loop a section.')).toBeInTheDocument();
  });

  it('rests while the band doesn’t play, and closes if it stops', async () => {
    const { rerender } = render(LoopMenu, props());
    await fireEvent.click(trigger());
    await rerender({ playing: false });
    expect(screen.queryByRole('group', { name: 'Loop menu' })).toBeNull();
    expect(trigger()).toBeDisabled();
  });
});
