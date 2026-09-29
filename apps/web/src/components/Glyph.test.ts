import { createRawSnippet } from 'svelte';
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Glyph, { GLYPH_SIZE } from './Glyph.svelte';

const drawing = createRawSnippet(() => ({ render: () => '<circle cx="20" cy="20" r="4" />' }));

describe('a glyph', () => {
  it('is a square of its own size, decoration for a screen reader, that its drawing fills', () => {
    const { container } = render(Glyph, { children: drawing });
    const svg = container.querySelector('svg.glyph')!;
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}`);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelector('circle')).not.toBeNull();
  });
});
