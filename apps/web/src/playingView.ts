/**
 * The Cells view's Playing tree (#642): what the band plays in the section heard, as the rows of a tree read off the
 * section's score with cells' outline (`outlineOf`, yggi/cells#695), from the ground by default or from the outputs.
 *
 * A row is a part of the score as the band plays it:
 *
 * - each line the band is passed (its arguments, `* from band(drumlines=&drumlines, …)`), the drums, the bass, the pad,
 *   the stab and the lead, with every line of the score only it reads folded in (the drum roles and their bars, a
 *   part's levels, `&bassLevel` with `&bassline`);
 * - each fragment the score takes by a `from` line, outside the band: the meter, the key, a clave, the style;
 * - each other line of the score more than one row reads, as `&harm` is the bass's and the comp's.
 *
 * From the ground a row sits under the row it reads (the bass under the harmony, the harmony under the key), and a row
 * only one other reads, which reads nothing that one doesn't, sits inside that one (the clave in the drums); the band's
 * performers and instruments are what a row plays on, not rows. From the outputs the band, its performers and its
 * instruments are rows too, each part under what plays it. Pure, and reads only the score and its outline, which reach
 * a client as a host's.
 */

import type { Outline, OutlinePart } from '@jambot/score';
import type { FragmentRow, Workbench } from './fragmentsView.ts';

/**
 * How a fragment came, as the Library's row of it knows (#730): a seed, found (filed by the band on a miss), a
 * variation of another and how, or a player's via the Muse; and who made it, with the player's colour.
 */
export interface Came {
  /** The Library's row of it: what a picked row opens. */
  readonly row: FragmentRow;
  /** As a person reads it: "a seed", "found", "a variation of funk_drums by drop &hat 6", "via the Muse". */
  readonly how: string;
  /** Who made it: "The drummer", a player's name; null for a seed. */
  readonly who: string | null;
  /** The player's colour (`var(--source-N)`), or null for the band's and the seed's. */
  readonly colour: number | null;
}

/** How the fragment of a Library row came, and who made it. */
export function cameOf(row: FragmentRow): Came {
  const seed = row.source === 'seed';
  const how = seed
    ? 'a seed'
    : row.varies !== null
      ? `a variation of ${row.varies}${row.by === null ? '' : ` by ${row.by}`}`
      : row.muse
        ? 'via the Muse'
        : 'found';
  return { row, how, who: seed ? null : row.source, colour: row.colour };
}

/** What a written row was derived from (#730). */
export interface Derived {
  /** The fragment, by id; null where the band found none and the part is its own. */
  readonly id: string | null;
  /** How that fragment came, where the Library knows it. */
  readonly came: Came | null;
  /** Why the part is written out though it came from a fragment, where the page knows why. */
  readonly why: string | null;
}

/** Why the drums are written out from their rhythm fragment (#656). */
export const DRUMS_THINNED = 'the drummer thins the fragment to its own count';

/**
 * Why the band writes its own lines over a part it took from a fragment (#731), by the Playing tree's label of the part:
 * what the band changes in each (#656, #624 rung 6).
 */
export const WHY_WRITTEN: Readonly<Record<string, string>> = {
  drums: DRUMS_THINNED,
  bass: 'the bass sets its own count and register',
  lead: 'the lead plays it as its phrase’s shape',
  harm: 'the band colours its chords',
};

/** What the page knows besides the score, which the Playing tree joins to its rows (#730). */
export interface Known {
  /** The Library's rows (`fragmentRows`), by key: a fragment's is its id. */
  readonly library?: ReadonlyMap<string, FragmentRow>;
  /**
   * The drum bar the section heard plays from (`BarView.fragments.rhythm`), null where the drummer wrote its own: what
   * the drums are derived from where the score writes them out with no `from` line (a variation the composer filed,
   * which the seed library lacks).
   */
  readonly rhythm?: string | null;
}

/** Which way the tree runs: each part under what it is taken on, or under what plays it. */
export type Projection = 'ground' | 'outputs';

