import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Logo from './Logo.svelte';

describe('the logo glyph', () => {
  it('is the four bars of the icon, hidden from a screen reader', () => {
    const { container } = render(Logo);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('rect')).toHaveLength(4);
  });
});
