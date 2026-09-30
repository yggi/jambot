import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import type { Performer } from '../sounding.ts';
import type { PerformerView, PlayerView, TracksView } from '../tracks.ts';
import Play from './Play.svelte';

const performer = (p: Performer, label: string, over: Partial<PerformerView> = {}) => ({
  performer: p,
  label,
  status: 'Playing.',
  sounding: [],
  notes: [{ step: 4, note: 60, length: 2 }],
  motifs: [],
  muted: false,
  soloed: false,
  sounds: true,
  level: 1,
  ...over,
});

const tracks = (over: Partial<TracksView> = {}): TracksView => ({
  first: 6,
  playhead: 40,
  performers: [
    performer('drums', 'Drums', { notes: [{ step: 0, note: 36, length: 1 }] }),
    performer('bass', 'Bass'),
    performer('comp', 'Chords'),
    performer('lead', 'Lead', { notes: [{ step: 4, note: 60, length: 2 }] }),
  ],
  players: [],
  ...over,
});

const own = (part: 'lead' | 'drums', over: Partial<PlayerView> = {}): PlayerView => ({
  part,
  source: `the ${part} keys`,
  name: `the ${part} keys`,
  colour: 2,
  heardAs: false,
  local: true,
  notes: [{ step: 8, note: part === 'lead' ? 67 : 38, length: 2 }],
  taken: null,
  ...over,
});

/** The instrument a track is played on, named by its part. */
const instrument = createRawSnippet((part: () => string) => ({
  render: () => `<p>the ${part()} instrument</p>`,
}));

const draw = (view: TracksView, held = { lead: false, drums: false }) =>
  render(Play, { tracks: view, instrument, held });

const lanes = () => screen.getAllByRole('img').map((l) => l.getAttribute('aria-label'));

describe('the play card', () => {
  it('names itself in its own header, open, with the track chosen in its summary, the lead first', () => {
    const { container } = draw(tracks());
    const card = screen.getByLabelText('Play');
    expect(card).toHaveAttribute('open');
    expect(container.querySelector('summary .title')).toHaveTextContent('Play');
    const choice = screen.getByRole('radiogroup', { name: 'Track' });
    expect(choice.closest('summary')).not.toBeNull();
    expect(screen.getByRole('radio', { name: 'Lead' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Drums' })).toHaveAttribute('aria-checked', 'false');
  });

  it('offers the lead and the drums, for now', () => {
    draw(tracks());
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual(['Lead', 'Drums']);
  });

  it('shows the track chosen and its instrument, and the other’s in its place when it is chosen', async () => {
    draw(tracks());
    expect(lanes()).toEqual(['Lead track, bars 7 to 10']);
    expect(screen.getByText('the lead instrument')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('radio', { name: 'Drums' }));
    expect(lanes()).toEqual(['Drums track, bars 7 to 10']);
    expect(screen.getByText('the drums instrument')).toBeInTheDocument();
    expect(screen.queryByText('the lead instrument')).toBeNull();
  });

  it('changes the track without folding or unfolding the card', async () => {
    draw(tracks());
    await fireEvent.click(screen.getByRole('radio', { name: 'Drums' }));
    expect(screen.getByLabelText('Play')).toHaveAttribute('open');
  });

  it('says what the track chosen sounds, or that it is muted or silent', async () => {
    const view = (over: Partial<PerformerView>) =>
      tracks({ performers: [performer('lead', 'Lead', over), performer('drums', 'Drums')] });
    const { container, rerender } = draw(view({ sounding: [60, 64] }));
    const sub = () => container.querySelector('summary .sub');
    expect(sub()).toHaveTextContent('Lead: 2 notes');
    await rerender({ tracks: view({ sounding: [60] }) });
    expect(sub()).toHaveTextContent('Lead: 1 note');
    await rerender({ tracks: view({ sounding: [] }) });
    expect(sub()).toHaveTextContent('Lead: silent');
    await rerender({ tracks: view({ sounds: false }) });
    expect(sub()).toHaveTextContent('Lead: muted here');
  });

  describe('its rows', () => {
    it('are the track chosen alone until the player plays on the other', () => {
      draw(tracks({ players: [own('lead')] }));
      expect(lanes()).toEqual(['Lead track, bars 7 to 10']);
    });

    it('are both tracks, the lead first and the drums second, when the player has played on both', () => {
      draw(tracks({ players: [own('drums'), own('lead')] }));
      expect(lanes()).toEqual(['Lead track, bars 7 to 10', 'Drums track, bars 7 to 10']);
      expect(screen.getAllByText(/instrument$/).map((p) => p.textContent)).toEqual([
        'the lead instrument',
        'the drums instrument',
      ]);
    });

    it('are both when the drums are chosen and the player has played the lead, in the same order', async () => {
      draw(tracks({ players: [own('lead')] }));
      await fireEvent.click(screen.getByRole('radio', { name: 'Drums' }));
      expect(lanes()).toEqual(['Lead track, bars 7 to 10', 'Drums track, bars 7 to 10']);
    });

    it('do not count another player’s cell as this player’s playing', () => {
      draw(tracks({ players: [own('drums', { local: false, heardAs: true })] }));
      expect(lanes()).toEqual(['Lead track, bars 7 to 10']);
    });
  });

  describe('its track', () => {
    it('draws the band’s part dim under the player’s own notes, bright', () => {
      const { container } = draw(tracks({ players: [own('lead')] }));
      expect(container.querySelectorAll('svg.lane rect.note.under')).toHaveLength(1);
      const bright = container.querySelectorAll('svg.lane rect.note:not(.under)');
      expect(bright).toHaveLength(1);
      expect((bright[0] as SVGElement).style.fill).toBe('var(--source-2)');
    });

    it('draws only the band’s part, dim, while the player has played nothing', () => {
      const { container } = draw(tracks());
      expect(container.querySelectorAll('svg.lane rect.note.under')).toHaveLength(1);
      expect(container.querySelectorAll('svg.lane rect.note:not(.under)')).toHaveLength(0);
    });

    it('draws every source the player played on the part, on the one lane', () => {
      const { container } = draw(
        tracks({ players: [own('lead'), own('lead', { source: 'the pads', name: 'the pads' })] }),
      );
      expect(container.querySelectorAll('svg.lane rect.note:not(.under)')).toHaveLength(2);
      expect(container.querySelectorAll('svg.lane')).toHaveLength(1);
    });

    it('has the playhead, and is tall', () => {
      const { container } = draw(tracks());
      expect(container.querySelector('svg.lane')).toHaveClass('tall');
      expect(container.querySelector('svg.lane line.playhead')).not.toBeNull();
    });
  });

  describe('its glyph', () => {
    it('is the keys for the lead and the pads for the drums, following the choice', async () => {
      const { container } = draw(tracks());
      expect(container.querySelectorAll('summary svg.glyph rect.white')).toHaveLength(5);
      await fireEvent.click(screen.getByRole('radio', { name: 'Drums' }));
      expect(container.querySelectorAll('summary svg.glyph rect.pad')).toHaveLength(4);
    });

    it('lights while a note is held on the track chosen', async () => {
      const { container, rerender } = draw(tracks(), { lead: true, drums: false });
      expect(container.querySelector('summary svg.glyph')).toHaveClass('lit');
      await fireEvent.click(screen.getByRole('radio', { name: 'Drums' }));
      expect(container.querySelector('summary svg.glyph')).not.toHaveClass('lit');
      await rerender({ held: { lead: false, drums: true } });
      expect(container.querySelector('summary svg.glyph')).toHaveClass('lit');
    });
  });
});