/** A row of the Playing tree, in the tree's order. */
export interface PlayingRow {
  /** Unique among the rows. */
  readonly key: string;
  /** How deep it sits: 0 at a root. */
  readonly depth: number;
  /** What it is, as a person reads it: the band's part (`drums`, `bass`), else its head (`bar`, `key`, `harm`). */
  readonly label: string;
  /** The fragment it is taken from (`funk_bass`, `diatonic`), or null where the score writes it out. */
  readonly id: string | null;
  /** Its `from` line's arguments, as written (`swing=16n:.6`), or none. */
  readonly args: string | null;
  /** The band's performers and instruments that play it, by fragment (`bass_performer`, `upright_bass`). */
  readonly on: readonly string[];
  /** The fragment's weight in the composer's mind, where it has one (#443). */
  readonly weight: number | null;
  /** The score's lines it is, 1-based, in order: what a row picked shows. */
  readonly lines: readonly number[];
  /** How its fragment came, where it takes one the Library knows; null otherwise. */
  readonly came: Came | null;
  /** What a written part was derived from, where the page knows; null for a fragment's row, or where it doesn't. */
  readonly derived: Derived | null;
}

/** A row while the tree is built: its parts and what it reads. */
interface Row {
  readonly key: string;
  readonly label: string;
  readonly id: string | null;
  readonly args: Readonly<Record<string, string>> | null;
  readonly parts: OutlinePart[];
  readonly band: boolean;
}

/** A part as the band's argument names it: `drumlines` the drums, `bassline` and `bassLevel` the bass. */
const partOfArgument = (name: string): string =>
  name.replace(/(lines?|Level)$/, '').replace(/^drum$/, 'drums');

/** A head without its `&`. */
const bare = (head: string) => head.replace(/^&/, '');

/**
 * The Playing tree's rows for a section's `score` and its `outline`, from the ground or the outputs, each fragment's
 * weight in the composer's mind where a workbench is given, and joined to what the page knows besides (`known`): how a
 * fragment came, from the Library's row of it, and what a written part was derived from. Parts of the outline past the
 * score's own lines (what a reading appends) are none of it.
 */
