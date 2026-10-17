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
  chord: { step: 0, symbol: 'Am', numeral: 'i' },
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
    expect(container.querySelectorAll('rect.note.foreseen')).toHaveLength(1);
    expect(container.querySelectorAll('rect.note.played')).toHaveLength(1);
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

  it('draws a player’s notes in their colour', () => {
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
    const own = container.querySelector('rect.note.own');
    expect(own).toHaveAttribute('fill', 'var(--source-2)');
  });

  it('draws nothing on the roll before anything is heard', () => {
    const { container } = render(Melody, props({ tracks: tracks({ playhead: null }) }));
    expect(container.querySelectorAll('rect.note')).toHaveLength(0);
  });
});
