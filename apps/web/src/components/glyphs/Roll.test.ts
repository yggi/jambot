import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Roll from './Roll.svelte';

const note = (step: number, pitch = 60, length = 2) => ({ step, note: pitch, length });
const rows = (container: HTMLElement) => [...container.querySelectorAll('g.row')];

describe('the band’s roll glyph', () => {
  it('is a row for each performer, with its notes as ticks', () => {
    const { container } = render(Roll, {
      rows: [
        { notes: [note(0), note(8)], sounds: true },
        { notes: [], sounds: true },
        { notes: [note(4)], sounds: true },
        { notes: [note(2), note(6), note(10)], sounds: true },
      ],
      span: 64,
      playhead: null,
    });
    expect(rows(container).map((r) => r.querySelectorAll('rect.tick').length)).toEqual([
      2, 0, 1, 3,
    ]);
  });

  it('puts a tick where its note is on the phrase, later steps further right', () => {
    const { container } = render(Roll, {
      rows: [{ notes: [note(0), note(32)], sounds: true }],
      span: 64,
      playhead: null,
    });
    const [a, b] = [...container.querySelectorAll('rect.tick')].map((t) =>
      Number(t.getAttribute('x')),
    );
    expect(b!).toBeGreaterThan(a!);
    expect(b! - a!).toBeCloseTo((32 / 64) * (a !== undefined ? 34 : 0), 5);
  });

  it('dims a row that does not sound on this device', () => {
    const { container } = render(Roll, {
      rows: [
        { notes: [note(0)], sounds: false },
        { notes: [note(0)], sounds: true },
      ],
      span: 64,
      playhead: null,
    });
    expect(rows(container).map((r) => r.classList.contains('faint'))).toEqual([true, false]);
  });

  it('moves a playhead across the phrase with the step heard, and has none before anything is', () => {
    const at = (playhead: number | null) => {
      const { container, unmount } = render(Roll, { rows: [], span: 64, playhead });
      const head = container.querySelector('line.head');
      const x = head === null ? null : Number(head.getAttribute('x1'));
      unmount();
      return x;
    };
    expect(at(null)).toBeNull();
    expect(at(48)!).toBeGreaterThan(at(16)!);
  });

  it('keeps every tick inside the frame', () => {
    const { container } = render(Roll, {
      rows: [{ notes: [note(0), note(63, 60, 8)], sounds: true }],
      span: 64,
      playhead: 63,
    });
    for (const tick of container.querySelectorAll('rect.tick')) {
      expect(Number(tick.getAttribute('x'))).toBeGreaterThanOrEqual(0);
      expect(
        Number(tick.getAttribute('x')) + Number(tick.getAttribute('width')),
      ).toBeLessThanOrEqual(40);
    }
  });
});
