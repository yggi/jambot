/**
 * The ratchet's pawl check (#42): the catalogues' statuses, the tests their
 * entries name and the ids that tests cite have to agree, so an entry can't
 * slip back without `pnpm verify` saying so (`docs/ratchet.md`). The ids are
 * one space across all catalogues.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

/** A repository as the check sees it: its catalogues, its file paths, and a reader. */
export interface Repo {
  catalogues: string[];
  paths: string[];
  read(path: string): string;
}

/**
 * A catalogue entry: its id, the line it starts on, and its raw fields. An
 * alias (`Same as F4.`) is another name for an entry in any catalogue, and
 * has no status or test of its own.
 */
export interface Entry {
  id: string;
  line: number;
  status: string | undefined;
  test: string | undefined;
  same: string | undefined;
}

const labels = /\b(?:(Witness|Counterexample|Test|Source|Status|Lands in|Open):|(Same as)) */g;
const rungs = /^(speculative|open|measured, failing|measured|derived|decided)( \([^()]*\))?$/;
const retired = /^retired: \S/;
const fileToken = /^[\w@./-]+\.(ts|mjs|js|md|py|html|json)$/;
const bareId = /^[A-Z]\d+[a-z]?$/;
const prefixedId = /^#\d+ [A-Z]\d+[a-z]?$/;
const issue = /^#\d+$/;

/**
 * The entries of a catalogue: each `**X9. …**` title with everything up to
 * the next entry, experiment or heading, lists included.
 */
export function readCatalogue(text: string): Entry[] {
  const entries: Entry[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const start = /^\*\*([A-Z]\d+[a-z]?)\. /.exec(lines[i]!);
    if (!start) continue;
    let end = i;
    while (
      end + 1 < lines.length &&
      !/^(\*\*[A-Z]\d+[a-z]?\. |#|- \*\*E\d+\. )/.test(lines[end + 1]!)
    )
      end++;
    const paragraph = lines.slice(i, end + 1).join(' ');
    const afterTitle = paragraph.slice(paragraph.indexOf('**', 2) + 2);
    entries.push({ id: start[1]!, line: i + 1, ...fields(afterTitle) });
    i = end;
  }
  return entries;
}

/** An entry's Status, Test and Same as fields, without their closing full stops. */
function fields(text: string): Pick<Entry, 'status' | 'test' | 'same'> {
  const found: Record<string, string> = {};
  const marks = [...text.matchAll(labels)];
  marks.forEach((mark, n) => {
    const from = mark.index + mark[0].length;
    const to = n + 1 < marks.length ? marks[n + 1]!.index : text.length;
    found[mark[1] ?? mark[2]!] = text.slice(from, to).trim().replace(/\.$/, '');
  });
  return { status: found['Status'], test: found['Test'], same: found['Same as'] };
}

/** The ids of the catalogue's experiments, `- **E1. …**`. */
function experiments(text: string): string[] {
  return [...text.matchAll(/^- \*\*(E\d+)\. /gm)].map((m) => m[1]!);
}

/** The names given to `it`, `test` and `describe` in a test file's source. */
export function testNames(source: string): string[] {
  const calls = /\b(?:it|test|describe)\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  return [...source.matchAll(calls)].map((m) => m[2]!.replace(/\\(.)/g, '$1'));
}

/**
 * The items of a test name's citation: a trailing group that holds at least
 * one id, such as `(T4, Q1c)` or `(#38, P6)`. The check refuses an item
 * that is neither an id nor an issue number.
 */
export function citations(name: string): string[] {
  const group = /\(([^()]*)\)$/.exec(name.trim());
  if (!group) return [];
  const items = group[1]!.split(',').map((item) => item.trim());
  return items.some((item) => bareId.test(item) || prefixedId.test(item)) ? items : [];
}

const squeeze = (text: string) => text.replace(/\s+/g, ' ').trim();

/** The status's parts that are off the ladder. */
function offLadder(status: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let part = '';
  for (const char of status) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ';' && depth === 0) {
      parts.push(part.trim());
      part = '';
    } else part += char;
  }
  parts.push(part.trim());
  return parts.filter((p) => !rungs.test(p) && !retired.test(p));
}

