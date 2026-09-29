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

  it('starts unfolded where asked', () => {
    render(Fold, { heading: 'Thing', name: 'C major', open: true, children });
    expect(screen.getByLabelText('Thing')).toHaveAttribute('open');
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

  it('stays as a person left it when its headline changes, folded or unfolded', async () => {
    const { container, rerender } = render(Fold, { heading: 'Thing', name: 'C major', children });
    const fold = screen.getByLabelText('Thing');
    await fireEvent.click(container.querySelector('summary')!);
    fold.setAttribute('open', '');
    await rerender({ heading: 'Thing', name: 'G major', sub: 'moved', children });
    expect(fold).toHaveAttribute('open');
    fold.removeAttribute('open');
    await rerender({ heading: 'Thing', name: 'D major', sub: 'moved again', children });
    expect(fold).not.toHaveAttribute('open');
  });

  it('stays unfolded where it started so, when its headline changes', async () => {
    const { rerender } = render(Fold, { heading: 'Thing', name: 'C major', open: true, children });
    await rerender({ heading: 'Thing', name: 'G major', open: true, children });
    expect(screen.getByLabelText('Thing')).toHaveAttribute('open');
  });
});
