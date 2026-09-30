import { SONG_METER } from '@jambot/engine';
import { METERS } from '@jambot/theory';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Chords from './Chords.svelte';
import type { BarView, Hud } from '../hud.ts';

const bar = (n: number, over: Partial<BarView> = {}): BarView => ({
  bar: n,
  barInSection: n % 8,
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
const hudOf = (here: BarView, beat: number | null, over: Partial<Hud> = {}): Hud => ({
  bar: here,
  beat,
  chord: here.chords[0]!,
  next: [],
  sections: [],
  style: {
    preset: 'Synth-pop',
    glide: null,
    axes: { swing: 0, sync: 0, harm: 0, artic: 0, energy: 0, entropy: 0 },
  },
  heading: { tonic: 9, mode: 'aeolian' },
  headingMelodic: 'plain',
  muse: { motif: null, log: [] },
  ...over,
});
const groove = bar(9);
const heard = hudOf(groove, 2);
const opening = bar(0, { section: 'Intro', chords: [{ step: 0, symbol: 'Am', numeral: 'i' }] });
const idle = hudOf(opening, null);

const name = (container: HTMLElement) => container.querySelector('summary .main');

describe('the chords', () => {
  it('names itself in its own header, folded by default, over the chord sounding and its numeral', () => {
    const { container } = render(Chords, { hud: heard });
    expect(container.querySelector('summary .title')).toHaveTextContent('Chords');
    expect(name(container)).toHaveTextContent(/^Am7 · i7$/);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('shows the chord the band opens on before anything is heard, and none past what is decided', () => {
    const before = render(Chords, { hud: idle });
    expect(name(before.container)).toHaveTextContent(/^Am · i$/);
    before.unmount();
    const past = render(Chords, { hud: { ...heard, bar: null, chord: null } });
    expect(name(past.container)).toHaveTextContent(/^—$/);
  });

  it('draws one dot per beat of the song’s meter, lit up to the beat heard', () => {
    const { container } = render(Chords, { hud: heard });
    expect(container.querySelectorAll('.beats i')).toHaveLength(SONG_METER.heights.length);
    expect(container.querySelectorAll('.beats i')).toHaveLength(4);
    expect(container.querySelectorAll('.beats i.on')).toHaveLength(3);
  });

  it('draws one dot per beat of any meter, none lit before anything is heard (finite: every named meter)', () => {
    for (const meter of Object.values(METERS)) {
      const beats = meter.heights.length;
      for (const beat of [null, ...Array(beats).keys()]) {
        const { container, unmount } = render(Chords, { hud: hudOf(groove, beat), meter });
        expect(container.querySelectorAll('.beats i')).toHaveLength(beats);
        expect(container.querySelectorAll('.beats i.on')).toHaveLength(
          beat === null ? 0 : beat + 1,
        );
        unmount();
      }
    }
  });

  it('leaves the key, its notes and the lead’s status to the key card and the tracks', () => {
    const { container } = render(Chords, { hud: heard });
    expect(container.querySelector('.reading')).toBeNull();
    expect(screen.queryByText('A B C D E F G')).toBeNull();
    expect(screen.queryByText(/^Lead is /)).toBeNull();
    expect(screen.queryByRole('region', { name: 'Conductor' })).toBeNull();
  });

  describe('the chord that comes next', () => {
    const two = bar(9, {
      chords: [
        { step: 0, symbol: 'Dm7', numeral: 'iv7' },
        { step: 8, symbol: 'E7', numeral: 'V7' },
      ],
    });
    const sub = (container: HTMLElement) => container.querySelector('summary .sub');

    it('is said under the chord sounding: the next in the bar, else the first of the next bar', () => {
      const first = render(Chords, { hud: hudOf(two, 0) });
      expect(sub(first.container)).toHaveTextContent(/^then E7 · V7$/);
      first.unmount();
      const last = render(Chords, {
        hud: {
          ...hudOf(two, 3),
          chord: two.chords[1]!,
          next: [bar(10, { chords: [{ step: 0, symbol: 'Gmaj7', numeral: 'VII' }] })],
        },
      });
      expect(sub(last.container)).toHaveTextContent(/^then Gmaj7 · VII$/);
    });

    it('is said before anything is heard, from the chord the band opens on, and not past what is decided', () => {
      const before = render(Chords, {
        hud: { ...idle, next: [bar(1, { chords: [{ step: 0, symbol: 'G', numeral: 'VII' }] })] },
      });
      expect(sub(before.container)).toHaveTextContent(/^then G · VII$/);
      before.unmount();
      const past = render(Chords, { hud: heard });
      expect(sub(past.container)).toHaveTextContent('');
    });
  });

  describe('its glyph', () => {
    const two = bar(9, {
      chords: [
        { step: 0, symbol: 'Dm7', numeral: 'iv7' },
        { step: 8, symbol: 'E7', numeral: 'V7' },
      ],
    });

    it('is a block for each chord of the bar, the one sounding lit once heard', () => {
      const sounding = render(Chords, { hud: { ...hudOf(two, 3), chord: two.chords[1]! } });
      const blocks = [...sounding.container.querySelectorAll('summary svg.glyph rect.chord')];
      expect(blocks.map((b) => b.classList.contains('lit'))).toEqual([false, true]);
      expect(sounding.container.querySelector('summary svg.glyph line.head')).not.toBeNull();
      sounding.unmount();
      const waiting = render(Chords, { hud: hudOf(two, null) });
      expect(waiting.container.querySelectorAll('summary svg.glyph rect.lit')).toHaveLength(0);
      expect(waiting.container.querySelector('summary svg.glyph line.head')).toBeNull();
    });
  });

  describe('its details', () => {
    const ahead = (n: number, count: number) =>
      Array.from({ length: count }, (_, i) => bar(n + 1 + i));

    it('are the bars by chord: the bar heard and the next large, six more, eight in all', () => {
      render(Chords, { hud: { ...heard, next: ahead(9, 7) } });
      const near = within(screen.getByRole('list', { name: 'The bar heard and the next' }));
      const far = within(screen.getByRole('list', { name: 'The bars after' }));
      expect(near.getAllByRole('listitem')).toHaveLength(2);
      expect(far.getAllByRole('listitem')).toHaveLength(6);
    });

    it('label a change of section at its bar', () => {
      render(Chords, {
        hud: {
          ...heard,
          next: [
            bar(10, { barInSection: 7 }),
            bar(11, { section: 'Drop', barInSection: 0 }),
            bar(12, { section: 'Drop', barInSection: 1 }),
          ],
        },
      });
      expect(screen.getAllByText('Drop')).toHaveLength(1);
    });
  });
});
