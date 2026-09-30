import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Lobby from './Lobby.svelte';

describe('the lobby’s glyphs', () => {
  it('draws each kind as its own figure, hidden from a screen reader', () => {
    const drawn = (['name', 'host', 'gear'] as const).map((kind) => {
      const { container, unmount } = render(Lobby, { kind });
      const svg = container.querySelector('svg')!;
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      const shapes = svg.innerHTML;
      unmount();
      return shapes;
    });
    expect(new Set(drawn).size).toBe(3);
  });
});
