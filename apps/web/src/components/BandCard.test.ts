import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { Performer } from '../sounding.ts';
import type { PerformerView, PlayerView, TracksView } from '../tracks.ts';
import BandCard from './BandCard.svelte';

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
  level: 1,
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
  local: false,
  notes: [{ step: 2, note: 64, length: 2 }],
  taken: null,
  ...over,
});

const draw = (view: TracksView, ontoggle = vi.fn(), onlevel = vi.fn()) =>
  render(BandCard, { tracks: view, ontoggle, onlevel });

describe('the band', () => {
  it('draws a lane for each band performer and each other player, a player’s under the part it plays', () => {
    draw(
      tracks({
        players: [
          lane(),
          lane({ part: 'drums', source: '@c1/the drum pads', name: "Ada's drum pads" }),
          lane({ source: 'the keys', name: 'the keys', local: true }),
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

  it('names itself in its own header, open, over how many of the performers sound and the lead’s status', () => {
    draw(tracks());
    const card = screen.getByLabelText('Band');
    expect(card).toHaveAttribute('open');
    expect(card.querySelector('summary .title')).toHaveTextContent('Band');
    expect(card.querySelector('summary .main')).toHaveTextContent('4 of 4 sound');
    expect(card.querySelector('summary .sub')).toHaveTextContent('Lead is improvising.');
  });

  it('counts the performers that sound here, a muted one not among them', () => {
    draw(
      tracks({
        performers: [
          performer('drums', 'Drums', { sounds: false, muted: true }),
          performer('bass', 'Bass'),
          performer('comp', 'Chords'),
          performer('lead', 'Lead', { sounds: false }),
        ],
      }),
    );
    expect(screen.getByLabelText('Band').querySelector('summary .main')).toHaveTextContent(
      '2 of 4 sound',
    );
  });

  it('has nothing to select: a performer is named, not a button, and none is pressed', () => {
    draw(tracks());
    for (const label of ['Drums', 'Bass', 'Chords', 'Lead'])
      expect(screen.queryByRole('button', { name: label })).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(document.querySelector('.selected')).toBeNull();
  });

  it('leaves the instrument to the play card', () => {
    draw(tracks());
    expect(screen.queryByText(/instrument/)).toBeNull();
    expect(screen.queryByRole('group', { name: 'On-screen keyboard' })).toBeNull();
  });

  it('shows each performer’s track first, its faders only once the volume glyph is pressed, and back', async () => {
    draw(tracks());
    expect(screen.queryByRole('slider')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Show Bass faders' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await fireEvent.click(toggle);
    expect(screen.getByRole('slider', { name: 'Bass volume' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Bass, bars 7 to 10' })).toBeNull();
    // The other tracks keep their lanes: one pill opens, not all.
    expect(screen.getByRole('img', { name: 'Drums, bars 7 to 10' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Show Bass track' }));
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByRole('img', { name: 'Bass, bars 7 to 10' })).toBeInTheDocument();
  });

  it('gives each performer a volume slider, showing its level and setting it', async () => {
    const onlevel = vi.fn();
    draw(
      tracks({
        performers: [performer('drums', 'Drums'), performer('bass', 'Bass', { level: 0.4 })],
      }),
      vi.fn(),
      onlevel,
    );
    await fireEvent.click(screen.getByRole('button', { name: 'Show Drums faders' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Show Bass faders' }));
    expect(screen.getByRole('slider', { name: 'Drums volume' })).toHaveValue('100');
    const bass = screen.getByRole('slider', { name: 'Bass volume' });
    expect(bass).toHaveValue('40');
    await fireEvent.input(bass, { target: { value: '75' } });
    expect(onlevel).toHaveBeenCalledWith('bass', 0.75);
  });

  it('moves the fader to none while its track is muted or left out of a solo', async () => {
    draw(
      tracks({
        performers: [
          performer('drums', 'Drums', { level: 0.8, muted: true, sounds: false }),
          performer('bass', 'Bass', { level: 0.4, sounds: false }),
          performer('lead', 'Lead', { level: 0.6, soloed: true }),
        ],
      }),
    );
    for (const name of ['Drums', 'Bass', 'Lead'])
      await fireEvent.click(screen.getByRole('button', { name: `Show ${name} faders` }));
    expect(screen.getByRole('slider', { name: 'Drums volume' })).toHaveValue('0');
    expect(screen.getByRole('slider', { name: 'Bass volume' })).toHaveValue('0');
    expect(screen.getByRole('slider', { name: 'Lead volume' })).toHaveValue('60');
  });

  it('draws every track as one row of the same height, in one stack', () => {
    const { container } = draw(tracks({ players: [lane()] }));
    expect(container.querySelectorAll('.pill')).toHaveLength(5);
    expect(container.querySelector('svg.lane.tall')).toBeNull();
  });

  it('draws a small roll of the performers as its glyph, with the playhead', () => {
    const { container } = draw(tracks());
    expect(container.querySelectorAll('summary svg.glyph g.row')).toHaveLength(4);
    expect(container.querySelector('summary svg.glyph line.head')).not.toBeNull();
  });

  it('mutes and solos a band performer on this device, and shows which are', async () => {
    const ontoggle = vi.fn();
    draw(tracks({ performers: [performer('bass', 'Bass', { muted: true })] }), ontoggle);
    await fireEvent.click(screen.getByRole('button', { name: 'Show Bass faders' }));
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
    const grid = screen.getByRole('group', { name: 'Band grid' });
    expect(within(grid).getByText("Ada's computer keys")).toBeInTheDocument();
    expect(within(grid).queryByRole('button', { name: "Ada's computer keys" })).toBeNull();
  });
});
