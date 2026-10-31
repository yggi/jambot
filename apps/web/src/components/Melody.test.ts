import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { PerformerView, TracksView } from '../tracks.ts';
import Melody from './Melody.svelte';

const lead = (notes: PerformerView['notes']): PerformerView => ({
  performer: 'lead',
  label: 'Lead',
  status: 'Playing.',
  sounding: [],
  notes,
  motifs: [],
  muted: false,
  soloed: false,
  sounds: true,
  level: 1,
});

const tracks = (over: Partial<TracksView> = {}): TracksView => ({
  first: 0,
  frame: [0, 16, 32, 48, 64].map((start) => ({ start, steps: 16, pulses: [start] })),
  span: 80,
  playhead: 36,
  performers: [
    lead([
      { step: 40, note: 69, length: 2 },
      { step: 30, note: 72, length: 2 },
    ]),
  ],
  players: [],
  ...over,
});

const props = (over = {}) => ({
  tracks: tracks(),
  bar: { key: 'A minor', melodic: [9, 11, 0, 2, 4, 5, 7], melodicName: 'plain' as const },
  chord: { step: 0, symbol: 'Am', numeral: 'i', notes: [] },
  down: new Set<number>(),
  sounding: [],
  onnote: () => {},
  ...over,
});

const keys = () =>
  within(screen.getByRole('group', { name: 'On-screen keyboard' })).getAllByRole('button');

describe('the melody view', () => {
  it('has the piano from C4 to E5 under a roll of the lead, a note ahead outlined and one played filled', () => {
    const { container } = render(Melody, props());
    expect(keys()).toHaveLength(17);
    expect(
      screen.getByRole('img', { name: 'The lead, falling onto the keys' }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.note.foreseen.chevron')).toHaveLength(1);
    expect(container.querySelectorAll('.note.played.chevron')).toHaveLength(1);
  });

  it('says the chord and the key it plays over', () => {
    render(Melody, props());
    expect(screen.getByText('Am · A minor')).toBeInTheDocument();
  });

  it('locks the keys to the scale: its notes alone, each named, and back', async () => {
    render(Melody, props());
    const lock = screen.getByRole('button', { name: 'Scale' });
    await fireEvent.click(lock);
    expect(lock).toHaveAttribute('aria-pressed', 'true');
    expect(keys().map((k) => k.getAttribute('aria-label'))).toEqual([
      'C4',
      'D4',
      'E4',
      'F4',
      'G4',
      'A4',
      'B4',
      'C5',
      'D5',
      'E5',
    ]);
    expect(keys()[0]).toHaveTextContent('C4');
    await fireEvent.click(lock);
    expect(keys()).toHaveLength(17);
  });

  it('moves the keys and the roll an octave either way, two at most', async () => {
    render(Melody, props());
    await fireEvent.click(screen.getByRole('button', { name: 'Octave up' }));
    expect(screen.getByText('C5–E6')).toBeInTheDocument();
    expect(keys()[0]).toHaveAttribute('aria-label', 'C5');
    await fireEvent.click(screen.getByRole('button', { name: 'Octave up' }));
    expect(screen.getByRole('button', { name: 'Octave up' })).toBeDisabled();
    for (let i = 0; i < 4; i++)
      await fireEvent.click(screen.getByRole('button', { name: 'Octave down' }));
    expect(screen.getByText('C2–E3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Octave down' })).toBeDisabled();
  });

  it('plays the key struck', async () => {
    const onnote = vi.fn();
    render(Melody, props({ onnote }));
    await fireEvent.pointerDown(screen.getByRole('button', { name: 'A4' }), { pointerId: 1 });
    expect(onnote).toHaveBeenCalledWith(69, 100, true);
  });

  it('fills a note with its pitch’s colour and outlines it in its player’s: the band amber, a player theirs', () => {
    const { container } = render(
      Melody,
      props({
        tracks: tracks({
          players: [
            {
              part: 'lead',
              source: 'k',
              name: 'the keys',
              colour: 2,
              heardAs: false,
              local: true,
              notes: [{ step: 33, note: 64, length: 2 }],
              taken: null,
            },
          ],
        }),
      }),
    );
    const own = container.querySelector<SVGPathElement>('.note.own.chevron')!;
    // E4: E's hue (120) in the middle octave, outlined in the player's colour.
    expect(own.style.fill).toMatch(/^hsl\(120 /);
    expect(own).toHaveAttribute('stroke', 'var(--source-2)');
    for (const band of container.querySelectorAll('.note.played, .note.foreseen'))
      expect(band).toHaveAttribute('stroke', 'var(--voice-lead)');
  });

  it('lays the chords and the bass faint behind the lead, as pills and blocks, where the keys reach them', () => {
    const voice = (performer: 'comp' | 'bass', note: number, sounds = true): PerformerView => ({
      ...lead([{ step: 32, note, length: 8 }]),
      performer,
      label: performer,
      sounds,
    });
    const { container, unmount } = render(
      Melody,
      props({
        tracks: tracks({
          performers: [
            ...tracks().performers,
            voice('comp', 64),
            voice('bass', 62),
            voice('bass', 40),
          ],
        }),
      }),
    );
    expect(container.querySelectorAll('.note.backing.pill')).toHaveLength(1);
    expect(container.querySelectorAll('.note.backing.block')).toHaveLength(1);
    unmount();
    const muted = render(
      Melody,
      props({ tracks: tracks({ performers: [...tracks().performers, voice('comp', 64, false)] }) }),
    );
    expect(muted.container.querySelectorAll('.note.backing')).toHaveLength(0);
  });

  it('draws nothing on the roll before anything is heard', () => {
    const { container } = render(Melody, props({ tracks: tracks({ playhead: null }) }));
    expect(container.querySelectorAll('.note')).toHaveLength(0);
  });
});
