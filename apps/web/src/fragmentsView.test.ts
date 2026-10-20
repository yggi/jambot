import { COMPOSER, DRUMMER, EMPTY_LAYER, type LearnedLayer, SEED_FRAGMENTS } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  FRAGMENT_FILTERS,
  type FragmentRow,
  type TakenSection,
  fragmentRows,
  fragmentsMain,
  fragmentsSub,
  logged,
  shownRows,
} from './fragmentsView.ts';
import type { MemoryView } from './hud.ts';

const section = (index: number, over: Partial<TakenSection> = {}): TakenSection => ({
  index,
  section: 'Groove',
  meter: '4/4 swung on 8n',
  rhythm: 'Lo-fi hip hop drums',
  clave: null,
  ...over,
});

const filedFile = (
  id: string,
  source: string,
  over: { tags?: string[]; varies?: string; facet?: string } = {},
): LearnedLayer['filed'][number] => ({
  fragment: {
    id,
    text: '&kick step=16n &bd ~ ~ ~',
    association: [
      {
        point: { sync: 0.4, harm: 0.7, artic: 0.3, energy: 0.6 },
        weight: 0.1,
        facet: over.facet ?? 'rhythm',
      },
    ],
  },
  meta: {
    source,
    created: `song 1, bar 8`,
    tags: over.tags ?? ['groove', 'Garage'],
    ...(over.varies === undefined ? {} : { varies: over.varies }),
  },
  prose: '',
});

const layer = (over: Partial<LearnedLayer> = {}): LearnedLayer => ({ ...EMPTY_LAYER, ...over });

const motif = (source: string, bar: number, strength: number): MemoryView => ({
  source,
  bar,
  name: `Ada's keys`,
  colour: 1,
  cycle: 16,
  pulses: [0, 4, 8, 12],
  rows: 3,
  notes: [{ step: 0, length: 2, row: 0, altered: false }],
  strength,
  heard: 2,
  confirmed: true,
  offered: false,
});

const rows = (over: Partial<Parameters<typeof fragmentRows>[0]> = {}): FragmentRow[] =>
  fragmentRows({ layer: null, log: [], memory: [], players: {}, ...over });

const byName = (all: readonly FragmentRow[], name: string): FragmentRow => {
  const row = all.find((r) => r.name === name);
  if (!row) throw new Error(`no row ${name}`);
  return row;
};

describe('the sections heard, logged (`logged`)', () => {
  it('adds a section the first time it is heard, and keeps it once', () => {
    let log: readonly TakenSection[] = [];
    log = logged(log, section(0));
    log = logged(log, section(0));
    log = logged(log, section(1, { rhythm: null }));
    expect(log.map((s) => s.index)).toEqual([0, 1]);
  });

  it('starts over where a section comes earlier than the last: a new song', () => {
    const log = logged(logged(logged([], section(0)), section(1)), section(0, { meter: '3/4' }));
    expect(log).toEqual([section(0, { meter: '3/4' })]);
  });

  it('keeps the log where nothing is heard', () => {
    const log = logged([], section(2));
    expect(logged(log, null)).toBe(log);
  });
});

