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
  style: { preset: 'Synth-pop', glide: null },
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

  it('lays the bar’s chords on a ruler where each starts, the one sounding lit once heard', () => {
    const two = bar(9, {
      chords: [
        { step: 0, symbol: 'Dm7', numeral: 'iv7' },
        { step: 8, symbol: 'E7', numeral: 'V7' },
      ],
    });
    const sounding = render(Chords, { hud: { ...hudOf(two, 3), chord: two.chords[1]! } });
    const ruler = screen.getByRole('img', { name: "The bar's chords: Dm7 E7" });
    expect([...ruler.querySelectorAll('text')].map((t) => t.textContent)).toEqual(['Dm7', 'E7']);
    expect([...ruler.querySelectorAll('.mark')].map((m) => m.classList.contains('lit'))).toEqual([
      false,
      true,
    ]);
    sounding.unmount();
    render(Chords, { hud: hudOf(two, null) });
    const waiting = screen.getByRole('img', { name: "The bar's chords: Dm7 E7" });
    expect(waiting.querySelectorAll('.mark.lit')).toHaveLength(0);
  });

  it('leaves the key and its notes to the key card', () => {
    const { container } = render(Chords, { hud: heard });
    expect(container.querySelector('.reading')).toBeNull();
    expect(screen.queryByText('A B C D E F G')).toBeNull();
  });

  it('says in its Conductor region what the lead is doing in the bar heard, and before the start that the band plays on its own', () => {
    const lead = () => within(screen.getByRole('region', { name: 'Conductor' }));
    const idleView = render(Chords, { hud: idle });
    expect(lead().getByText('The band plays on its own once started.')).toBeInTheDocument();
    idleView.unmount();
    const improvising = render(Chords, { hud: heard });
    expect(lead().getByText('Lead is improvising.')).toHaveAttribute('aria-live', 'polite');
    improvising.unmount();
    const resting = { ...heard, bar: { ...groove, lead: 'resting' as const } };
    render(Chords, { hud: resting });
    expect(lead().getByText('Lead is resting.')).toBeInTheDocument();
  });

  it('says the lead plays a motif, whose, and which bar it was heard in, counted from 1', () => {
    const motif = { source: 'the computer keys', name: 'the computer keys', colour: 0, bar: 6 };
    const playingMotif = { ...heard, bar: bar(9, { lead: 'motif', motif }) };
    render(Chords, { hud: playingMotif });
    expect(
      within(screen.getByRole('region', { name: 'Conductor' })).getByText(
        'Lead is playing the motif from the computer keys, heard in bar 7.',
      ),
    ).toBeInTheDocument();
  });
});
