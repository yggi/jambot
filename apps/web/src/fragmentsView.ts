/**
 * The Cells view's model: every fragment the band has met, as one table,
 * told apart by where it has been, so the view's lists are filters over one
 * set of rows rather than four lists.
 *
 * - **Retrieved**: what the composer took from the repository for each
 *   section heard (its meter, rhythm and clave, `Plan.meterFragment` and the
 *   rest, which reach a client too), logged a section at a time (`logged`).
 * - **Filed**: what the learned layer filed (#401, #411, #423): the
 *   drummer's grooves and the bass's lines, the composer's variations and
 *   the players' grooves and lines, each with
 *   its text, the point it was filed at, its tags and what it varies. Only a
 *   host or a band alone keeps a layer.
 * - **Muse**: what she collected: the players' grooves she filed, and the
 *   motifs she remembers, which are not cells fragments yet (#309) and take a
 *   row of their own.
 *
 * What the composer has in mind (its short-term memory, `short-term.ts`) is
 * carried inside the transport and doesn't reach the screen yet (#443).
 */

import {
  BASSIST,
  COMPOSER,
  DRUMMER,
  type Fragment,
  type LearnedLayer,
  SEED_FRAGMENTS,
} from '@jambot/engine';
import { SOURCE_COLOURS } from './attribution.ts';
import type { BarView, MemoryView } from './hud.ts';

/** A section heard, and the fragments the composer took for it, by id: null where it took none. */
export interface TakenSection {
  /** Counted from the song's start. */
  readonly index: number;
  /** Its type, as the screen names it: "Groove". */
  readonly section: string;
  readonly meter: string | null;
  readonly rhythm: string | null;
  readonly clave: string | null;
}

/** The part a fragment plays: its slot in a section, its facet where it took none, or a motif. */
export type FragmentRole = 'meter' | 'rhythm' | 'clave' | 'bass' | 'motif';

/** The order a section names its fragments in. */
const SLOTS = ['meter', 'rhythm', 'clave'] as const;

/** The axes a fragment's point is shown on, in the style card's order. */
const POINT_AXES = ['sync', 'harm', 'artic', 'energy'] as const;

/** A fragment met, as a row of the table. */
export interface FragmentRow {
  /** Unique among the rows. */
  readonly key: string;
  /** Its id; for a motif, whose and when. */
  readonly name: string;
  readonly role: FragmentRole;
  /** Whether the layer filed it. */
  readonly filed: boolean;
  /** Whether the composer took it for a section heard. */
  readonly retrieved: boolean;
  /** Whether the Muse collected it: a player's groove she filed, or a motif she remembers. */
  readonly muse: boolean;
  /** Whether the section heard last plays it. */
  readonly playing: boolean;
  /** Who made it, as a person reads it: "seed", "The drummer", "The composer", a player's name. */
  readonly source: string;
  /** Its player's colour (`var(--source-N)`), or null for the band's and the seed's. */
  readonly colour: number | null;
  /** How many sections heard took it. */
  readonly sections: number;
  /** Where it first came: "§3" for the section that first took it, its filing ("song 1, bar 48"), a motif's bar. */
  readonly since: string;
  /** Its cells text, where it is a fragment. */
  readonly text: string | null;
  /** The point it is found at, on the style's axes it names. */
  readonly point: readonly { readonly axis: string; readonly value: number }[];
  readonly tags: readonly string[];
  /** The fragment it varies, where the composer varied one (#411). */
  readonly varies: string | null;
  /** What it was used together with, and how often, the most first (cells decision 046). */
  readonly together: readonly { readonly id: string; readonly count: number }[];
  /** A motif's weight in her memory, 0 to 1; null for a fragment. */
  readonly strength: number | null;
}

/** The section a bar heard is in, and what it took, or null before anything is heard. */
export function takenOf(bar: BarView | null): TakenSection | null {
  if (!bar) return null;
  return { index: bar.sectionIndex, section: bar.section, ...bar.fragments };
}

/**
 * The log with a section heard added: once, the first time it is heard;
 * from scratch where it comes before the last, as a new song's does.
 */
export function logged(
  log: readonly TakenSection[],
  section: TakenSection | null,
): readonly TakenSection[] {
  if (!section) return log;
  const last = log.at(-1);
  if (!last) return [section];
  if (section.index < last.index) return [section];
  if (section.index === last.index) return log;
  return [...log, section];
}

/** Who made a filed fragment, as a person reads it: the band's own by their part, a player by name. */
const BAND_SOURCES: Readonly<Record<string, string>> = {
  [DRUMMER]: 'The drummer',
  [BASSIST]: 'The bass',
  [COMPOSER]: 'The composer',
};

/** A player's colour by name, from their place in the session's record; the first outside one. */
function colourOf(name: string, players: Readonly<Record<string, string>>): number {
  const place = Object.values(players).indexOf(name);
  return place < 0 ? 0 : place % SOURCE_COLOURS;
}

const SEED: ReadonlyMap<string, Fragment> = new Map(SEED_FRAGMENTS.map((f) => [f.id, f]));

/** A fragment's first point of its facet (any where none), on the axes it names. */
function pointOf(fragment: Fragment | undefined, facet: string | null): FragmentRow['point'] {
  const found =
    fragment?.association.find((p) => p.facet === facet) ?? fragment?.association[0] ?? null;
  if (!found) return [];
  return POINT_AXES.filter((axis) => typeof found.point[axis] === 'number').map((axis) => ({
    axis,
    value: found.point[axis]!,
  }));
}

