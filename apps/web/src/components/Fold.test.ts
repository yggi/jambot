import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Fold from './Fold.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>the details</p>' }));

describe('a fold', () => {
  it('shows a headline and the line under it, and keeps its details folded until opened', async () => {
    const { container } = render(Fold, {
      heading: 'Thing',
      name: 'C major',
      sub: 'the key',
      children,
    });
    expect(container.querySelector('summary .name')).toHaveTextContent('C major');
    expect(container.querySelector('summary .sub')).toHaveTextContent('the key');
    const fold = screen.getByLabelText('Thing');
    expect(fold).not.toHaveAttribute('open');
    await fireEvent.click(container.querySelector('summary')!);
    expect(screen.getByText('the details')).toBeInTheDocument();
  });

  it('needs no line under the headline', () => {
    const { container } = render(Fold, { heading: 'Thing', name: 'C major', children });
    expect(container.querySelector('summary .sub')).toBeNull();
  });

  it('announces the line under the headline as it changes only where asked', () => {
    const quiet = render(Fold, { heading: 'Thing', name: 'C major', sub: 'still', children });
    expect(quiet.container.querySelector('summary .sub')).not.toHaveAttribute('aria-live');
    quiet.unmount();
    const { container } = render(Fold, {
      heading: 'Thing',
      name: 'C major',
      sub: 'moving',
      live: true,
      children,
    });
    expect(container.querySelector('summary .sub')).toHaveAttribute('aria-live', 'polite');
  });
});
