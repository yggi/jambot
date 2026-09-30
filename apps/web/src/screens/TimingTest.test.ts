import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setup } from '../timing-test/fixtures.ts';
import { LEAD_SECONDS } from '../timing-test/session.svelte.ts';
import { testEnd } from '../timing-test/pattern.ts';
import TimingTestScreen from './TimingTest.svelte';

/** The screen over a test driven by hand, and the callbacks it sends. */
function shown() {
  const world = setup();
  const onback = vi.fn();
  const onexport = vi.fn();
  const rendered = render(TimingTestScreen, { test: world.test, onback, onexport });
  /** Play a whole test through, tapping each of the first `taps` hits `late` milliseconds late. */
  const play = async (taps = 6, late = 20) => {
    await world.test.start();
    for (const e of world.test.plan!.expected.slice(0, taps))
      world.test.tap({
        source: 'the computer keys',
        kind: 'keys',
        eventMs: world.heardMs(e.index) + late,
      });
    world.run(
      (LEAD_SECONDS + (4 * world.test.plan!.barSeconds) / 4 + testEnd(world.test.plan!)) * 1000 +
        300,
    );
    await tick();
  };
  return { ...world, onback, onexport, rendered, play };
}

describe('the timing test screen', () => {
  beforeEach(() =>
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout'] }),
  );
  afterEach(() => vi.useRealTimers());

  it('explains itself and offers the patterns and tempos, the first of each chosen', () => {
    shown();
    expect(screen.getByRole('region', { name: 'Timing test' })).toHaveTextContent(
      /kick and a snare/,
    );
    const pattern = screen.getByRole('radiogroup', { name: 'Pattern' });
    expect(
      within(pattern)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['Quarters', 'Eighths', 'Syncopated']);
    expect(within(pattern).getByRole('radio', { name: /Quarters/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const tempo = screen.getByRole('radiogroup', { name: 'Tempo' });
    expect(
      within(tempo)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['80 bpm', '100 bpm', '120 bpm']);
    expect(within(tempo).getByRole('radio', { name: '100 bpm' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Start the test' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tap along' })).toBeNull();
  });

  it('sets the pattern and tempo the person picks', async () => {
    const { test } = shown();
    await fireEvent.click(screen.getByRole('radio', { name: /Syncopated/ }));
    await fireEvent.click(screen.getByRole('radio', { name: '120 bpm' }));
    expect([test.pattern, test.bpm]).toEqual(['syncopated', 120]);
  });

  it('goes back to the lobby', async () => {
    const { onback } = shown();
    await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
    expect(onback).toHaveBeenCalledOnce();
  });

  it('shows the run while it plays: a tap button, a way to stop, and no choices to change', async () => {
    const { test } = shown();
    await fireEvent.click(screen.getByRole('button', { name: 'Start the test' }));
    await waitFor(() => expect(test.phase).toBe('playing'));
    expect(await screen.findByRole('button', { name: 'Tap along' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Pattern' })).toBeNull();
  });

  it('says at once how far off a tap was, and which sound, in words', async () => {
    const { test, heardMs } = shown();
    await test.start();
    await tick();
    expect(screen.getByText('Waiting for your first tap')).toBeInTheDocument();
    test.tap({ source: 'the computer keys', kind: 'keys', eventMs: heardMs(1) + 42 });
    await tick();
    expect(screen.getByText('snare · 42 ms late')).toBeInTheDocument();
    test.tap({ source: 'the computer keys', kind: 'keys', eventMs: heardMs(2) - 8 });
    await tick();
    expect(screen.getByText('kick · on time (8 ms early)')).toBeInTheDocument();
    test.tap({ source: 'the computer keys', kind: 'keys', eventMs: heardMs(0) - 5000 });
    await tick();
    expect(screen.getByText('No hit near that tap')).toBeInTheDocument();
  });

  it('adds the taps up as they come', async () => {
    const { test, heardMs } = shown();
    await test.start();
    for (const [i, off] of [
      [0, 10],
      [1, 30],
    ] as const)
      test.tap({ source: 's', kind: 'tap', eventMs: heardMs(i) + off });
    await tick();
    expect(screen.getByText(/2 of 32 hits/)).toBeInTheDocument();
    expect(screen.getByText(/mean \+20 ms/)).toBeInTheDocument();
  });

  it('takes a tap on its button once, when the pointer goes down, and a keyboard press of it too', async () => {
    const { test } = shown();
    await test.start();
    await tick();
    const button = screen.getByRole('button', { name: 'Tap along' });
    await fireEvent.pointerDown(button);
    expect(test.taps.map((t) => [t.kind, t.source])).toEqual([['tap', 'the on-screen tap']]);
    // The click that follows a pointer is not a second tap, whether the browser sends it as a
    // mouse event or, as Firefox and Chrome do, as a pointer event.
    await fireEvent.click(button, { detail: 1 });
    button.dispatchEvent(new PointerEvent('click', { detail: 1, bubbles: true }));
    await tick();
    expect(test.taps).toHaveLength(1);
    await fireEvent.click(button, { detail: 0 }); // from the keyboard
    expect(test.taps).toHaveLength(2);
    expect(screen.getByText(/2 taps/)).toBeInTheDocument();
  });

  it('stops on request, and says nothing was kept', async () => {
    const { test } = shown();
    await test.start();
    await tick();
    await fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(test.phase).toBe('idle');
    expect(screen.getByText(/nothing was kept/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the test' })).toBeInTheDocument();
  });

  it('gives the result when the run is over, saves it, and offers another', async () => {
    const { play, test } = shown();
    await play(6, 20);
    expect(test.phase).toBe('done');
    const result = screen.getByLabelText('Result');
    expect(result).toHaveTextContent('6 of 32 hits followed, 26 missed, 0 extra taps');
    expect(result).toHaveTextContent('Mean +20 ms');
    expect(result).toHaveTextContent(`Saved as ${test.finished!.id}`);
    expect(screen.getByRole('button', { name: 'Run again' })).toBeInTheDocument();
  });

  describe('the runs kept', () => {
    it('are listed with their pattern, tempo, hits, mean and inputs, and downloaded as JSON or CSV', async () => {
      const { play, onexport } = shown();
      expect(screen.getByText('No run is kept yet.')).toBeInTheDocument();
      await play(6, 20);
      const saved = screen.getByRole('region', { name: 'Saved runs' });
      expect(within(saved).getByText('quarters, 100 bpm')).toBeInTheDocument();
      expect(within(saved).getByText('6/32 hits')).toBeInTheDocument();
      expect(within(saved).getByText('mean +20 ms')).toBeInTheDocument();
      expect(within(saved).getByText('the computer keys')).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Download all (JSON)' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Download taps (CSV)' }));
      expect(onexport.mock.calls).toEqual([['json'], ['csv']]);
    });

    it('can be deleted one at a time', async () => {
      const { play, test } = shown();
      await play(2);
      await fireEvent.click(screen.getByRole('button', { name: /Delete the run of/ }));
      expect(test.saved).toEqual([]);
      expect(screen.getByText('No run is kept yet.')).toBeInTheDocument();
    });

    it('are cleared only after a second, in-place question, which can be answered no', async () => {
      const { play, test } = shown();
      await play(2);
      await fireEvent.click(screen.getByRole('button', { name: 'Clear all…' }));
      const question = screen.getByRole('alertdialog', { name: 'Clear the runs' });
      expect(question).toHaveTextContent('Delete all 1?');
      await fireEvent.click(within(question).getByRole('button', { name: 'Keep' }));
      expect(test.saved).toHaveLength(1);
      await fireEvent.click(screen.getByRole('button', { name: 'Clear all…' }));
      await fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
      );
      expect(test.saved).toEqual([]);
    });
  });
});
