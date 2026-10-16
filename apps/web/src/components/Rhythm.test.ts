import { DRUM_NOTES } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { PerformerView, TracksView } from '../tracks.ts';
import Rhythm from './Rhythm.svelte';

const { kick, snare } = DRUM_NOTES;

const drums = (notes: PerformerView['notes']): PerformerView => ({
  performer: 'drums',
  label: 'Drums',
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
  frame: [0, 16, 32, 48, 64].map((start) => ({
    start,
    steps: 16,
    pulses: [0, 4, 8, 12].map((p) => start + p),
  })),
  span: 80,
  playhead: 36,
  performers: [
    drums([
      { step: 32, note: kick, length: 1 },
      { step: 36, note: snare, length: 1 },
    ]),
  ],
  players: [],
  ...over,
});

const props = (over = {}) => ({
  tracks: tracks(),
  rhythm: [],
  plays: false,
  down: new Set<number>(),
  sounding: [],
  onnote: () => {},
  ontoggle: () => {},
  onrecord: () => {},
  onplays: () => {},
  onclear: () => {},
  ...over,
});

const cell = (sound: string, step: number) =>
  screen.getByRole('button', { name: `${sound}, step ${step}` });

describe('the rhythm view', () => {
  it('draws the bar heard as a grid: a row for each sound, a column for each step, the band’s hits and the step heard', () => {
    render(Rhythm, props());
    expect(screen.getAllByRole('button', { name: /^Kick, step / })).toHaveLength(16);
    expect(cell('Kick', 1)).toHaveClass('theirs');
    expect(cell('Snare', 5)).toHaveClass('theirs');
    expect(cell('Snare', 5)).toHaveClass('heard');
    expect(cell('Kick', 2)).not.toHaveClass('theirs');
  });

  it('is as many steps as the bar heard is long: fourteen in 7/8', () => {
    const seven = tracks({
      frame: [0, 14, 28, 42, 56].map((start) => ({ start, steps: 14, pulses: [start] })),
      playhead: 30,
    });
    render(Rhythm, props({ tracks: seven }));
    expect(screen.getAllByRole('button', { name: /^Kick, step / })).toHaveLength(14);
  });

  it('draws the person’s pattern, ringed where the band hits too', () => {
    render(
      Rhythm,
      props({
        rhythm: [
          { note: kick, step: 0 },
          { note: snare, step: 2 },
        ],
      }),
    );
    expect(cell('Kick', 1)).toHaveClass('mine');
    expect(cell('Kick', 1)).toHaveClass('theirs');
    expect(cell('Snare', 3)).toHaveAttribute('aria-pressed', 'true');
  });

  it('watches by default: a tap on the grid does nothing until it edits', async () => {
    const ontoggle = vi.fn();
    render(Rhythm, props({ ontoggle }));
    expect(cell('Kick', 3)).toBeDisabled();
    await fireEvent.click(screen.getByRole('radio', { name: 'Edit' }));
    await fireEvent.click(cell('Kick', 3));
    expect(ontoggle).toHaveBeenCalledWith(kick, 2);
  });

  it('records what the pads play while it records, and only then', async () => {
    const onrecord = vi.fn();
    const onnote = vi.fn();
    render(Rhythm, props({ onrecord, onnote }));
    const snarePad = screen.getByRole('button', { name: 'Snare' });
    await fireEvent.pointerDown(snarePad, { pointerId: 1 });
    expect(onnote).toHaveBeenCalledWith(snare, 100, true);
    expect(onrecord).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByRole('radio', { name: '● Rec' }));
    await fireEvent.pointerDown(snarePad, { pointerId: 1 });
    expect(onrecord).toHaveBeenCalledWith(snare);
  });

  it('plays the pattern here on Mine, and clears it', async () => {
    const onplays = vi.fn();
    const onclear = vi.fn();
    const { rerender } = render(Rhythm, props({ onplays, onclear }));
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await fireEvent.click(screen.getByRole('button', { name: '▶ Mine' }));
    expect(onplays).toHaveBeenCalledWith(true);
    await rerender({ rhythm: [{ note: kick, step: 0 }], plays: true });
    expect(screen.getByRole('button', { name: '▶ Mine' })).toHaveAttribute('aria-pressed', 'true');
    await fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onclear).toHaveBeenCalledOnce();
  });
});
