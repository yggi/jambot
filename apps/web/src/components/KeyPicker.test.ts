import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import KeyPicker from './KeyPicker.svelte';

describe('the key picker', () => {
  it('shows the key the band is heading for, each tonic named as the prototype names it', () => {
    render(KeyPicker, { heading: { tonic: 3, mode: 'dorian' }, onintent: () => {} });
    const tonic = screen.getByRole('combobox', { name: 'Key' });
    expect(tonic).toHaveDisplayValue('E♭');
    expect(screen.getByRole('combobox', { name: 'Mode' })).toHaveDisplayValue('dorian');
    expect([...(tonic as HTMLSelectElement).options].map((o) => o.text)).toEqual([
      'C',
      'C♯',
      'D',
      'E♭',
      'E',
      'F',
      'F♯',
      'G',
      'A♭',
      'A',
      'B♭',
      'B',
    ]);
    expect(
      [...(screen.getByRole('combobox', { name: 'Mode' }) as HTMLSelectElement).options].map(
        (o) => o.text,
      ),
    ).toEqual(['aeolian', 'dorian', 'ionian', 'mixolydian']);
  });

  it('wishes for the key picked, tonic and mode together', async () => {
    const onintent = vi.fn();
    render(KeyPicker, { heading: { tonic: 9, mode: 'aeolian' }, onintent });
    await fireEvent.change(screen.getByRole('combobox', { name: 'Key' }), {
      target: { value: '2' },
    });
    expect(onintent).toHaveBeenLastCalledWith({
      kind: 'key',
      wish: { tonic: 2, mode: 'aeolian' },
    });
    await fireEvent.change(screen.getByRole('combobox', { name: 'Mode' }), {
      target: { value: 'mixolydian' },
    });
    expect(onintent).toHaveBeenLastCalledWith({
      kind: 'key',
      wish: { tonic: 9, mode: 'mixolydian' },
    });
  });

  it('also wishes for a tonic clicked on its circle of fifths, keeping the mode', async () => {
    const onintent = vi.fn();
    render(KeyPicker, { heading: { tonic: 9, mode: 'aeolian' }, onintent });
    await fireEvent.click(
      screen.getByRole('group', { name: 'Circle of fifths' }).querySelector('button')!,
    );
    expect(onintent).toHaveBeenCalledWith({
      kind: 'key',
      wish: { tonic: expect.any(Number), mode: 'aeolian' },
    });
  });
});
