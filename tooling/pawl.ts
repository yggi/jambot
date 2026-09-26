/**
 * The ratchet's pawl check (#42): the catalogue's statuses, the tests its
 * entries name and the ids that tests cite have to agree, so an entry can't
 * slip back without `pnpm verify` saying so (`docs/ratchet.md`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

/** A repository as the check sees it: its catalogue, its file paths, and a reader. */
export interface Repo {
  catalogue: string;
  paths: string[];
  read(path: string): string;
}

/** A catalogue entry: its id, the line it starts on, and its raw fields. */
export interface Entry {
  id: string;
  line: number;
  status: string | undefined;
  test: string | undefined;
}

/**
 * Catalogues outside the repository that tests may cite with an issue
 * prefix, and the form of their ids. #39's properties live in the issue, so
 * only the form of a citation is checked there.
 */
const outside: Record<string, RegExp> = { '#39': /^Q\d+[a-z]?$/ };

const labels = /\b(Witness|Counterexample|Test|Source|Status|Lands in|Open):\s*/g;
const rungs = /^(speculative|open|measured, failing|measured|derived|decided)( \([^()]*\))?$/;
const retired = /^retired: \S/;
const fileToken = /^[\w@./-]+\.(ts|mjs|js|md|py|html|json)$/;
const bareId = /^[A-Z]\d+[a-z]?$/;
const prefixedId = /^(#\d+) ([A-Z]\d+[a-z]?)$/;

/**
 * The entries of a catalogue: each `**X9. …**` title with everything up to
 * the next entry, experiment or heading, lists included. A heading is `#`s
 * and a space, so a wrapped line that starts with an issue number is read on.
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
      !/^(\*\*[A-Z]\d+[a-z]?\. |#{1,6} |- \*\*E\d+\. )/.test(lines[end + 1]!)
    )
      end++;
    const paragraph = lines.slice(i, end + 1).join(' ');
    const afterTitle = paragraph.slice(paragraph.indexOf('**', 2) + 2);
    entries.push({ id: start[1]!, line: i + 1, ...fields(afterTitle) });
    i = end;
  }
  return entries;
}

/** An entry's Status and Test fields, without their closing full stops. */
function fields(text: string): Pick<Entry, 'status' | 'test'> {
  const found: Record<string, string> = {};
  const marks = [...text.matchAll(labels)];
  marks.forEach((mark, n) => {
    const from = mark.index + mark[0].length;
    const to = n + 1 < marks.length ? marks[n + 1]!.index : text.length;
    found[mark[1]!] = text.slice(from, to).trim().replace(/\.$/, '');
  });
  return { status: found['Status'], test: found['Test'] };
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

/** The ids a test name cites: a trailing group such as `(T4, #39 Q1c)`. */
export function citations(name: string): string[] {
  const group = /\(([^()]*)\)$/.exec(name.trim());
  if (!group) return [];
  const items = group[1]!.split(',').map((item) => item.trim());
  return items.every((item) => bareId.test(item) || prefixedId.test(item)) ? items : [];
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
  const text = repo.read(repo.catalogue);
  const entries = readCatalogue(text);
  const at = (entry: Entry) => `${repo.catalogue}:${entry.line} ${entry.id}`;

  const resolve = (token: string): string[] =>
    token.includes('/')
      ? repo.paths.filter((path) => path === token)
      : repo.paths.filter((path) => posix.basename(path) === token);

  // Rule 6: an id is defined once.
  const byId = new Map<string, Entry>();
  for (const entry of entries) {
    const first = byId.get(entry.id);
    if (first) problems.push(`${at(entry)} is defined twice, first at line ${first.line}`);
    else byId.set(entry.id, entry);
  }

  const named = new Map<string, Set<string>>();
  for (const entry of entries) {
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
    named.set(entry.id, files);

    // Rule 3: a measured entry names a file for its test.
    if (entry.status?.includes('measured') && !namesAFile)
      problems.push(`${at(entry)} is measured but its test names no file`);
  }

  // Rules 4 and 5: a cited id exists, and its entry names the citing file.
  const ids = new Set([...byId.keys(), ...experiments(text)]);
  for (const path of repo.paths.filter((p) => p.endsWith('.test.ts')).sort()) {
    for (const name of testNames(repo.read(path))) {
      for (const id of citations(name)) {
        const prefixed = prefixedId.exec(id);
        if (prefixed) {
          const form = outside[prefixed[1]!];
          if (!form?.test(prefixed[2]!))
            problems.push(`${path} cites ${id}, which is in no known catalogue`);
        } else if (!ids.has(id))
          problems.push(`${path} cites ${id}, which the catalogue does not define`);
        else if (byId.has(id) && !named.get(id)!.has(path))
          problems.push(`${path} cites ${id}, whose test does not name that file`);
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

/** The repository at `root`, with `docs/language.md` as its catalogue. */
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
    catalogue: 'docs/language.md',
    paths,
    read: (path) => readFileSync(join(root, path), 'utf8'),
  };
}
