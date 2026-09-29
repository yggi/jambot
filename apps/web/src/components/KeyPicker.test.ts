import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import KeyPicker from './KeyPicker.svelte';

const NO_HISTORY = new Array(12).fill(0);

describe('the key picker', () => {
  it('reads the key in common terms in its header, folded by default', () => {
    const { container } = render(KeyPicker, {
      heading: { tonic: 0, mode: 'ionian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    expect(container.querySelector('summary .main')).toHaveTextContent('C major');
    expect(container.querySelector('details')).not.toHaveAttribute('open');
    cleanup();
    const minor = render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    expect(minor.container.querySelector('summary .main')).toHaveTextContent('A minor');
  });

  it('shows the wheel and the scale together, with no view switch', () => {
    render(KeyPicker, {
      heading: { tonic: 3, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    expect(screen.getByRole('button', { name: 'E♭' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radiogroup', { name: 'Scale' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Circle' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Scale' })).toBeNull();
  });

  it('offers all seven modes, the four the band plays enabled', () => {
    render(KeyPicker, {
      heading: { tonic: 3, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    const radios = within(screen.getByRole('radiogroup', { name: 'Scale' })).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual([
      'lyd',
      'major',
      'mix',
      'dor',
      'minor',
      'phr',
      'loc',
    ]);
    expect(radios.map((r) => r.getAttribute('title'))).toEqual([
      'lydian',
      'major',
      'mixolydian',
      'dorian',
      'minor',
      'phrygian',
      'locrian',
    ]);
    expect(
      radios.filter((r) => !(r as HTMLButtonElement).disabled).map((r) => r.textContent),
    ).toEqual(['major', 'mix', 'dor', 'minor']);
    expect(screen.getByRole('radio', { name: 'dorian' })).toBeChecked();
  });

  it('draws a diatonic scale as 8 marks on 12 steps, the tonic and its octave marked', () => {
    const { container } = render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    const marks = [...container.querySelectorAll('svg.ruler circle.mark')];
    expect(marks).toHaveLength(8);
    expect(container.querySelectorAll('svg.ruler line.tick')).toHaveLength(13);
    expect(marks.filter((m) => m.classList.contains('accent'))).toHaveLength(2);
    const ruler = container.querySelector('svg.ruler')!;
    expect(ruler.textContent?.replace(/\s+/g, '')).toBe('ABCDEFGA');
  });

  it('wishes for the scale picked, keeping the tonic', async () => {
    const onintent = vi.fn();
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      onintent,
    });
    await fireEvent.click(screen.getByRole('radio', { name: 'mixolydian' }));
    expect(onintent).toHaveBeenLastCalledWith({
      kind: 'key',
      wish: { tonic: 9, mode: 'mixolydian' },
    });
  });

  it('wishes for the tonic clicked on its circle of fifths, keeping the mode', async () => {
    const onintent = vi.fn();
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent,
    });
    await fireEvent.click(screen.getByRole('button', { name: 'D' }));
    expect(onintent).toHaveBeenCalledWith({ kind: 'key', wish: { tonic: 2, mode: 'dorian' } });
  });

  it('always draws the harmonic history under the wheel', () => {
    const history = new Array(12).fill(0);
    history[9] = 3; // A
    const { container } = render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history,
      reach: 6,
      onintent: () => {},
    });
    expect(container.querySelector('path.history')).not.toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('nudges the key a fifth up or down, keeping the mode', async () => {
    const onintent = vi.fn();
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'dorian' },
      history: NO_HISTORY,
      reach: 6,
      onintent,
    });
    await fireEvent.click(screen.getByRole('button', { name: /Nudge up/ }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'key', wish: { tonic: 4, mode: 'dorian' } });
    await fireEvent.click(screen.getByRole('button', { name: /Nudge down/ }));
    expect(onintent).toHaveBeenLastCalledWith({ kind: 'key', wish: { tonic: 2, mode: 'dorian' } });
  });

  it('disables a nudge that would leave the licence', () => {
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 0,
      onintent: () => {},
    });
    expect(screen.getByRole('button', { name: /Nudge up/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Nudge down/ })).toBeDisabled();
  });

  it('lets a client neither set nor nudge the key yet: the host sets it, and says so', async () => {
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      following: true,
      onintent: () => {},
    });
    expect(screen.queryByRole('button', { name: 'D' })).toBeNull();
    for (const name of [/Nudge up/, /Nudge down/]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
      expect(screen.getByRole('button', { name })).toHaveAttribute(
        'title',
        'The host sets the key',
      );
    }
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it('dims the tonics beyond the reach of the home it is given, the harmonic history’s centre (#169)', () => {
    // Home E aeolian, one fifth either way: A, E and B aeolian, and no further.
    render(KeyPicker, {
      heading: { tonic: 4, mode: 'aeolian' },
      home: { tonic: 4, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 1,
      onintent: () => {},
    });
    for (const name of ['A', 'E', 'B']) expect(screen.getByRole('button', { name })).toBeEnabled();
    for (const name of ['D', 'F♯', 'C'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
  });

  it('reaches every tonic when the licence is wide, and dims those beyond a narrow one', () => {
    const { unmount } = render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 6,
      onintent: () => {},
    });
    for (const name of ['C', 'E♭', 'F♯', 'A'])
      expect(screen.getByRole('button', { name })).toBeEnabled();
    unmount();
    // One fifth from A aeolian (no sharps or flats): D, A and E aeolian, and no further.
    render(KeyPicker, {
      heading: { tonic: 9, mode: 'aeolian' },
      history: NO_HISTORY,
      reach: 1,
      onintent: () => {},
    });
    for (const name of ['D', 'A', 'E']) expect(screen.getByRole('button', { name })).toBeEnabled();
    for (const name of ['G', 'B', 'C', 'F♯'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
  });

  describe('the melodic scale (#209)', () => {
    const scales = () =>
      within(screen.getByRole('radiogroup', { name: 'Melodic scale' })).getAllByRole('radio');

    it('offers the plain scale, the pentatonic and the blues, those beyond the style’s reach disabled, the one heading checked', () => {
      render(KeyPicker, {
        heading: { tonic: 9, mode: 'aeolian' },
        history: NO_HISTORY,
        reach: 6,
        melodic: 'pentatonic',
        melodicReach: ['plain', 'pentatonic'],
        onintent: () => {},
      });
      expect(scales().map((r) => r.textContent)).toEqual(['plain', 'pentatonic', 'blues']);
      expect(scales().map((r) => (r as HTMLButtonElement).disabled)).toEqual([false, false, true]);
      expect(screen.getByRole('radio', { name: 'pentatonic' })).toBeChecked();
    });

    it('offers only the plain scale where the style reaches no other, as Techno does, and checks it by default', () => {
      render(KeyPicker, {
        heading: { tonic: 9, mode: 'aeolian' },
        history: NO_HISTORY,
        reach: 1,
        onintent: () => {},
      });
      expect(scales().map((r) => (r as HTMLButtonElement).disabled)).toEqual([false, true, true]);
      expect(screen.getByRole('radio', { name: 'plain' })).toBeChecked();
    });

    it('wishes for the scale picked, and for nothing else of the key', async () => {
      const onintent = vi.fn();
      render(KeyPicker, {
        heading: { tonic: 9, mode: 'aeolian' },
        history: NO_HISTORY,
        reach: 6,
        melodicReach: ['plain', 'pentatonic', 'blues'],
        onintent,
      });
      await fireEvent.click(screen.getByRole('radio', { name: 'blues' }));
      expect(onintent).toHaveBeenLastCalledWith({ kind: 'key', wish: { melodic: 'blues' } });
      await fireEvent.click(screen.getByRole('radio', { name: 'pentatonic' }));
      expect(onintent).toHaveBeenLastCalledWith({ kind: 'key', wish: { melodic: 'pentatonic' } });
    });

    it('rests on a client, as the key does', () => {
      render(KeyPicker, {
        heading: { tonic: 9, mode: 'aeolian' },
        history: NO_HISTORY,
        reach: 6,
        melodicReach: ['plain', 'pentatonic', 'blues'],
        following: true,
        onintent: () => {},
      });
      for (const radio of scales()) expect(radio).toBeDisabled();
    });
  });
});
