import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Card from './Card.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>the details</p>' }));
const glyph = createRawSnippet(() => ({ render: () => '<svg data-testid="glyph"></svg>' }));

describe('a card', () => {
  it('shows its title, main and sub element, and keeps its details folded until opened', async () => {
    const { container } = render(Card, {
      title: 'Thing',
      main: 'C major',
      sub: 'the key',
      children,
    });
    expect(container.querySelector('summary .title')).toHaveTextContent('Thing');
    expect(container.querySelector('summary .main')).toHaveTextContent('C major');
    expect(container.querySelector('summary .sub')).toHaveTextContent('the key');
    const card = screen.getByLabelText('Thing');
    expect(card).not.toHaveAttribute('open');
    await fireEvent.click(container.querySelector('summary')!);
    expect(card).toHaveAttribute('open');
    expect(screen.getByText('the details')).toBeInTheDocument();
  });

  it('starts unfolded where asked', () => {
    render(Card, { title: 'Thing', main: 'C major', open: true, children });
    expect(screen.getByLabelText('Thing')).toHaveAttribute('open');
  });

  it('needs no sub element and no glyph', () => {
    const { container } = render(Card, { title: 'Thing', main: 'C major', children });
    expect(container.querySelector('summary .sub')).toBeNull();
    expect(container.querySelector('summary .glyph')).toBeNull();
  });

  it('draws its glyph in the summary, hidden from a screen reader', () => {
    const { container } = render(Card, { title: 'Thing', main: 'C major', glyph, children });
    const drawn = container.querySelector('summary .glyph')!;
    expect(drawn).toHaveAttribute('aria-hidden', 'true');
    expect(drawn.querySelector('[data-testid="glyph"]')).not.toBeNull();
    // It comes first in the summary, so it is at the left in reading order too.
    expect(container.querySelector('summary')!.firstElementChild).toBe(drawn);
  });

  it('announces the sub element as it changes only where asked', () => {
    const quiet = render(Card, { title: 'Thing', main: 'C major', sub: 'still', children });
    expect(quiet.container.querySelector('summary .sub')).not.toHaveAttribute('aria-live');
    quiet.unmount();
    const { container } = render(Card, {
      title: 'Thing',
      main: 'C major',
      sub: 'moving',
      live: true,
      children,
    });
    expect(container.querySelector('summary .sub')).toHaveAttribute('aria-live', 'polite');
  });

  describe('only a person opens or folds it', () => {
    it('stays unfolded when what it shows changes', async () => {
      const { container, rerender } = render(Card, { title: 'Thing', main: 'Am · i', children });
      await fireEvent.click(container.querySelector('summary')!);
      await rerender({ title: 'Thing', main: 'G · VII', sub: 'then C · III', children });
      expect(container.querySelector('summary .main')).toHaveTextContent('G · VII');
      expect(screen.getByLabelText('Thing')).toHaveAttribute('open');
    });

    it('stays folded when what it shows changes', async () => {
      const { rerender } = render(Card, { title: 'Thing', main: 'Am · i', children });
      await rerender({ title: 'Thing', main: 'G · VII', children });
      expect(screen.getByLabelText('Thing')).not.toHaveAttribute('open');
    });

    it('stays as the person left it when it started unfolded', async () => {
      const { container, rerender } = render(Card, {
        title: 'Thing',
        main: 'Lead',
        open: true,
        children,
      });
      await fireEvent.click(container.querySelector('summary')!);
      expect(screen.getByLabelText('Thing')).not.toHaveAttribute('open');
      await rerender({ title: 'Thing', main: 'Bass', open: true, children });
      expect(screen.getByLabelText('Thing')).not.toHaveAttribute('open');
    });
  });
});
