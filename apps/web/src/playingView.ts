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
import type { Workbench } from './fragmentsView.ts';

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
 * weight in the composer's mind where a workbench is given. Parts of the outline past the score's own lines (what a
 * reading appends) are none of it.
 */
export function playingRows(
  score: string,
  outline: Outline,
  projection: Projection = 'ground',
  workbench: Workbench | null = null,
): PlayingRow[] {
  const lines = score.split('\n').length;
  const parts = outline.parts.filter((p) => p.line <= lines);
  const byKey = new Map(parts.map((p) => [p.key, p]));
  const band = parts.find((p) => p.id === 'band' && p.within === null);
  const inBand = (p: OutlinePart) => band !== undefined && (p === band || p.within === band.key);

  // (who reads each part, within the score)
  const readers = new Map(parts.map((p) => [p.key, [] as string[]]));
  for (const p of parts) for (const r of p.reads) readers.get(r)?.push(p.key);

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
    if (p.id !== null && p.within === null && !inBand(p) && !rowOf.has(p.key))
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
      if (rowOf.has(p.key) || inBand(p) || p.id !== null) continue;
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

/** The card's summary, folded, of the section heard: how many parts it plays, and how many of them are fragments. */
export function playingSummary(rows: readonly PlayingRow[]): { main: string; sub: string } {
  const taken = rows.filter((r) => r.id !== null).length;
  return {
    main: `${rows.length} ${rows.length === 1 ? 'part' : 'parts'} playing`,
    sub: `${taken} from fragments · ${rows.length - taken} written`,
  };
}
