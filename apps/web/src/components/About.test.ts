import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import About from './About.svelte';

describe('the about card', () => {
  it('names the page and says what it is for, under the logo', () => {
    const { container } = render(About);
    expect(container.querySelector('summary .main')).toHaveTextContent('Jambot');
    expect(container.querySelector('summary .sub')).toHaveTextContent('play together');
    expect(container.querySelector('summary .glyph')).not.toBeNull();
  });

  it('signs the lobby', () => {
    render(About);
    expect(screen.getByRole('contentinfo', { hidden: true })).toHaveTextContent(
      'all rites reversed kallisti collective, 3192 YOLD',
    );
  });
});