export function playingRows(
  score: string,
  outline: Outline,
  projection: Projection = 'ground',
  workbench: Workbench | null = null,
  known: Known = {},
): PlayingRow[] {
  const lines = score.split('\n').length;
  const parts = outline.parts.filter((p) => p.line <= lines);
  const byKey = new Map(parts.map((p) => [p.key, p]));
  const band = parts.find((p) => p.id === 'band' && p.within === null);
  const inBand = (p: OutlinePart) => band !== undefined && (p === band || p.within === band.key);

  // (who reads each part, within the score: the outline's reads, and a written line that names another's head in its
  // text, as a sum names a number it reads, which cells writes in as the number: `&intensity [&song + -.3]`, decision 088)
  const readers = new Map(parts.map((p) => [p.key, [] as string[]]));
  for (const p of parts) for (const r of p.reads) readers.get(r)?.push(p.key);
  const texts = score.split('\n');
  for (const p of parts) {
    if (p.id !== null || inBand(p)) continue;
    const named = new Set((texts[p.line - 1] ?? '').match(/&[A-Za-z_][A-Za-z0-9_]*/g) ?? []);
    for (const q of parts)
      if (
        q !== p &&
        !inBand(q) &&
        q.id === null &&
        q.heads.some((h) => named.has(h)) &&
        !p.heads.some((h) => q.heads.includes(h))
      )
        if (!readers.get(q.key)!.includes(p.key) && !p.reads.includes(q.key))
          readers.get(q.key)!.push(p.key);
  }
  // (a take the score's own lines override, `* from funk_bass &harm` under the band's `&bassline`, feeds the lines that
  // override it: it folds into their row, which is derived from it, #731)
  const overridden = (p: OutlinePart) =>
    p.id !== null && p.within === null && !inBand(p) && p.overrode.length > 0;
  for (const p of parts.filter(overridden))
    for (const q of parts)
      if (q.id === null && !inBand(q) && q.heads.some((h) => p.overrode.includes(h)))
        readers.get(p.key)!.push(q.key);

  // The rows: each band argument's line, each fragment taken outside the band, then each written line read by more
  // than one row; every other written line folds into the one row it feeds.
  const rows: Row[] = [];
  const rowOf = new Map<string, Row>();
  const add = (row: Row) => {
    rows.push(row);
    for (const p of row.parts) rowOf.set(p.key, row);
  };
  const bandArgs = Object.entries(band?.args ?? {});
  for (const [name, value] of bandArgs) {
    const owner = parts.find((p) => !inBand(p) && p.heads.includes(value.trim()));
    if (!owner || rowOf.has(owner.key)) continue;
    const label = partOfArgument(name);
    // (a line the score takes from a fragment is that fragment's row, labelled by the part it plays)
    if (owner.id !== null) {
      add({ key: owner.key, label, id: owner.id, args: owner.args, parts: [owner], band: false });
      continue;
    }
    const same = rows.find((r) => r.label === label && !r.band && r.id === null);
    if (same) {
      same.parts.push(owner);
      rowOf.set(owner.key, same);
    } else add({ key: `part ${label}`, label, id: null, args: null, parts: [owner], band: false });
  }
  for (const p of parts)
    if (p.id !== null && p.within === null && !inBand(p) && !rowOf.has(p.key) && !overridden(p))
      add({
        key: p.key,
        label: bare(p.heads[0] ?? p.id),
        id: p.id,
        args: p.args,
        parts: [p],
        band: false,
      });
  // (a fragment a take takes in turn, the clave's own kit, is that take's row)
  for (const p of parts) {
    const outer = p.within === null || inBand(p) ? undefined : rowOf.get(p.within);
    if (outer && !rowOf.has(p.key)) {
      outer.parts.push(p);
      rowOf.set(p.key, outer);
    }
  }
  // (a written line feeds the rows its readers belong to, followed up through other written lines)
  const feeds = (key: string, seen = new Set<string>()): Set<Row> => {
    const out = new Set<Row>();
    for (const r of readers.get(key) ?? []) {
      if (seen.has(r)) continue;
      seen.add(r);
      const reader = byKey.get(r)!;
      if (inBand(reader)) continue;
      const row = rowOf.get(r);
      if (row) out.add(row);
      else for (const x of feeds(r, seen)) out.add(x);
    }
    return out;
  };
  for (let settled = false; !settled;) {
    settled = true;
    for (const p of parts) {
      if (rowOf.has(p.key) || inBand(p) || (p.id !== null && !overridden(p))) continue;
      const fed = feeds(p.key);
      if (fed.size === 1) {
        const [row] = fed;
        row!.parts.push(p);
        rowOf.set(p.key, row!);
        settled = false;
      } else if (fed.size > 1 || (readers.get(p.key) ?? []).some((r) => inBand(byKey.get(r)!))) {
        add({
          key: p.key,
          label: bare(p.heads[0] ?? p.key),
          id: null,
          args: null,
          parts: [p],
          band: false,
        });
        settled = false;
      }
    }
  }
  // (a take whose overriding lines found no row is a row of its own, and what it takes in turn is that row's)
  for (const p of parts.filter((x) => overridden(x) && !rowOf.has(x.key)))
    add({
      key: p.key,
      label: bare(p.overrode[0]!),
      id: p.id,
      args: p.args,
      parts: [p],
      band: false,
    });
  for (const p of parts) {
    const outer = p.within === null || inBand(p) ? undefined : rowOf.get(p.within);
    if (outer && !rowOf.has(p.key)) {
      outer.parts.push(p);
      rowOf.set(p.key, outer);
    }
  }
  if (projection === 'outputs' && band)
    for (const p of parts.filter(inBand))
      add({
        key: p.key,
        label: p === band ? 'band' : (p.id ?? bare(p.heads[0] ?? p.key)),
        id: p.id,
        args: p.args,
        parts: [p],
        band: true,
      });

  // What each row reads, and what plays it from the band.
  const reads = new Map(rows.map((row) => [row, new Set<Row>()]));
  for (const row of rows)
    for (const p of row.parts)
      for (const r of p.reads) {
        // (a performer reading its band's own helpers, a level, is plumbing, as cells' outline leaves it out)
        if (band && p.within === band.key && r === band.key) continue;
        const other = rowOf.get(r);
        if (other && other !== row) reads.get(row)!.add(other);
      }
  const playsOn = (row: Row): string[] => {
    if (!band || row.band) return [];
    const performers = parts.filter(
      (p) => p.within === band.key && row.parts.some((x) => p.reads.includes(x.key)),
    );
    const instruments = parts.filter(
      (p) => p.within === band.key && performers.some((x) => p.reads.includes(x.key)),
    );
    return [...performers, ...instruments].flatMap((p) => (p.id === null ? [] : [p.id]));
  };

  // The tree: from the ground, a row under the deepest row it reads (a row only one other reads, reading nothing that
  // one doesn't, inside that one); from the outputs, under the row nearest the outputs that reads it.
  const readersOf = (row: Row) => rows.filter((r) => reads.get(r)!.has(row));
  // (from the ground, a row that only one other reads, and that reads nothing that one doesn't, is inside that one: it
  // layers on it, as a clave on its drums; that one stands where it would without it)
  const hosted = new Map<Row, Row>();
  if (projection === 'ground')
    for (const row of rows) {
      const by = readersOf(row);
      const host = by.length === 1 ? by[0]! : null;
      const own = [...reads.get(row)!];
      if (host && own.length > 0 && own.every((r) => reads.get(host)!.has(r)))
        hosted.set(row, host);
    }
  const next = (row: Row): Row[] =>
    projection === 'ground'
      ? [...reads.get(row)!].filter((r) => hosted.get(r) !== row)
      : readersOf(row);
  const depth = new Map<Row, number>();
  const visiting = new Set<Row>();
  const depthOf = (row: Row): number => {
    if (depth.has(row)) return depth.get(row)!;
    if (visiting.has(row)) return 0;
    visiting.add(row);
    const d = Math.max(0, ...next(row).map((n) => depthOf(n) + 1));
    visiting.delete(row);
    depth.set(row, d);
    return d;
  };
  const order = new Map(
    rows.map((r, i) => [r, Math.min(...r.parts.map((p) => p.line)) * 1000 + i]),
  );
  const parent = new Map<Row, Row>();
  for (const row of rows) {
    const host = hosted.get(row);
    if (host) {
      parent.set(row, host);
      continue;
    }
    const candidates = next(row)
      .filter((n) => depthOf(n) === depthOf(row) - 1)
      .sort((a, b) => order.get(b)! - order.get(a)!);
    if (candidates[0]) parent.set(row, candidates[0]);
  }
  const weights = new Map((workbench?.inMind ?? []).map((m) => [m.id, m.weight]));
  const cameOfId = (id: string | null): Came | null => {
    const row = id === null ? undefined : known.library?.get(id);
    return row ? cameOf(row) : null;
  };
  // (a written part of the band's, derived from the take its lines override in the score, #731; the drums, where the
  // score writes them out with none, from the rhythm the page knows; the band's own rows are none)
  const derivedOf = (row: Row): Derived | null => {
    if (row.id !== null || row.band) return null;
    const take = row.parts.find(overridden);
    if (take) return { id: take.id, came: cameOfId(take.id), why: WHY_WRITTEN[row.label] ?? null };
    if (row.label !== 'drums' || known.rhythm === undefined) return null;
    const id = known.rhythm;
    return { id, came: cameOfId(id), why: id === null ? null : DRUMS_THINNED };
  };
  const out: PlayingRow[] = [];
  const visit = (row: Row, d: number) => {
    out.push({
      key: row.key,
      depth: d,
      label: row.label,
      id: row.id,
      args:
        row.args && Object.keys(row.args).length
          ? Object.entries(row.args)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')
          : null,
      on: playsOn(row),
      weight: row.id === null ? null : (weights.get(row.id) ?? null),
      lines: [...new Set(row.parts.map((p) => p.line))].sort((a, b) => a - b),
      came: cameOfId(row.id),
      derived: derivedOf(row),
    });
    for (const child of rows
      .filter((r) => parent.get(r) === row)
      .sort((a, b) => order.get(a)! - order.get(b)!))
      visit(child, d + 1);
  };
  for (const root of rows
    .filter((r) => !parent.has(r))
    .sort((a, b) => order.get(a)! - order.get(b)!))
    visit(root, 0);
  return out;
}

/**
 * A row's fragment as its line says it: the fragment and its arguments, or, written, what it was derived from where
 * the page knows (`written from funk_drums`, `written, the band's own`).
 */
export function fragmentLine({ id, args, derived }: PlayingRow): string {
  if (id !== null) return args ? `${id} (${args})` : id;
  if (derived === null) return 'written';
  return derived.id === null ? 'written, the band’s own' : `written from ${derived.id}`;
}

/** How a row's fragment came, or the fragment a written row came from: what its line says beside the fragment. */
export function cameOfRow(row: PlayingRow): Came | null {
  return row.came ?? row.derived?.came ?? null;
}

/** How it came and who made it, as one phrase: "found · The drummer", "a seed". */
export function cameLine({ how, who }: Came): string {
  return who === null ? how : `${how} · ${who}`;
}

/** The card's summary, folded, of the section heard: how many parts it plays, and how many of them are fragments. */
export function playingSummary(rows: readonly PlayingRow[]): { main: string; sub: string } {
  const taken = rows.filter((r) => r.id !== null).length;
  return {
    main: `${rows.length} ${rows.length === 1 ? 'part' : 'parts'} playing`,
    sub: `${taken} from fragments · ${rows.length - taken} written`,
  };
}
