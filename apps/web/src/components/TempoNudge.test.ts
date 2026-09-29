import { TEMPO_REACH, TEMPO_STEP } from '@jambot/engine';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TempoNudge from './TempoNudge.svelte';

const tempo = (nudge: number) => ({
  bpm: 108 * 2 ** nudge,
  base: 108,
  nudge,
  low: -TEMPO_REACH,
  high: TEMPO_REACH,
});

describe('the tempo nudge', () => {
  it('says how far the tempo reaches, and draws where the nudge stands in the licence', () => {
    const { container } = render(TempoNudge, { tempo: tempo(2 * TEMPO_STEP), onintent: () => {} });
    expect(screen.getByText('Reaches 86–136')).toBeVisible();
    expect(container.querySelector('.value')).toBeInTheDocument();
    expect(container.querySelector('.reach')).toBeInTheDocument();
  });

  it('nudges a step at a time, as a ratio of the style’s tempo', async () => {
    const onintent = vi.fn();
    render(TempoNudge, { tempo: tempo(0), onintent });
    await fireEvent.click(screen.getByRole('button', { name: 'Faster' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Slower' }));
    expect(onintent.mock.calls).toEqual([
      [{ kind: 'tempo', nudge: TEMPO_STEP }],
      [{ kind: 'tempo', nudge: -TEMPO_STEP }],
    ]);
  });

  it('stops at the edge of the licence', () => {
    render(TempoNudge, { tempo: tempo(TEMPO_REACH), onintent: () => {} });
    expect(screen.getByRole('button', { name: 'Faster' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Slower' })).toBeEnabled();
  });

  it('rests for a client, who follows its host’s tempo', () => {
    render(TempoNudge, { tempo: tempo(0), disabled: true, onintent: () => {} });
    expect(screen.getByRole('button', { name: 'Faster' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Slower' })).toBeDisabled();
  });
});
