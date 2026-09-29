import { SECTION_BARS } from '@jambot/engine';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Plan from './Plan.svelte';
import type { BarView, Hud, SectionView } from '../hud.ts';

const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % SECTION_BARS,
  section: 'Groove',
  key: 'A minor',
  tonic: 9,
  scale: [0, 2, 4, 5, 7, 9, 11],
  chords: [{ step: 0, symbol: 'Am7', numeral: 'i7' }],
  energy: 0.6,
  lead: 'improvising',
  motif: null,
  ...over,
});
/** The bars after `n` to the end of the next section, as the view model gives them. */
const after = (n: number) => {
  const end = (Math.floor(n / SECTION_BARS) + 2) * SECTION_BARS;
  return Array.from({ length: end - n - 1 }, (_, i) => bar(n + 1 + i));
};
const hudAt = (n: number, over: Partial<Hud> = {}): Hud => ({
  bar: bar(n),
  beat: 2,
  chord: bar(n).chords[0]!,
  next: after(n),
  sections: [],
  style: { preset: 'Synth-pop', glide: null },
  heading: { tonic: 9, mode: 'aeolian' },
  muse: { motif: null, log: [] },
  ...over,
});
const opening = bar(0, { section: 'Intro' });
const idle = hudAt(0, { bar: opening, beat: null, chord: opening.chords[0]! });

const name = (container: HTMLElement) => container.querySelector('summary .name');
const sub = (container: HTMLElement) => container.querySelector('summary .sub');

describe('the plan', () => {
  it('names itself in its own header, folded by default', () => {
    const { container } = render(Plan, { hud: hudAt(9), playing: true });
    expect(container.querySelector('summary .heading')).toHaveTextContent('Plan');
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('is ready while stopped, and says the section and the key the band opens on', () => {
    const { container } = render(Plan, { hud: idle, playing: false });
    expect(name(container)).toHaveTextContent(/^Ready$/);
    expect(sub(container)).toHaveTextContent('Opens on Intro · A minor');
  });

  it('waits while the band starts', () => {
    const { container } = render(Plan, { hud: idle, playing: true });
    expect(name(container)).toHaveTextContent(/^…$/);
  });

  it('heads with the section heard and its bar in it, counted from 1 of the section’s bars (finite: every bar of a section)', () => {
    for (let i = 0; i < SECTION_BARS; i++) {
      const { container, unmount } = render(Plan, { hud: hudAt(SECTION_BARS + i), playing: true });
      expect(name(container)).toHaveTextContent(`Groove · bar ${i + 1} of ${SECTION_BARS}`);
      unmount();
    }
    const { container } = render(Plan, { hud: hudAt(9), playing: true });
    expect(name(container)).toHaveTextContent('Groove · bar 2 of 8');
    // The bar in the section is said once on the page, which the end-to-end checks rely on.
    expect(screen.getAllByText(/bar 2 of 8/i)).toHaveLength(1);
  });

  it('says the key heard, and the key the band is heading for where it differs', () => {
    const same = render(Plan, { hud: hudAt(9), playing: true });
    expect(sub(same.container)).toHaveTextContent(/^A minor$/);
    same.unmount();
    const moving = render(Plan, {
      hud: hudAt(9, { heading: { tonic: 4, mode: 'aeolian' } }),
      playing: true,
    });
    expect(sub(moving.container)).toHaveTextContent(/^A minor → E minor$/);
  });

  it('shows the bars ahead to the end of the next section, whole, wherever in its section the bar heard is (finite: every bar of a section)', () => {
    for (let i = 0; i < SECTION_BARS; i++) {
      const hud = hudAt(SECTION_BARS + i);
      const { unmount } = render(Plan, { hud, playing: true });
      const ahead = screen.getByRole('list', { name: /bars ahead/ });
      expect(within(ahead).getAllByRole('listitem')).toHaveLength(2 * SECTION_BARS - 1 - i);
      unmount();
    }
  });

  it('shows the song map, ringing the bar heard once something is, and naming a new key where it comes', () => {
    const sections: SectionView[] = [1, 2, 3, 4].map((index) => ({
      index,
      section: 'Groove',
      key: index < 3 ? 'A minor' : 'E minor',
      newKey: index === 3,
      bars: Array.from({ length: SECTION_BARS }, (_, i) => bar(index * SECTION_BARS + i)),
    }));
    const playing = render(Plan, { hud: hudAt(9, { sections }), playing: true });
    const map = screen.getByRole('list', { name: /Song plan/ });
    expect(within(map).getByText('Groove, E minor')).toBeInTheDocument();
    expect(within(map).getAllByText('Groove')).toHaveLength(3);
    expect(playing.container.querySelectorAll('.bars i.cur')).toHaveLength(1);
    playing.unmount();
    const waiting = render(Plan, { hud: { ...idle, sections }, playing: true });
    expect(waiting.container.querySelectorAll('.bars i.cur')).toHaveLength(0);
  });
});
