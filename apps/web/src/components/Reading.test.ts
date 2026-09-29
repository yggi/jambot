import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Reading from './Reading.svelte';

describe('a reading', () => {
  it('sets what is read against its value', () => {
    const { container } = render(Reading, { label: 'Swing', value: '62 %' });
    expect(container.querySelector('span')).toHaveTextContent('Swing');
    expect(container.querySelector('b')).toHaveTextContent('62 %');
  });
});
