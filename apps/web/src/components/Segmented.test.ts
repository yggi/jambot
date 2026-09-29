import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Segmented from './Segmented.svelte';

const options = [
  { value: 'a', text: 'A' },
  { value: 'b', text: 'b', name: 'the second', disabled: true },
  { value: 'c', text: 'C' },
];

describe('a segmented choice', () => {
  it('is a radio group with exactly one segment checked, and a name for a short text', () => {
    render(Segmented, { label: 'Pick', options, value: 'c', onselect: () => {} });
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    expect(screen.getByRole('radiogroup', { name: 'Pick' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'the second' })).toHaveAttribute(
      'title',
      'the second',
    );
  });

  it('selects the segment pressed, and dims the ones that are not offered', async () => {
    const onselect = vi.fn();
    render(Segmented, { label: 'Pick', options, value: 'a', onselect });
    await fireEvent.click(screen.getByRole('radio', { name: 'C' }));
    expect(onselect.mock.calls).toEqual([['c']]);
    expect(screen.getByRole('radio', { name: 'the second' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'C' })).toBeEnabled();
  });

  it('rests every segment when disabled', () => {
    render(Segmented, { label: 'Pick', options, value: 'a', disabled: true, onselect: () => {} });
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });
});
