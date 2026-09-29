/**
 * Docs describe the present, and a new directory or doc gets a line in
 * `docs/INDEX.md` in the same pull request (`AGENTS.md`, "Keeping the shared
 * memory current"). That rule held only by whoever read the diff, so #45
 * gives it a check, and #174 moved it from files to directories: every
 * directory that holds source under a package's `src`, the app's `src`,
 * `tooling/` and `.claude/` is named in `INDEX.md` by its full path, and every
 * doc under `docs/` is linked from it. A source file has no line there; its
 * own header comment says what it is, and this check refuses a `.ts`, `.mjs`
 * or `.svelte` file that opens with none.
 *
 * Left out: tests (`*.test.ts`, `*.e2e.ts`), which sit beside the code they
 * test rather than getting a line of their own, and config files
 * (`*.json`), which describe a tool rather than the repository — the root
 * `package.json` and `tsconfig.json` aren't in `INDEX.md` either.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** A repository as this check sees it: every file under a root, and a reader. */
export interface FileRepo {
  /** Every file's path, relative to the repository root, POSIX slashes, under `root`. */
  list(root: string): string[];
  read(path: string): string;
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-pages', 'coverage', '.git']);
const SKIP_FILES = /\.(test|e2e)\.ts$|\.json$/;

/** A `FileRepo` over the real filesystem, rooted at `base`. */
export function diskRepo(base: string): FileRepo {
  const list = (root: string): string[] => {
    const abs = join(base, root);
    if (!statSync(abs, { throwIfNoEntry: false })?.isDirectory()) return [];
    const out: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(join(abs, dir))) {
        if (SKIP_DIRS.has(name)) continue;
        const rel = dir ? `${dir}/${name}` : name;
        if (statSync(join(abs, rel)).isDirectory()) walk(rel);
        else out.push(`${root}/${rel}`);
      }
    };
    walk('');
    return out;
  };
  return { list, read: (path) => readFileSync(join(base, path), 'utf8') };
}

function topDirs(repo: FileRepo, base: string): string[] {
  // `list` only returns files, so a directory shows up as the prefix of one.
  const seen = new Set<string>();
  for (const path of repo.list(base)) {
    const name = path.slice(base.length + 1).split('/')[0];
    if (name) seen.add(name);
  }
  return [...seen];
}

/**
 * The roots that need coverage: each package's and each app's `src`
 * directory, wherever one exists, plus `tooling/` and `.claude/`.
 */
export function roots(repo: FileRepo): string[] {
  const under = (base: string, sub: string) =>
    topDirs(repo, base)
      .map((name) => `${base}/${name}/${sub}`)
      .filter((root) => repo.list(root).length > 0);
  return [...under('packages', 'src'), ...under('apps', 'src'), 'tooling', '.claude'];
}

/** The files under `roots` that a line in `INDEX.md` has to cover. */
export function sourcePaths(repo: FileRepo, rootPaths: readonly string[]): string[] {
  const paths: string[] = [];
  for (const root of rootPaths) for (const path of repo.list(root)) paths.push(path);
  return paths.filter((path) => !SKIP_FILES.test(path)).sort();
}

/** The directories that hold `paths`, each as its full path. */
export function directoriesOf(paths: readonly string[]): string[] {
  return [...new Set(paths.map((path) => path.split('/').slice(0, -1).join('/')))].sort();
}

/**
 * The directories named nowhere in `index`. A directory is named by its full
 * path followed by a `/` that doesn't start a longer path, so a line for
 * `packages/engine/src/` doesn't name `packages/engine/src/audio/`.
 */
export function uncoveredDirectories(dirs: readonly string[], index: string): string[] {
  return dirs.filter((dir) => {
    const escaped = dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return !new RegExp(`(^|[^\\w./-])${escaped}/(?![\\w.-])`).test(index);
  });
}

/** The docs (`docs/**` `.md`) that `index` doesn't link, by their path under `docs/`. */
export function unlinkedDocs(docPaths: readonly string[], index: string): string[] {
  return docPaths.filter((path) => !index.includes(`](${path.slice('docs/'.length)})`));
}

/** The source files that don't open with a comment saying what they are. */
export function headless(paths: readonly string[], read: (path: string) => string): string[] {
  return paths.filter((path) => {
    if (!/\.(ts|mjs|svelte)$/.test(path)) return false;
    const text = read(path).trimStart();
    const opening = path.endsWith('.svelte') ? text.replace(/^<script[^>]*>\s*/, '') : text;
    return !/^(\/\*|\/\/|<!--)/.test(opening) && !/^<!--/.test(text);
  });
}

/** What the real repository at `base` lacks in `docs/INDEX.md` or in its files' headers. */
export function gapsInRepo(base: string): {
  directories: string[];
  docs: string[];
  headless: string[];
} {
  const repo = diskRepo(base);
  const paths = sourcePaths(repo, roots(repo));
  const index = repo.read('docs/INDEX.md');
  const docPaths = repo
    .list('docs')
    .filter((path) => path.endsWith('.md'))
    .sort();
  return {
    directories: uncoveredDirectories(directoriesOf(paths), index),
    docs: unlinkedDocs(docPaths, index),
    headless: headless(paths, repo.read),
  };
}
