import { COMPOSER, DRUMMER, EMPTY_LAYER, type LearnedLayer } from '@jambot/engine';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { compileSection, sectionOutline } from '@jambot/score';
import Cells from './Cells.svelte';
import type { BarView } from '../hud.ts';

/** A bar heard, as much of it as the card reads. */
const bar = (sectionIndex: number, fragments: Partial<BarView['fragments']> = {}): BarView =>
  ({
    bar: sectionIndex * 8,
    sectionIndex,
    section: 'Groove',
    fragments: { meter: '4/4', rhythm: 'funk_drums', clave: null, ...fragments },
  }) as BarView;

const layer: LearnedLayer = {
  ...EMPTY_LAYER,
  filed: [
    {
      fragment: {
        id: 'drummer song 1, bar 8',
        text: '&kick step=16n &bd ~ ~ ~',
        association: [{ point: { sync: 0.25, harm: 0.5 }, weight: 0.1, facet: 'rhythm' }],
      },
      meta: { source: DRUMMER, created: 'song 1, bar 8', tags: ['groove', 'Garage'] },
      prose: '',
    },
  ],
};

const props = (over: Partial<Parameters<typeof render<typeof Cells>>[1]> = {}) => ({
  bar: null,
  layer: null,
  memory: [],
  players: {},
  ...over,
});

const names = () =>
  within(screen.getByRole('table', { name: 'Fragments' }))
    .getAllByRole('button')
    .map((b) => b.textContent?.trim());

/** The Library tab opened, where every fragment the band met is a row (#642: Playing is the default). */
const library = () => fireEvent.click(screen.getByRole('radio', { name: 'Library' }));

