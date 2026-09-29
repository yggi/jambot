import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { Performer } from '../sounding.ts';
import type { PerformerView, PlayerView, TracksView } from '../tracks.ts';
import Tracks from './Tracks.svelte';

const performer = (p: Performer, label: string, over: Partial<PerformerView> = {}) => ({
  performer: p,
  label,
  status: p === 'lead' ? 'Lead is improvising.' : 'Playing Techno.',
  sounding: [],
  notes: [{ step: 4, note: 60, length: 2 }],
  motifs: [],
  muted: false,
  soloed: false,
  sounds: true,
  ...over,
});

const ada = { source: '@c1/the computer keys', name: "Ada's computer keys", colour: 1, bar: 6 };

const tracks = (over: Partial<TracksView> = {}): TracksView => ({
  first: 6,
  playhead: 40,
  performers: [
    performer('drums', 'Drums'),
    performer('bass', 'Bass'),
    performer('comp', 'Chords'),
    performer('lead', 'Lead'),
  ],
  players: [],
  ...over,
});

const lane = (over: Partial<PlayerView> = {}): PlayerView => ({
  part: 'lead',
  source: ada.source,
  name: ada.name,
  colour: 1,
  heardAs: false,
  notes: [{ step: 2, note: 64, length: 2 }],
  taken: null,
  ...over,
});

/** The instrument a track is played on, named by its performer. */
const instrument = createRawSnippet((performer: () => Performer) => ({
  render: () => `<p>the ${performer()} instrument</p>`,
}));

const draw = (view: TracksView, ontoggle = vi.fn()) =>
  render(Tracks, { tracks: view, ontoggle, instrument });

describe('the tracks', () => {
  it('draws a lane for each band performer and each player, a player’s under the part it plays', () => {
    draw(
      tracks({
        players: [
          lane(),
          lane({ part: 'drums', source: '@c1/the drum pads', name: "Ada's drum pads" }),
        ],
      }),
    );
    const lanes = screen.getAllByRole('img').map((l) => l.getAttribute('aria-label'));
    expect(lanes).toEqual([
      'Drums, bars 7 to 10',
      "Ada's drum pads, bars 7 to 10",
      'Bass, bars 7 to 10',
      'Chords, bars 7 to 10',
      'Lead, bars 7 to 10',
      "Ada's computer keys, bars 7 to 10",
    ]);
  });

  it('numbers the bars shown, counted from 1', () => {
    const { container } = draw(tracks());
    expect([...container.querySelectorAll('.bars li')].map((li) => li.textContent)).toEqual([
      '7',
      '8',
      '9',
      '10',
    ]);
  });

  it('selects the lead first, with its status in the headline and its instrument below', () => {
    draw(tracks());
    const card = screen.getByLabelText('Tracks');
    expect(card).toHaveAttribute('open');
    expect(card.querySelector('summary .main')).toHaveTextContent('Lead');
    expect(card.querySelector('summary .sub')).toHaveTextContent('Lead is improvising.');
    expect(screen.getByRole('button', { name: 'Lead' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('the lead instrument')).toBeInTheDocument();
  });

  it('selects one track at a time, and shows its instrument in place of the one before', async () => {
    draw(tracks());
    await fireEvent.click(screen.getByRole('button', { name: 'Drums' }));
    expect(screen.getByRole('button', { name: 'Drums' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Lead' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('the drums instrument')).toBeInTheDocument();
    expect(screen.queryByText('the lead instrument')).toBeNull();
  });

  it('says how many notes the selected track sounds here, or that it is muted here', async () => {
    const { rerender } = draw(
      tracks({ performers: [performer('lead', 'Lead', { sounding: [60, 64] })] }),
    );
    expect(screen.getByText('2 notes')).toBeInTheDocument();
    await rerender({
      tracks: tracks({ performers: [performer('lead', 'Lead', { sounds: false })] }),
    });
    expect(screen.getByText('Muted here')).toBeInTheDocument();
  });

  it('mutes and solos a band performer on this device, and shows which are', async () => {
    const ontoggle = vi.fn();
    draw(tracks({ performers: [performer('bass', 'Bass', { muted: true })] }), ontoggle);
    const mute = screen.getByRole('button', { name: 'Mute Bass' });
    const solo = screen.getByRole('button', { name: 'Solo Bass' });
    expect(mute).toHaveAttribute('aria-pressed', 'true');
    expect(solo).toHaveAttribute('aria-pressed', 'false');
    await fireEvent.click(solo);
    expect(ontoggle).toHaveBeenCalledWith('soloed', 'bass');
    await fireEvent.click(mute);
    expect(ontoggle).toHaveBeenCalledWith('muted', 'bass');
  });

  it('credits the lead’s bars that played a motif, tinted in the player’s colour, and says whose', () => {
    const { container } = draw(
      tracks({
        performers: [
          performer('lead', 'Lead', {
            motifs: [
              { at: 2, credit: ada },
              { at: 3, credit: ada },
            ],
          }),
        ],
      }),
    );
    expect(screen.getByText("from Ada's computer keys, bar 7")).toBeInTheDocument();
    const tinted = [...container.querySelectorAll('rect.credited')];
    expect(tinted.map((r) => (r as SVGElement).style.fill)).toEqual([
      'var(--source-1)',
      'var(--source-1)',
    ]);
  });

  it('credits nothing where the lead played no motif', () => {
    const { container } = draw(tracks());
    expect(screen.queryByText(/^from /)).toBeNull();
    expect(container.querySelector('rect.credited')).toBeNull();
  });

  it('outlines the bar the Muse took in a player’s lane, in the player’s colour', () => {
    const { container } = draw(tracks({ players: [lane({ taken: 1 })] }));
    const taken = container.querySelector('rect.taken') as SVGElement;
    expect(taken.style.stroke).toBe('var(--source-1)');
    expect(Number(taken.getAttribute('x'))).toBeCloseTo(160 + 1);
  });

  it('puts the playhead on the step heard, in every lane', () => {
    const { container } = draw(tracks({ players: [lane()] }));
    const heads = [...container.querySelectorAll('line.playhead')];
    expect(heads).toHaveLength(5);
    for (const head of heads) expect(Number(head.getAttribute('x1'))).toBeCloseTo((40 / 64) * 640);
  });

  it('draws no playhead before anything is heard', () => {
    const { container } = draw(tracks({ playhead: null }));
    expect(container.querySelector('line.playhead')).toBeNull();
  });

  it('names a player by name alone in the grid, where no button would select it', () => {
    draw(tracks({ players: [lane()] }));
    const grid = screen.getByRole('group', { name: 'Tracks grid' });
    expect(within(grid).getByText("Ada's computer keys")).toBeInTheDocument();
    expect(within(grid).queryByRole('button', { name: "Ada's computer keys" })).toBeNull();
  });
});