/** What each fragment was used together with, the most first. */
function togetherOf(layer: LearnedLayer | null, id: string): FragmentRow['together'] {
  return (layer?.together ?? [])
    .filter(({ ids }) => ids.includes(id))
    .map(({ ids, count }) => ({ id: ids[0] === id ? ids[1] : ids[0], count }))
    .sort((a, b) => b.count - a.count);
}

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

export interface FragmentsInput {
  /** What the band learned, where this device keeps it (a host, a band alone); null for a client. */
  readonly layer: LearnedLayer | null;
  /** The sections heard this song (`logged`), the last the one heard now. */
  readonly log: readonly TakenSection[];
  /** The Muse's memory (`MuseView.memory`). */
  readonly memory: readonly MemoryView[];
  /** The session's players' names, by id, in the order they joined. */
  readonly players: Readonly<Record<string, string>>;
}

/**
 * Every fragment met, once: those taken, the latest first, then the most
 * played, then as a section names them; then those filed and not taken,
 * the newest first; then the Muse's motifs, the strongest first.
 */
export function fragmentRows({ layer, log, memory, players }: FragmentsInput): FragmentRow[] {
  const filed = new Map((layer?.filed ?? []).map((f, order) => [f.fragment.id, { ...f, order }]));
  const now = log.at(-1);

  const taken = new Map<
    string,
    { role: FragmentRole; sections: number; first: number; last: number; slot: number }
  >();
  for (const section of log)
    SLOTS.forEach((slot, i) => {
      const id = section[slot];
      if (id === null) return;
      const seen = taken.get(id);
      taken.set(id, {
        role: seen?.role ?? slot,
        sections: (seen?.sections ?? 0) + 1,
        first: seen?.first ?? section.index,
        last: section.index,
        slot: seen?.slot ?? i,
      });
    });

  const row = (id: string): FragmentRow => {
    const file = filed.get(id);
    const took = taken.get(id);
    const fragment = file?.fragment ?? SEED.get(id);
    const facet = fragment?.association.find((p) => p.facet)?.facet ?? null;
    const source = file ? (typeof file.meta.source === 'string' ? file.meta.source : '') : 'seed';
    const band = !file || source in BAND_SOURCES;
    return {
      key: id,
      name: id,
      role: took?.role ?? (facet === 'meter' ? 'meter' : facet === 'bass' ? 'bass' : 'rhythm'),
      filed: file !== undefined,
      retrieved: took !== undefined,
      muse: !band,
      playing: now !== undefined && SLOTS.some((slot) => now[slot] === id),
      source: BAND_SOURCES[source] ?? source,
      colour: band ? null : colourOf(source, players),
      sections: took?.sections ?? 0,
      since: took
        ? `§${took.first + 1}`
        : typeof file?.meta.created === 'string'
          ? file.meta.created
          : '',
      text: fragment?.text ?? null,
      point: pointOf(fragment, took?.role === 'meter' ? 'meter' : facet),
      tags: strings(file?.meta.tags),
      varies: typeof file?.meta.varies === 'string' ? file.meta.varies : null,
      together: togetherOf(layer, id),
      strength: null,
    };
  };

  const takenIds = [...taken.entries()]
    .sort(([, a], [, b]) => b.last - a.last || b.sections - a.sections || a.slot - b.slot)
    .map(([id]) => id);
  const filedIds = [...filed.values()]
    .filter((f) => !taken.has(f.fragment.id))
    .sort((a, b) => b.order - a.order)
    .map((f) => f.fragment.id);
  const motifs = [...memory]
    .sort((a, b) => b.strength - a.strength)
    .map((m): FragmentRow => ({
      key: `motif ${m.source} ${m.bar}`,
      name: `${m.name}, bar ${m.bar}`,
      role: 'motif',
      filed: false,
      retrieved: false,
      muse: true,
      playing: m.offered,
      source: m.name,
      colour: m.colour,
      sections: 0,
      since: `bar ${m.bar}`,
      text: null,
      point: [],
      tags: [],
      varies: null,
      together: [],
      strength: m.strength,
    }));
  return [...takenIds.map(row), ...filedIds.map(row), ...motifs];
}

/** The table's filters: every row, or those that have been somewhere. */
export const FRAGMENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'filed', label: 'Filed' },
  { id: 'retrieved', label: 'Retrieved' },
  { id: 'muse', label: 'Muse' },
] as const;

export type FragmentFilter = (typeof FRAGMENT_FILTERS)[number]['id'];

/** The rows a filter shows, in the table's order. */
export function shownRows(rows: readonly FragmentRow[], filter: FragmentFilter): FragmentRow[] {
  return filter === 'all' ? [...rows] : rows.filter((r) => r[filter]);
}

/** The card's main element: how many fragments the band has met. */
export function fragmentsMain(rows: readonly FragmentRow[]): string {
  if (rows.length === 0) return 'None yet';
  return `${rows.length} ${rows.length === 1 ? 'fragment' : 'fragments'}`;
}

/** The card's sub element: how many of each. */
export function fragmentsSub(rows: readonly FragmentRow[]): string {
  if (rows.length === 0) return 'What the band takes, files and hears shows here';
  const count = (filter: Exclude<FragmentFilter, 'all'>) => shownRows(rows, filter).length;
  return `${count('filed')} filed · ${count('retrieved')} retrieved · ${count('muse')} from the Muse`;
}