describe('the cells card', () => {
  it('opens on what the band plays: the section heard as a tree, from the ground or, switched, from the outputs (#642)', async () => {
    const text = [
      '&harm, &key from',
      '&bar from meter 120bpm',
      '&key from diatonic(mode=aeolian) A',
      '&style label="groove" style=&(map=style .5 .5 .5 .5)',
      '&harm over=&key step=1m [0,2,4] [5,7,9]',
      '&kick role=kick step=16n &bd:0:.4 ~ ~ ~',
      '&drumlines [&kick]',
      '&bassline part=bass over=&harm step=16n legato=.6 0@4 3@4',
      '&bassLevel map=amp step=16n .4@8',
      '&padline part=pad step=1m ~',
      '&stabline part=stab step=1m ~',
      '&leadline part=lead step=1m ~',
      '* from band(drumlines=&drumlines, bassline=&bassline, padline=&padline, stabline=&stabline, leadline=&leadline, bassLevel=&bassLevel, style=&style)',
    ].join('\n');
    render(Cells, props({ score: { text, outline: sectionOutline(compileSection(text)) } }));
    const rows = () =>
      within(screen.getByRole('table', { name: 'Playing' }))
        .getAllByRole('button')
        .map((b) => b.textContent?.trim());
    // (the harmony is the bass's alone here, so it is the bass's row: a line more than one row reads is its own)
    expect(rows()).toEqual(['bar', 'drums', 'pad', 'stab', 'lead', 'key', 'bass', 'style']);
    await fireEvent.click(screen.getByRole('button', { name: 'bass' }));
    expect(screen.getByRole('region', { name: 'bass' })).toHaveTextContent('&bassline part=bass');
    await fireEvent.click(screen.getByRole('radio', { name: 'From the outputs' }));
    expect(rows()).toContain('band');
    // (folded, the card counts what plays; each row says beneath it what it is taken from, for a phone)
    expect(screen.getByText('8 parts playing')).toBeInTheDocument();
    expect(screen.getByText('2 from fragments · 6 written')).toBeInTheDocument();
  });

  it('says how each part came, joined to the Library, and opens its fragment beside its lines (#730)', async () => {
    const text = [
      '&bar from meter 120bpm',
      '&key from diatonic(mode=aeolian) A',
      '&kick role=kick step=16n &bd:0:.4 ~ ~ ~',
      '&drumlines [&kick]',
      '&bassline part=bass over=&key step=16n 0@4 3@4',
      '&leadline part=lead over=&key step=4n 0 2 4 2',
      '* from band(drumlines=&drumlines, bassline=&bassline, leadline=&leadline)',
    ].join('\n');
    const score = { text, outline: sectionOutline(compileSection(text)) };
    const line = (label: string) =>
      within(screen.getAllByRole('table', { name: 'Playing' }).at(-1)!)
        .getByRole('button', { name: label })
        .closest('tr')!.textContent;
    // (a host's: the bass's line and the lead's miss off the band's carried plans, the bass line in mind)
    render(
      Cells,
      props({
        bar: bar(0, { rhythm: 'funk_drums' }),
        score,
        workbench: { inMind: [{ id: 'funk_bass', weight: 0.5 }], boredom: [] },
        derivations: [{ section: 0, bass: 'funk_bass', lead: null }],
      }),
    );
    expect(line('drums')).toContain('written from funk_drums');
    expect(line('drums')).toContain('a seed');
    expect(line('bass')).toContain('written from funk_bass');
    expect(line('lead')).toContain('written, the band’s own');
    await fireEvent.click(screen.getByRole('button', { name: 'drums' }));
    const detail = screen.getByRole('region', { name: 'drums' });
    expect(detail).toHaveTextContent(/Derived from\s*funk_drums/);
    expect(detail).toHaveTextContent('the drummer thins the fragment to its own count');
    expect(detail).toHaveTextContent('&kick role=kick');
    // (the Library's detail of funk_drums: its own text, the seed's)
    expect(within(detail).getByRole('heading', { level: 4 })).toHaveTextContent('funk_drums');
    // (a client's: the drums off its bar, nothing else derived)
    render(Cells, props({ bar: bar(0, { rhythm: 'funk_drums' }), score }));
    expect(line('drums')).toContain('written from funk_drums');
    expect(line('bass')).not.toContain('from');
    expect(line('lead')).not.toContain('own');
  });

  it('shows the next section, as built ahead, in a tab of its own (#642)', async () => {
    const at = (tonic: string) => {
      const text = [
        '&bar from meter 120bpm',
        `&key from diatonic(mode=aeolian) ${tonic}`,
        '&leadline part=lead over=&key step=4n 0 2 4 2',
        '* from band(leadline=&leadline)',
      ].join('\n');
      return { text, outline: sectionOutline(compileSection(text)) };
    };
    render(Cells, props({ score: at('A'), next: null }));
    await fireEvent.click(screen.getByRole('radio', { name: 'Next section' }));
    expect(screen.getByText(/the tree shows the next section once/)).toBeInTheDocument();
    render(Cells, props({ score: at('A'), next: at('C') }));
    const tabs = screen.getAllByRole('radio', { name: 'Next section' });
    await fireEvent.click(tabs.at(-1)!);
    const table = screen.getByRole('table', { name: 'Next section' });
    await fireEvent.click(within(table).getByRole('button', { name: 'key' }));
    expect(screen.getByRole('region', { name: 'key' })).toHaveTextContent(
      'diatonic(mode=aeolian) C',
    );
  });

  it("filters what the composer has in mind, and opens a rhythm's weight and boredom (#443)", async () => {
    render(
      Cells,
      props({
        bar: bar(0),
        workbench: {
          inMind: [{ id: 'funk_drums', weight: 0.5 }],
          boredom: [{ grooves: ['funk_drums'], boredom: 3.3, rejected: false }],
        },
      }),
    );
    await library();
    await fireEvent.click(screen.getByRole('radio', { name: /In mind/ }));
    expect(names()).toEqual(['funk_drums']);
    await fireEvent.click(screen.getByRole('button', { name: 'funk_drums' }));
    const detail = screen.getByRole('region', { name: 'funk_drums' });
    expect(detail).toHaveTextContent('In mind50 %');
    expect(detail).toHaveTextContent('Boredom3.3 · vary');
  });

  it('says there is nothing yet, before the band has met any fragment', () => {
    const { container } = render(Cells, props());
    expect(container.querySelector('summary .main')).toHaveTextContent('None yet');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('logs each section heard, once, and counts the sections that took each fragment', async () => {
    const card = render(Cells, props({ bar: bar(0) }));
    await library();
    await card.rerender(props({ bar: { ...bar(0), bar: 1 } }));
    await card.rerender(props({ bar: bar(1, { rhythm: 'techno_drums' }) }));
    expect(names()).toEqual(['4/4', 'techno_drums', 'funk_drums']);
    const row = (name: string) => screen.getByRole('button', { name }).closest('tr')!;
    expect(row('4/4')).toHaveTextContent('§1');
    expect(within(row('4/4')).getAllByRole('cell')[4]).toHaveTextContent('2');
    expect(within(row('funk_drums')).getAllByRole('cell')[4]).toHaveTextContent('1');
    expect(row('techno_drums')).toHaveTextContent('playing');
    expect(card.container.querySelector('summary .sub')).toHaveTextContent(
      '0 filed · 3 retrieved · 0 from the Muse',
    );
  });

  it('filters the table by where a fragment has been', async () => {
    render(Cells, props({ bar: bar(0), layer }));
    await library();
    expect(names()).toEqual(['4/4', 'funk_drums', 'drummer song 1, bar 8']);
    await fireEvent.click(screen.getByRole('radio', { name: 'Filed' }));
    expect(names()).toEqual(['drummer song 1, bar 8']);
    await fireEvent.click(screen.getByRole('radio', { name: 'Muse' }));
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText('None of these yet.')).toBeInTheDocument();
  });

  it('says what a variation varies and how (#454), and what alone where its filing says nothing of how', async () => {
    const variation = (id: string, by?: string): LearnedLayer['filed'][number] => ({
      fragment: { id, text: '&kick step=16n &bd ~ ~ ~', association: [] },
      meta: {
        source: COMPOSER,
        created: 'song 1, bar 16',
        tags: [],
        varies: 'drummer song 1, bar 8',
        ...(by === undefined ? {} : { by }),
      },
      prose: '',
    });
    const varied = {
      ...layer,
      filed: [
        ...layer.filed,
        variation('composer song 1, bar 16', 'drop &hat 6'),
        variation('composer song 1, bar 24'),
      ],
    };
    render(Cells, props({ layer: varied }));
    await library();
    const line = () => screen.getByText('Varies').closest('p')!;
    await fireEvent.click(screen.getByRole('button', { name: 'composer song 1, bar 16' }));
    expect(line()).toHaveTextContent(/^Varies\s*drummer song 1, bar 8 by drop &hat 6$/);
    await fireEvent.click(screen.getByRole('button', { name: 'composer song 1, bar 24' }));
    expect(line()).toHaveTextContent(/^Varies\s*drummer song 1, bar 8$/);
  });

  it('opens a row picked: its text, its point, its tags; a second pick closes it', async () => {
    render(Cells, props({ layer }));
    await library();
    const name = screen.getByRole('button', { name: 'drummer song 1, bar 8' });
    await fireEvent.click(name);
    expect(name).toHaveAttribute('aria-expanded', 'true');
    const detail = screen.getByRole('region', { name: 'drummer song 1, bar 8' });
    expect(detail).toHaveTextContent('&kick step=16n &bd ~ ~ ~');
    expect(within(detail).getByLabelText('Found at')).toHaveTextContent('sync 0.25');
    expect(within(detail).getByLabelText('Tags')).toHaveTextContent('groove');
    await fireEvent.click(name);
    expect(screen.queryByRole('region', { name: 'drummer song 1, bar 8' })).toBeNull();
  });

  describe('carrying what the band learned (#398)', () => {
    const carry = (more = {}) => ({
      playing: false,
      onexport: () => {},
      onexportfiles: () => {},
      onimport: () => null,
      ...more,
    });

    it('exports the layer, and its fragments only where it filed some', async () => {
      const onexport = vi.fn();
      const onexportfiles = vi.fn();
      const { rerender } = render(
        Cells,
        props({ layer: EMPTY_LAYER, carry: carry({ onexport, onexportfiles }) }),
      );
      await fireEvent.click(screen.getByRole('button', { name: 'Export' }));
      expect(onexport).toHaveBeenCalledOnce();
      expect(screen.queryByRole('button', { name: /Export fragments/ })).toBeNull();
      await rerender(props({ layer, carry: carry({ onexport, onexportfiles }) }));
      await fireEvent.click(screen.getByRole('button', { name: 'Export fragments (1)' }));
      expect(onexportfiles).toHaveBeenCalledOnce();
    });

    it('imports a file while the band is stopped, and says how it went', async () => {
      const onimport = vi.fn(() => null);
      render(Cells, props({ layer: EMPTY_LAYER, carry: carry({ onimport }) }));
      const input = screen.getByLabelText('Import') as HTMLInputElement;
      const file = new File(['{"format":"jambot-learned-layer"}'], 'layer.json');
      await fireEvent.change(input, { target: { files: [file] } });
      await vi.waitFor(() =>
        expect(onimport).toHaveBeenCalledWith('{"format":"jambot-learned-layer"}'),
      );
      await vi.waitFor(() => expect(screen.getByText(/Imported/)).toBeInTheDocument());
    });

    it('waits for the band to stop to import, and a client carries none', async () => {
      const { rerender } = render(
        Cells,
        props({ layer: EMPTY_LAYER, carry: carry({ playing: true }) }),
      );
      expect(screen.getByLabelText('Import')).toBeDisabled();
      expect(screen.getByText(/Stop the band to import/)).toBeInTheDocument();
      await rerender(props({ layer: null, carry: null }));
      expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
    });
  });
});
