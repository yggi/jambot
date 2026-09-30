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
  melodic: [0, 2, 4, 5, 7, 9, 11],
  melodicName: 'plain',
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
  style: {
    preset: 'Synth-pop',
    glide: null,
    axes: { swing: 0, sync: 0, harm: 0, artic: 0, energy: 0, entropy: 0 },
  },
  heading: { tonic: 9, mode: 'aeolian' },
  headingMelodic: 'plain',
  muse: { motif: null, log: [], memory: [], quiet: null },
  ...over,
});
const opening = bar(0, { section: 'Intro' });
const idle = hudAt(0, { bar: opening, beat: null, chord: opening.chords[0]! });

const name = (container: HTMLElement) => container.querySelector('summary .main');
const sub = (container: HTMLElement) => container.querySelector('summary .sub');

describe('the plan', () => {
  it('names itself in its own header, folded by default', () => {
    const { container } = render(Plan, { hud: hudAt(9), playing: true });
    expect(container.querySelector('summary .title')).toHaveTextContent('Plan');
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
      expect(name(container)).toHaveTextContent(`Groove ${i + 1}/${SECTION_BARS}`);
      unmount();
    }
    const { container } = render(Plan, { hud: hudAt(9), playing: true });
    expect(name(container)).toHaveTextContent('Groove 2/8');
    // The bar in the section is said once on the page, which the end-to-end checks rely on.
    expect(screen.getAllByText(/Groove 2\/8/)).toHaveLength(1);
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

  it('leaves the bars ahead, by chord, to the chords card', () => {
    render(Plan, { hud: hudAt(9), playing: true });
    expect(screen.queryByRole('list', { name: /bars ahead|The bar heard/ })).toBeNull();
    expect(screen.queryByText(/^Next \d+ bars?$/)).toBeNull();
  });

  const sectionsOf = (indices: number[], newKeyAt = -1): SectionView[] =>
    indices.map((index) => ({
      index,
      section: 'Groove',
      key: index < 3 ? 'A minor' : 'E minor',
      newKey: index === newKeyAt,
      bars: Array.from({ length: SECTION_BARS }, (_, i) => bar(index * SECTION_BARS + i)),
    }));

  it('shows the song map in two rows, ringing the bar heard once something is, and naming a new key where it comes', () => {
    const sections = sectionsOf([1, 2, 3, 4, 5], 3);
    const playing = render(Plan, { hud: hudAt(9, { sections }), playing: true });
    expect(
      within(screen.getByRole('list', { name: 'The section playing and the next' })).getAllByRole(
        'listitem',
      ),
    ).toHaveLength(2);
    expect(
      within(screen.getByRole('list', { name: 'The sections after' })).getAllByRole('listitem'),
    ).toHaveLength(3);
    expect(screen.getByText('Groove, E minor')).toBeInTheDocument();
    expect(screen.getAllByText('Groove')).toHaveLength(4);
    expect(playing.container.querySelectorAll('.bars i.cur')).toHaveLength(1);
    playing.unmount();
    const waiting = render(Plan, { hud: { ...idle, sections }, playing: true });
    expect(waiting.container.querySelectorAll('.bars i.cur')).toHaveLength(0);
  });

  describe('its glyph', () => {
    it('is a segment for each section shown, a mark on the one where the key changes', () => {
      const sections = sectionsOf([1, 2, 3, 4, 5], 3);
      const { container } = render(Plan, { hud: hudAt(9, { sections }), playing: true });
      expect(container.querySelectorAll('summary svg.glyph rect.seg')).toHaveLength(5);
      expect(container.querySelectorAll('summary svg.glyph circle.key')).toHaveLength(1);
    });

    it('fills the section playing as far as its bar, and is empty before anything is heard', () => {
      const sections = sectionsOf([1, 2, 3, 4, 5]);
      const fill = (n: number, hud: Partial<Hud> = {}) => {
        const { container, unmount } = render(Plan, {
          hud: hudAt(n, { sections, ...hud }),
          playing: true,
        });
        const width = container.querySelector('summary svg.glyph rect.fill')?.getAttribute('width');
        unmount();
        return width === undefined || width === null ? null : Number(width);
      };
      const first = fill(8);
      const fourth = fill(11);
      const last = fill(15);
      expect(first).not.toBeNull();
      expect(fourth!).toBeCloseTo(first! * 4, 6);
      expect(last!).toBeCloseTo(first! * 8, 6);
      expect(fill(0, { bar: opening, beat: null, chord: opening.chords[0]! })).toBeNull();
    });
  });
});
