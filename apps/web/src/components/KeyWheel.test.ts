import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import KeyWheel from './KeyWheel.svelte';

const A_AEOLIAN = [0, 2, 4, 5, 7, 9, 11];

describe('the key wheel', () => {
  it('shows the current key on the wheel, read-only', () => {
    render(KeyWheel, { tonic: 9, scale: A_AEOLIAN, history: new Array(12).fill(0) });
    expect(screen.getByRole('group', { name: 'Circle of fifths' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('leaves the harmonic-history radar off until the toggle is checked', async () => {
    const history = new Array(12).fill(0);
    history[9] = 3; // A
    const { container } = render(KeyWheel, { tonic: 9, scale: A_AEOLIAN, history });
    expect(container.querySelector('path.history')).toBeNull();
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Harmonic history' }));
    expect(container.querySelector('path.history')).not.toBeNull();
  });
});