/** Everything that keeps the pawl from holding, one line each. */
export function pawlProblems(repo: Repo): string[] {
  const problems: string[] = [];
  const entries = repo.catalogues.flatMap((catalogue) =>
    readCatalogue(repo.read(catalogue)).map((entry) => ({ ...entry, catalogue })),
  );
  type Placed = (typeof entries)[number];
  const where = (entry: Placed) => `${entry.catalogue}:${entry.line}`;
  const at = (entry: Placed) => `${where(entry)} ${entry.id}`;

  const resolve = (token: string): string[] =>
    token.includes('/')
      ? repo.paths.filter((path) => path === token)
      : repo.paths.filter((path) => posix.basename(path) === token);

  // Rule 6: an id is defined once, across every catalogue.
  const byId = new Map<string, Placed>();
  for (const entry of entries) {
    const first = byId.get(entry.id);
    if (!first) byId.set(entry.id, entry);
    else if (first.catalogue === entry.catalogue)
      problems.push(`${at(entry)} is defined twice, first at line ${first.line}`);
    else problems.push(`${at(entry)} is defined twice, first at ${where(first)}`);
  }

  // Rule 7: an alias names an entry that is not itself an alias.
  for (const entry of entries.filter((e) => e.same !== undefined)) {
    const target = byId.get(entry.same!);
    if (!target)
      problems.push(`${at(entry)} is the same as ${entry.same}, which no catalogue defines`);
    else if (target.same !== undefined)
      problems.push(`${at(entry)} is the same as ${entry.same}, which is itself an alias`);
  }

  const named = new Map<string, Set<string>>();
  for (const entry of entries.filter((e) => e.same === undefined)) {
    // Rule 1: a status, on the ladder.
    if (entry.status === undefined) problems.push(`${at(entry)} has no status`);
    else
      for (const part of offLadder(entry.status))
        problems.push(`${at(entry)} has a status off the ladder: "${part}"`);

    // Rule 2: the files the test names exist, and its quotes are tests in them.
    const files = new Set<string>();
    let namesAFile = false;
    let current: string | undefined;
    for (const token of (entry.test ?? '').matchAll(/`([^`]+)`|"([^"]+)"/g)) {
      if (token[1] !== undefined) {
        if (!fileToken.test(token[1])) continue;
        namesAFile = true;
        current = undefined;
        const found = resolve(token[1]);
        if (found.length === 0)
          problems.push(`${at(entry)} names \`${token[1]}\`, which does not exist`);
        else if (found.length > 1)
          problems.push(
            `${at(entry)} names \`${token[1]}\`, which could be ${found.sort().join(' or ')}`,
          );
        else {
          current = found[0]!;
          files.add(current);
        }
      } else if (current?.endsWith('.test.ts')) {
        const quote = squeeze(token[2]!);
        if (!testNames(repo.read(current)).some((name) => squeeze(name) === quote))
          problems.push(`${at(entry)} quotes "${quote}", which is no test in ${current}`);
      }
    }
    if (!named.has(entry.id)) named.set(entry.id, files);

    // Rule 3: a measured entry names a file for its test.
    if (entry.status?.includes('measured') && !namesAFile)
      problems.push(`${at(entry)} is measured but its test names no file`);
  }

  // Rules 4 and 5: a cited id exists, and its entry, or the entry an alias
  // names, names the citing file.
  const ids = new Set([
    ...byId.keys(),
    ...repo.catalogues.flatMap((catalogue) => experiments(repo.read(catalogue))),
  ]);
  for (const path of repo.paths.filter((p) => p.endsWith('.test.ts')).sort()) {
    for (const name of testNames(repo.read(path))) {
      for (const item of citations(name)) {
        if (issue.test(item)) continue;
        if (prefixedId.test(item))
          problems.push(`${path} cites "${item}"; a citation names the id alone`);
        else if (!bareId.test(item))
          problems.push(`${path} cites "${item}"; a citation holds only ids and issue numbers`);
        else if (!ids.has(item))
          problems.push(`${path} cites ${item}, which the catalogue does not define`);
        else {
          const entry = byId.get(item);
          const held = entry && named.get(entry.same ?? entry.id);
          if (held && !held.has(path))
            problems.push(`${path} cites ${item}, whose test does not name that file`);
        }
      }
    }
  }
  return [...new Set(problems)];
}

const skipped = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.svelte-kit',
  'test-results',
  'playwright-report',
]);

/** The catalogues: #7's negative shape, and #39's quinetic properties. */
export const CATALOGUES = ['docs/language.md', 'docs/quinetic.md'];

/** The repository at `root`, with its catalogues. */
export function repoOnDisk(root: string): Repo {
  const paths: string[] = [];
  const walk = (dir: string) => {
    for (const item of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (skipped.has(item.name)) continue;
      const path = dir ? `${dir}/${item.name}` : item.name;
      if (item.isDirectory()) walk(path);
      else paths.push(path);
    }
  };
  walk('');
  return {
    catalogues: CATALOGUES,
    paths,
    read: (path) => readFileSync(join(root, path), 'utf8'),
  };
}
