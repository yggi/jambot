import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import KeyPicker from './KeyPicker.svelte';

const NO_HISTORY = new Array(12).fill(0);

describe('the key picker', () => {
  it('shows the key the band is heading for: the mode as a select, the tonic ringed on its wheel', () => {
    render(KeyPicker, {
      heading: { tonic: 3, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    expect(screen.getByRole('combobox', { name: 'Mode' })).toHaveDisplayValue('dorian');
    expect(
      [...(screen.getByRole('combobox', { name: 'Mode' }) as HTMLSelectElement).options].map(
        (o) => o.text,
      ),
    ).toEqual(['aeolian', 'dorian', 'ionian', 'mixolydian']);
    expect(screen.getByRole('button', { name: 'E♭' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('wishes for the mode picked, keeping the tonic', async () => {
    const onintent = vi.fn();
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      onintent,
    });
    await fireEvent.change(screen.getByRole('combobox', { name: 'Mode' }), {
      target: { value: 'mixolydian' },
    });
    expect(onintent).toHaveBeenLastCalledWith({
      kind: 'key',
      wish: { tonic: 9, mode: 'mixolydian' },
    });
  });

  it('wishes for the tonic clicked on its circle of fifths, keeping the mode', async () => {
    const onintent = vi.fn();
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent,
    });
    await fireEvent.click(screen.getByRole('button', { name: 'D' }));
    expect(onintent).toHaveBeenCalledWith({ kind: 'key', wish: { tonic: 2, mode: 'dorian' } });
  });

  it('always draws the harmonic history under the wheel', () => {
    const history = new Array(12).fill(0);
    history[9] = 3; // A
    const { container } = render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history,
      reach: 6,
      onintent: () => {},
    });
    expect(container.querySelector('path.history')).not.toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('nudges the key a fifth up or down, keeping the mode', async () => {
    const onintent = vi.fn();
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent,
    });
    await fireEvent.click(screen.getByRole('button', { name: /Nudge up/ }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'key', wish: { tonic: 4, mode: 'dorian' } });
    await fireEvent.click(screen.getByRole('button', { name: /Nudge down/ }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'key', wish: { tonic: 2, mode: 'dorian' } });
  });

  it('disables a nudge that would leave the licence', () => {
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 0,
      onintent: () => {},
    });
    expect(screen.getByRole('button', { name: /Nudge up/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Nudge down/ })).toBeDisabled();
  });

  it('lets a client nudge but not set: no mode select, no tonic buttons', () => {
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      following: true,
      onintent: () => {},
    });
    expect(screen.getByRole('combobox', { name: 'Mode' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'D' })).toBeNull();
    expect(screen.getByRole('button', { name: /Nudge up/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Nudge down/ })).toBeEnabled();
  });

  it('reaches every tonic when the licence is wide, and dims those beyond a narrow one', () => {
    const { unmount } = render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    for (const name of ['C', 'E♭', 'F♯', 'A'])
      expect(screen.getByRole('button', { name })).toBeEnabled();
    unmount();
    // One fifth from A aeolian (no sharps or flats): D, A and E aeolian, and no further.
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 1,
      onintent: () => {},
    });
    for (const name of ['D', 'A', 'E']) expect(screen.getByRole('button', { name })).toBeEnabled();
    for (const name of ['G', 'B', 'C', 'F♯'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
  });
});
