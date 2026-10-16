import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import You from './You.svelte';

const props = () => ({
  name: 'Jolly Otter',
  onname: vi.fn(),
  onsettle: vi.fn(),
  onregenerate: vi.fn(),
});

describe('the you card', () => {
  it('shows the name, made up already, and keeps what is typed', async () => {
    const p = props();
    render(You, p);
    const field = screen.getByLabelText('Your name');
    expect(field).toHaveValue('Jolly Otter');
    await fireEvent.input(field, { target: { value: 'Ada' } });
    expect(p.onname).toHaveBeenLastCalledWith('Ada');
    await fireEvent.blur(field);
    expect(p.onsettle).toHaveBeenCalledOnce();
  });

  it('makes up another name on request', async () => {
    const p = props();
    render(You, p);
    await fireEvent.click(screen.getByRole('button', { name: 'Regenerate name' }));
    expect(p.onregenerate).toHaveBeenCalledOnce();
  });
});
