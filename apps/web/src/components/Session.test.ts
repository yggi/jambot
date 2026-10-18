import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Session from './Session.svelte';

const following = {
  status: 'joined',
  session: 'Garage',
  name: 'Bo',
  hostPlaying: true,
  hostAway: false,
  trip: 12,
  lacked: 0,
} as const;
const nobody = { session: 'Garage', guests: [] };

type Props = ComponentProps<typeof Session>;

const props = (more: Partial<Props> = {}): Props => ({
  mode: 'host',
  hosting: nobody,
  following,
  players: {},
  playerId: null,
  bar: null,
  onend: () => {},
  ...more,
});

/** Unfold the card, where the way out and the players are. */
const unfold = () => fireEvent.click(screen.getByLabelText('Session').querySelector('summary')!);

describe('the session card', () => {
  it('names the session, and says its state, over its network', () => {
    const { container } = render(
      Session,
      props({ hosting: { ...nobody, guests: [{ id: 'c0', name: 'Ada' }] } }),
    );
    expect(container.querySelector('summary .title')).toHaveTextContent('Session');
    expect(container.querySelector('summary .main')).toHaveTextContent('Garage');
    expect(container.querySelector('summary .sub')).toHaveTextContent('Hosting · 1 joined');
    expect(container.querySelectorAll('summary svg.glyph circle.node')).toHaveLength(2);
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('names a solo band Solo', () => {
    const { container } = render(Session, props({ mode: 'solo' }));
    expect(container.querySelector('summary .main')).toHaveTextContent('Solo');
  });

  describe('the players, in its details', () => {
    it('lists a host and those who joined it, each with a colour', async () => {
      render(
        Session,
        props({
          hosting: {
            session: 'Garage',
            guests: [
              { id: 'c0', name: 'Ada' },
              { id: 'c1', name: 'Bo' },
            ],
          },
          players: { host: 'Cy', c0: 'Ada', c1: 'Bo' },
          playerId: 'host',
        }),
      );
      await unfold();
      const list = within(screen.getByRole('list', { name: 'Players' }));
      expect(list.getAllByRole('listitem').map((li) => li.textContent?.trim())).toEqual([
        'You (host)',
        'Ada',
        'Bo',
      ]);
    });

    it('says nobody has joined yet, in the list, as the summary does', async () => {
      render(Session, props());
      await unfold();
      expect(screen.getByRole('list', { name: 'Players' })).toHaveTextContent('You (host)');
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('gives a client its name, its round trip and the bars that came too late', async () => {
      render(Session, props({ mode: 'client', following: { ...following, trip: 12, lacked: 3 } }));
      await unfold();
      expect(screen.getByText('Playing as')).toBeInTheDocument();
      expect(screen.getByText('Bo')).toBeInTheDocument();
      expect(screen.getByText('12 ms')).toBeInTheDocument();
      expect(screen.getByText('3 bars')).toBeInTheDocument();
    });

    it('says what a client’s link is doing when it is lost, or the host is away', async () => {
      const { rerender } = render(
        Session,
        props({ mode: 'client', following: { ...following, status: 'reconnecting' } }),
      );
      await unfold();
      expect(screen.getByText(/The link was lost/)).toBeInTheDocument();
      await rerender({ following: { ...following, hostAway: true } });
      expect(
        screen.getByText(/The host lost its link and may be back in a moment/),
      ).toBeInTheDocument();
    });
  });

  describe('the radio (#313)', () => {
    it('lets a host and a solo band put the radio on the air and take it off, and says what it does', async () => {
      for (const mode of ['host', 'solo'] as const) {
        const ontune = vi.fn();
        const { rerender, unmount } = render(Session, props({ mode, ontune }));
        await unfold();
        const box = screen.getByRole('checkbox', { name: 'Leave the band on the radio' });
        expect(box).not.toBeChecked();
        expect(screen.getByText('The band keeps the style you set.')).toBeInTheDocument();
        await fireEvent.click(box);
        expect(ontune).toHaveBeenLastCalledWith(true);
        await rerender({ radio: true });
        expect(screen.getByRole('checkbox', { name: 'Leave the band on the radio' })).toBeChecked();
        expect(screen.getByText(/wanders the style by itself/)).toBeInTheDocument();
        await fireEvent.click(
          screen.getByRole('checkbox', { name: 'Leave the band on the radio' }),
        );
        expect(ontune).toHaveBeenLastCalledWith(false);
        unmount();
      }
    });

    it('gives a client no radio of its own: it follows the host’s style', async () => {
      render(Session, props({ mode: 'client', ontune: () => {} }));
      await unfold();
      expect(screen.queryByRole('checkbox')).toBeNull();
    });

    it('names where the band is and where it heads, for a client as for a host, and nothing before it plays', async () => {
      const { rerender } = render(Session, props({ mode: 'client' }));
      await unfold();
      expect(screen.queryByText('Now playing')).toBeNull();
      await rerender({ nowPlaying: 'Techno, drifting toward Ambient' });
      expect(screen.getByText('Now playing')).toBeInTheDocument();
      expect(screen.getByText('Techno, drifting toward Ambient')).toBeInTheDocument();
    });
  });

  describe('the way out', () => {
    it('lets a host close its session only after asking, and says how many are playing in it', async () => {
      const onend = vi.fn();
      render(
        Session,
        props({
          hosting: {
            session: 'Garage',
            guests: [
              { id: 'c0', name: 'Ada' },
              { id: 'c1', name: 'Bo' },
            ],
          },
          onend,
        }),
      );
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
      expect(onend).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'Close Garage for everyone? 2 others are playing in it.',
      );
      await fireEvent.click(screen.getByRole('button', { name: 'Keep playing' }));
      expect(onend).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Close session' })).toBeInTheDocument();
      await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Yes, close it' }));
      expect(onend).toHaveBeenCalledOnce();
    });

    it('says nobody is affected when a host closes a session nobody joined', async () => {
      render(Session, props());
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Close session' }));
      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'Close Garage? Nobody else is in it.',
      );
    });

    it('lets a client leave only after asking', async () => {
      const onend = vi.fn();
      render(Session, props({ mode: 'client', onend }));
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Leave session' }));
      expect(onend).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog')).toHaveTextContent('Leave Garage?');
      await fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Leave session' }));
      await fireEvent.click(screen.getByRole('button', { name: 'Yes, leave' }));
      expect(onend).toHaveBeenCalledOnce();
    });

    it('goes back to the lobby from solo at once: nothing is shared to ask about', async () => {
      const onend = vi.fn();
      render(Session, props({ mode: 'solo', onend }));
      await unfold();
      await fireEvent.click(screen.getByRole('button', { name: 'Back to the lobby' }));
      expect(onend).toHaveBeenCalledOnce();
    });
  });
});

describe('what the band learned, in its details (#398)', () => {
  const POINT = {
    point: { sync: 0.5, harm: 0.5, artic: 0.5, energy: 0.5 },
    weight: 1.2,
    facet: 'meter',
  };
  const LAYER = {
    filed: [],
    points: [
      { id: '4/4', ...POINT },
      { id: '5/4', ...POINT },
    ],
    together: [],
  };
  const learned = (more: Partial<NonNullable<Props['learned']>> = {}) => ({
    layer: LAYER,
    playing: false,
    onexport: () => {},
    onexportfiles: () => {},
    onimport: () => null,
    ...more,
  });

  it('says how many meters it kept and what the layer weighs, and nothing yet before it has', async () => {
    const { rerender } = render(Session, props({ learned: learned() }));
    await unfold();
    expect(screen.getByText('Meters kept').nextElementSibling).toHaveTextContent(
      '2 meters · 0.2 KB',
    );
    await rerender(props({ learned: learned({ layer: { filed: [], points: [], together: [] } }) }));
    expect(screen.getByText('Meters kept').nextElementSibling).toHaveTextContent('Nothing yet');
  });

  it('shows the grooves filed, each with who played it and its tags, beside the meters kept (#412)', async () => {
    const groove = (id: string, source: string, tags: string[], varies?: string) => ({
      fragment: {
        id,
        text: '&kick step=16n &bd ~ ~ ~',
        association: [{ ...POINT, facet: 'rhythm' }],
      },
      meta: { source, created: 'song 1, bar 0', tags, ...(varies ? { varies } : {}) },
      prose: '',
    });
    const layer = {
      ...LAYER,
      filed: [
        groove('drummer song 1, bar 0', 'drummer', ['groove']),
        groove('Ada song 1, bar 8', 'Ada', ['groove', 'Friday jam']),
        groove(
          'composer song 1, bar 16',
          'composer',
          ['groove', 'Friday jam'],
          'Ada song 1, bar 8',
        ),
      ],
      together: [{ ids: ['4/4', 'drummer song 1, bar 0'] as [string, string], count: 1 }],
    };
    const { rerender } = render(Session, props({ learned: learned({ layer }) }));
    await unfold();
    // the grooves are not meters
    expect(screen.getByText('Meters kept').nextElementSibling).toHaveTextContent(/^2 meters · /);
    expect(screen.getByText('Grooves filed').nextElementSibling).toHaveTextContent('3');
    const list = screen.getByRole('list', { name: 'Grooves filed' });
    const grooves = [...list.children].map((groove) => [
      within(groove as HTMLElement).getByText(/^(The drummer|Ada|The composer)$/).textContent,
      within(within(groove as HTMLElement).getByRole('list', { name: 'Tags' }))
        .getAllByRole('listitem')
        .map((tag) => tag.textContent),
    ]);
    expect(grooves).toEqual([
      ['The drummer', ['groove']],
      ['Ada', ['groove', 'Friday jam']],
      ['The composer', ['groove', 'Friday jam']],
    ]);
    // a variation names the groove it varies, and only a variation does
    expect(screen.getAllByText(/^varies /).map((v) => v.textContent)).toEqual([
      'varies Ada song 1, bar 8',
    ]);
    await rerender(props({ learned: learned() }));
    expect(screen.queryByText('Grooves filed')).toBeNull();
  });

  it('exports the layer, and its fragments only where it filed some', async () => {
    const onexport = vi.fn();
    render(Session, props({ mode: 'solo', learned: learned({ onexport }) }));
    await unfold();
    await fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onexport).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /Export fragments/ })).toBeNull();
  });

  it('imports a file while the band is stopped, and says how it went', async () => {
    const onimport = vi.fn(() => null);
    render(Session, props({ learned: learned({ onimport }) }));
    await unfold();
    const input = screen.getByLabelText('Import') as HTMLInputElement;
    const file = new File(['{"format":"jambot-learned-layer"}'], 'layer.json');
    await fireEvent.change(input, { target: { files: [file] } });
    await vi.waitFor(() =>
      expect(onimport).toHaveBeenCalledWith('{"format":"jambot-learned-layer"}'),
    );
    await vi.waitFor(() => expect(screen.getByText(/Imported/)).toBeInTheDocument());
  });

  it('waits for the band to stop to import, and a client has none', async () => {
    const { rerender } = render(Session, props({ learned: learned({ playing: true }) }));
    await unfold();
    expect(screen.getByLabelText('Import')).toBeDisabled();
    expect(screen.getByText(/Stop it to import/)).toBeInTheDocument();
    await rerender(props({ mode: 'client', learned: learned() }));
    expect(screen.queryByText('Meters kept')).toBeNull();
  });
});
