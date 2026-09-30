import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Instrument from './Instrument.svelte';

describe('the instrument glyph', () => {
  it('is piano keys for the lead: white keys, and black keys between some', () => {
    const { container } = render(Instrument, { part: 'lead', lit: false });
    expect(container.querySelectorAll('rect.white')).toHaveLength(5);
    expect(container.querySelectorAll('rect.black').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('rect.pad')).toHaveLength(0);
  });

  it('is a two by two of pads for the drums', () => {
    const { container } = render(Instrument, { part: 'drums', lit: false });
    expect(container.querySelectorAll('rect.pad')).toHaveLength(4);
    expect(container.querySelectorAll('rect.white')).toHaveLength(0);
  });

  it('lights while a note is held, and rests otherwise, for either', () => {
    for (const part of ['lead', 'drums'] as const) {
      const resting = render(Instrument, { part, lit: false });
      expect(resting.container.querySelector('svg')).not.toHaveClass('lit');
      resting.unmount();
      const held = render(Instrument, { part, lit: true });
      expect(held.container.querySelector('svg')).toHaveClass('lit');
    }
  });
});