describe('the fragments, as rows (`fragmentRows`)', () => {
  it('shows nothing before the band has taken, filed or heard anything', () => {
    expect(rows()).toEqual([]);
    expect(fragmentsMain([])).toBe('None yet');
  });

  it('counts the sections that took each fragment, its role in them, and marks those the section heard plays', () => {
    const log = [
      section(0),
      section(1, { clave: 'bossa nova clave' }),
      section(2, { meter: '3/4' }),
    ];
    const all = rows({ log });
    expect(byName(all, 'Lo-fi hip hop drums')).toMatchObject({
      role: 'rhythm',
      retrieved: true,
      filed: false,
      sections: 3,
      since: '§1',
      playing: true,
      source: 'seed',
    });
    expect(byName(all, '4/4 swung on 8n')).toMatchObject({
      role: 'meter',
      sections: 2,
      playing: false,
    });
    expect(byName(all, '3/4')).toMatchObject({ role: 'meter', sections: 1, playing: true });
    expect(byName(all, 'bossa nova clave')).toMatchObject({ role: 'clave', sections: 1 });
    // the latest taken first, then the most played, then as a section names them: meter, rhythm, clave
    expect(all.map((r) => r.name)).toEqual([
      'Lo-fi hip hop drums',
      '3/4',
      '4/4 swung on 8n',
      'bossa nova clave',
    ]);
  });

  it("reads a seed fragment's text and the point it is found at from cells' seed", () => {
    const seed = SEED_FRAGMENTS.find((f) => f.id === 'Lo-fi hip hop drums')!;
    const row = byName(rows({ log: [section(0)] }), 'Lo-fi hip hop drums');
    expect(row.text).toBe(seed.text);
    expect(row.point).toEqual(
      ['sync', 'harm', 'artic', 'energy'].map((axis) => ({
        axis,
        value: seed.association[0]!.point[axis],
      })),
    );
  });

  it('shows each groove filed: who filed it, its tags, what it varies, newest first', () => {
    const filed = [
      filedFile('drummer song 1, bar 8', DRUMMER),
      filedFile('Ada song 1, bar 16', 'Ada'),
      filedFile('composer song 1, bar 24', COMPOSER, { varies: 'drummer song 1, bar 8' }),
    ];
    const all = rows({ layer: layer({ filed }), players: { p1: 'Bo', p2: 'Ada' } });
    expect(all.map((r) => r.name)).toEqual([
      'composer song 1, bar 24',
      'Ada song 1, bar 16',
      'drummer song 1, bar 8',
    ]);
    expect(byName(all, 'drummer song 1, bar 8')).toMatchObject({
      filed: true,
      muse: false,
      source: 'The drummer',
      colour: null,
      since: 'song 1, bar 8',
      tags: ['groove', 'Garage'],
      varies: null,
      text: '&kick step=16n &bd ~ ~ ~',
    });
    expect(byName(all, 'composer song 1, bar 24')).toMatchObject({
      source: 'The composer',
      varies: 'drummer song 1, bar 8',
      muse: false,
    });
    // a player's groove is the Muse's filing, in the player's colour
    expect(byName(all, 'Ada song 1, bar 16')).toMatchObject({
      source: 'Ada',
      muse: true,
      colour: 1,
    });
  });

  it('marks a filed fragment the band took again as retrieved too, counted once', () => {
    const filed = [filedFile('drummer song 1, bar 8', DRUMMER)];
    const all = rows({
      layer: layer({ filed }),
      log: [section(3, { rhythm: 'drummer song 1, bar 8' })],
    });
    expect(all.filter((r) => r.name === 'drummer song 1, bar 8')).toHaveLength(1);
    expect(byName(all, 'drummer song 1, bar 8')).toMatchObject({
      filed: true,
      retrieved: true,
      sections: 1,
    });
  });

  it('lists what each fragment was used together with, the most first', () => {
    const together = [
      { ids: ['4/4 swung on 8n', 'Lo-fi hip hop drums'] as const, count: 4 },
      { ids: ['Lo-fi hip hop drums', 'bossa nova clave'] as const, count: 6 },
      { ids: ['3/4', 'Funk drums'] as const, count: 2 },
    ];
    const row = byName(
      rows({ layer: layer({ together }), log: [section(0)] }),
      'Lo-fi hip hop drums',
    );
    expect(row.together).toEqual([
      { id: 'bossa nova clave', count: 6 },
      { id: '4/4 swung on 8n', count: 4 },
    ]);
  });

  it("adds the Muse's motifs, the strongest first, after the fragments", () => {
    const all = rows({
      log: [section(0)],
      memory: [motif('p2:keys', 12, 0.5), motif('p2:keys', 20, 0.9)],
    });
    expect(all.slice(-2).map((r) => [r.name, r.role, r.muse, r.strength, r.since])).toEqual([
      ["Ada's keys, bar 20", 'motif', true, 0.9, 'bar 20'],
      ["Ada's keys, bar 12", 'motif', true, 0.5, 'bar 12'],
    ]);
  });
});

describe('the filters', () => {
  const all = rows({
    layer: layer({
      filed: [filedFile('Ada song 1, bar 16', 'Ada'), filedFile('drummer song 1, bar 8', DRUMMER)],
    }),
    log: [section(0, { rhythm: 'drummer song 1, bar 8' })],
    memory: [motif('p2:keys', 12, 0.5)],
    players: { p2: 'Ada' },
  });

  it('shows all, or those filed, retrieved or from the Muse, and a row can be in several', () => {
    const names = (filter: (typeof FRAGMENT_FILTERS)[number]['id']) =>
      shownRows(all, filter).map((r) => r.name);
    expect(names('all')).toHaveLength(all.length);
    expect(names('filed')).toEqual(['drummer song 1, bar 8', 'Ada song 1, bar 16']);
    expect(names('retrieved')).toEqual(['4/4 swung on 8n', 'drummer song 1, bar 8']);
    expect(names('muse')).toEqual(['Ada song 1, bar 16', "Ada's keys, bar 12"]);
  });

  it('says how many there are, and how many of each', () => {
    expect(fragmentsMain(all)).toBe('4 fragments');
    expect(fragmentsMain(all.slice(0, 1))).toBe('1 fragment');
    expect(fragmentsSub(all)).toBe('2 filed · 2 retrieved · 2 from the Muse');
    expect(fragmentsSub([])).toBe('What the band takes, files and hears shows here');
  });
});
