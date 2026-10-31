import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { Performer } from '../sounding.ts';
import type { BarFrame, PerformerView, PlayerView, TracksView } from '../tracks.ts';
import BandCard from './BandCard.svelte';

/** `bars` bars of 4/4 laid end to end, as `tracksOf` frames them. */
const framed = (bars: number): BarFrame[] =>
  Array.from({ length: bars }, (_, i) => ({
    start: i * 16,
    steps: 16,
    pulses: [0, 4, 8, 12].map((p) => i * 16 + p),
  }));

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
  frame: framed(5),
  span: 80,
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
  it('draws every voice on one roll, with a chip for each performer and each player in the session', () => {
    draw(
      tracks({
        players: [
          lane(),
          lane({ part: 'drums', source: '@c1/the drum pads', name: "Ada's drum pads" }),
          lane({ source: 'the keys', name: 'the keys', local: true }),
        ],
      }),
    );
    expect(screen.getByRole('img', { name: 'The band, bars 7 to 11' })).toBeInTheDocument();
    const voices = within(screen.getByRole('group', { name: 'Voices' }));
    expect(voices.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Show Drums faders',
      'Show Bass faders',
      'Show Chords faders',
      'Show Lead faders',
    ]);
    for (const name of ["Ada's computer keys", "Ada's drum pads", 'the keys'])
      expect(voices.getByText(name)).toBeInTheDocument();
  });

  it('numbers the bars shown, counted from 1', () => {
    const { container } = draw(tracks());
    expect([...container.querySelectorAll('.bars li')].map((li) => li.textContent)).toEqual([
      '7',
      '8',
      '9',
      '10',
      '11',
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

  it('shows a performer’s faders once its chip is pressed, one at a time, and back, the roll staying', async () => {
    draw(tracks());
    expect(screen.queryByRole('slider')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Show Bass faders' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('slider', { name: 'Bass volume' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Show Drums faders' }));
    expect(screen.queryByRole('slider', { name: 'Bass volume' })).toBeNull();
    expect(screen.getByRole('slider', { name: 'Drums volume' })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Show Drums track' }));
    expect(screen.queryByRole('slider')).toBeNull();
    expect(screen.getByRole('img', { name: 'The band, bars 7 to 11' })).toBeInTheDocument();
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
    expect(screen.getByRole('slider', { name: 'Drums volume' })).toHaveValue('100');
    await fireEvent.click(screen.getByRole('button', { name: 'Show Bass faders' }));
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
    for (const [name, value] of [
      ['Drums', '0'],
      ['Bass', '0'],
      ['Lead', '60'],
    ]) {
      await fireEvent.click(screen.getByRole('button', { name: `Show ${name} faders` }));
      expect(screen.getByRole('slider', { name: `${name} volume` })).toHaveValue(value);
    }
  });

  it('draws each performer’s chip with its shape in its voice’s colour, and a player’s in theirs', () => {
    const { container } = draw(tracks({ players: [lane()] }));
    const shapes = [...container.querySelectorAll<SVGElement>('.mixer svg.shape')];
    expect(shapes.map((s) => s.style.stroke)).toEqual([
      'var(--voice-drums)',
      'var(--voice-bass)',
      'var(--voice-comp)',
      'var(--voice-lead)',
      'var(--source-1)',
    ]);
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

  it('credits the lead’s bars that played a motif, outlined in the player’s colour, and says whose', () => {
    const { container } = draw(
      tracks({
        performers: [
          performer('lead', 'Lead', {
            notes: [
              { step: 4, note: 72, length: 2 },
              { step: 36, note: 74, length: 2 },
              { step: 52, note: 76, length: 2 },
            ],
            motifs: [
              { at: 2, credit: ada },
              { at: 3, credit: ada },
            ],
          }),
        ],
      }),
    );
    expect(screen.getByText("from Ada's computer keys, bar 7")).toBeInTheDocument();
    const marks = [...container.querySelectorAll<SVGElement>('path.mark[data-voice="lead"]')];
    expect(marks.map((m) => m.style.stroke)).toEqual([
      'var(--voice-lead)',
      'var(--source-1)',
      'var(--source-1)',
    ]);
  });

  it('credits nothing where the lead played no motif', () => {
    const { container } = draw(tracks());
    expect(screen.queryByText(/^from /)).toBeNull();
    for (const mark of container.querySelectorAll<SVGElement>('path.mark'))
      expect(mark.style.stroke).toMatch(/^var\(--voice-/);
  });

  it('rings the bar the Muse took from a player, in the player’s colour', () => {
    const { container } = draw(tracks({ players: [lane({ taken: 1 })] }));
    const taken = container.querySelector('rect.taken') as SVGElement;
    expect(taken.style.stroke).toBe('var(--source-1)');
  });

  it('puts the playhead on the step heard', () => {
    const { container } = draw(tracks({ players: [lane()] }));
    expect(container.querySelectorAll('line.now')).toHaveLength(1);
  });

  it('draws no playhead before anything is heard', () => {
    const { container } = draw(tracks({ playhead: null }));
    expect(container.querySelector('line.now')).toBeNull();
  });

  it('names a player by name alone in the grid, where no button would select it', () => {
    draw(tracks({ players: [lane()] }));
    const grid = screen.getByRole('group', { name: 'Band grid' });
    expect(within(grid).getByText("Ada's computer keys")).toBeInTheDocument();
    expect(within(grid).queryByRole('button', { name: "Ada's computer keys" })).toBeNull();
  });

  it('numbers the bars over the lanes in columns as wide as the bars are long', () => {
    const frame: BarFrame[] = [
      { start: 0, steps: 16, pulses: [0, 4, 8, 12] },
      { start: 16, steps: 14, pulses: [16, 22, 26] },
      { start: 30, steps: 14, pulses: [30, 36, 40] },
      { start: 44, steps: 14, pulses: [44, 50, 54] },
      { start: 58, steps: 14, pulses: [58, 64, 68] },
    ];
    const { container } = render(BandCard, {
      tracks: tracks({ frame, span: 72 }),
      ontoggle: () => {},
      onlevel: () => {},
    });
    const columns = (container.querySelector('ol.bars') as HTMLElement).style.gridTemplateColumns;
    expect(columns).toBe('16fr 14fr 14fr 14fr 14fr');
  });
});
