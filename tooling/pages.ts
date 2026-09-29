/**
 * GitHub Pages without GitHub Actions (docs/MEMORY.md, "Repository and CI"). The site is built here, checked
 * here, and committed to the `gh-pages` branch, which Pages publishes as it
 * is ("Deploy from a branch"). Pages serves the site under a sub-path,
 * `/<repo>/`, so the check is that every file the site references resolves
 * under that sub-path and nothing is fetched from outside it.
 *
 *   pnpm pages build            build for the sub-path into apps/web/dist-pages, and check it
 *   pnpm pages serve            serve that build as Pages would, on http://localhost:4318/<repo>/
 *   pnpm pages deploy           verify, build, check, commit to gh-pages, push, check the live site
 *   pnpm pages check [url]      check the live site
 *
 * `build` and `serve` take `--base /path/`, and `serve` takes `--port n`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Where a repository's Pages site lives: its sub-path and its URL. */
export interface Target {
  base: string;
  url: string;
}

/**
 * The Pages site of the repository a remote URL names. A repository called
 * `<owner>.github.io` is served at the root, any other at `/<repo>/`.
 */
export function pagesTarget(remote: string): Target {
  const match = /[/:]([\w.-]+)\/([\w.-]+?)(\.git)?\/?$/.exec(remote);
  if (!match) throw new Error(`cannot tell the GitHub repository from ${remote}`);
  const owner = match[1]!.toLowerCase();
  const repo = match[2]!;
  const host = `https://${owner}.github.io/`;
  if (repo.toLowerCase() === `${owner}.github.io`) return { base: '/', url: host };
  return { base: `/${repo}/`, url: `${host}${repo}/` };
}

const patterns: Record<string, RegExp[]> = {
  '.html': [/\s(?:href|src)\s*=\s*["']([^"']*)["']/g, /url\(\s*["']?([^"')]+)/g],
  '.css': [/url\(\s*["']?([^"')]+)/g],
  // The service worker and its registration: what it precaches, the modules
  // workbox's loader fetches, the navigation fallback, and where it registers.
  '.js': [
    /\burl:"([^"]+)",revision:/g,
    /\bdefine\(\["(\.\/[^"]+)"/g,
    /createHandlerBoundToURL\("([^"]+)"\)/g,
    /serviceWorker\.register\(\s*["']([^"']+)["']/g,
    /\bscope:\s*["']([^"']+)["']/g,
  ],
};

/** The URLs a site file references, as written in it. */
export function references(path: string, text: string): string[] {
  if (path.endsWith('.webmanifest')) {
    const manifest = JSON.parse(text) as {
      start_url?: string;
      scope?: string;
      icons?: { src: string }[];
    };
    return [manifest.start_url, manifest.scope, ...(manifest.icons ?? []).map((icon) => icon.src)]
      .filter((ref) => ref !== undefined)
      .map(String);
  }
  // In a page, what an inline script says is code, not markup.
  const markup = path.endsWith('.html')
    ? text.replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
    : text;
  const found = (patterns[extname(path)] ?? []).flatMap((pattern) =>
    [...markup.matchAll(pattern)].map(([, ref]) => ref!),
  );
  // workbox's loader adds the extension to the modules it defines.
  return found.map((ref) =>
    ref.startsWith('./workbox-') && !ref.endsWith('.js') ? `${ref}.js` : ref,
  );
}

const ignored = /^(#|data:|blob:|mailto:|tel:|javascript:)/;

/**
 * The site path a reference in `from` resolves to under `base`, or a problem
 * if it leaves the site. A directory stands for its `index.html`, as Pages
 * serves it. Undefined for references that fetch nothing, such as `#top`.
 */
export function resolveReference(
  from: string,
  ref: string,
  base: string,
): { path: string } | { problem: string } | undefined {
  const url = ref.trim().replace(/[?#].*$/, '');
  if (ref.trim() === '' || ignored.test(ref.trim())) return undefined;
  if (/^([a-z][a-z\d+.-]*:|\/\/)/i.test(url))
    return { problem: `${from} fetches ${ref} from outside the site` };
  let path: string;
  if (url.startsWith('/')) {
    if (!`${url}/`.startsWith(base) && !url.startsWith(base))
      return { problem: `${from} points at ${ref}, outside ${base}` };
    path = url.slice(base.length);
  } else {
    path = posix.join(posix.dirname(from), url);
    if (path === '..' || path.startsWith('../'))
      return { problem: `${from} points at ${ref}, outside ${base}` };
  }
  path = posix.normalize(path).replace(/^\.\/?/, '');
  if (path === '' || path.endsWith('/')) path += 'index.html';
  return { path };
}

/** A site's files by path from its root: the text, or undefined if it isn't there. */
export type Site = (path: string) => Promise<string | undefined>;

/** The files Pages serves that nothing references: the entry points. */
export const ENTRIES = ['index.html', 'prototype.html', 'licenses.txt'];

/**
 * What keeps the site from working under `base`: each reference that leaves
 * the site or finds no file, followed from the entry points through HTML,
 * CSS, the web manifest and the service worker.
 */
export async function siteProblems(site: Site, base: string, entries = ENTRIES): Promise<string[]> {
  const problems: string[] = [];
  const seen = new Set(entries);
  const queue = entries.map((path) => ({ path, from: 'the entry points' }));
  for (let next = queue.shift(); next; next = queue.shift()) {
    const text = await site(next.path);
    if (text === undefined) {
      problems.push(`${next.path}, which ${next.from} references, is missing`);
      continue;
    }
    for (const ref of references(next.path, text)) {
      const resolved = resolveReference(next.path, ref, base);
      if (resolved === undefined) continue;
      if ('problem' in resolved) problems.push(resolved.problem);
      else if (!seen.has(resolved.path)) {
        seen.add(resolved.path);
        queue.push({ path: resolved.path, from: next.path });
      }
    }
  }
  return problems;
}

/** A built site in a directory. */
export function localSite(dir: string): Site {
  return async (path) => {
    const file = join(dir, path);
    return existsSync(file) && statSync(file).isFile() ? readFileSync(file, 'utf8') : undefined;
  };
}

/** A live site. `bust` goes into each request's query, past the CDN's cache. */
export function remoteSite(url: string, bust = String(Date.now())): Site {
  return async (path) => {
    const response = await fetch(new URL(`${path}?deploy=${bust}`, url));
    return response.ok ? response.text() : undefined;
  };
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Serves a built site under `base` the way Pages does: a directory as its
 * `index.html`, and 404 for anything else that isn't a file. Unlike `vite
 * preview`, a missing page is not answered with the app's `index.html`, so
 * what doesn't resolve on Pages doesn't resolve here either.
 */
export function serveSite(dir: string, base: string): Server {
  return createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const resolved = resolveReference('index.html', decodeURIComponent(url.pathname), base);
    const file = resolved && 'path' in resolved ? join(dir, resolved.path) : undefined;
    if (file === undefined || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404, { 'Content-Type': types['.txt']! }).end('404: not on the site\n');
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(readFileSync(file));
  });
}

/**
 * Commits a built site as the whole tree of a `gh-pages` commit on top of
 * `parent`, without touching the working tree or the index. Undefined when
 * the site is what `parent` already holds.
 */
export function commitSite(
  repo: string,
  dir: string,
  parent: string | undefined,
  message: string,
): string | undefined {
  const scratch = mkdtempSync(join(tmpdir(), 'jambot-pages-'));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: join(scratch, 'index') };
    const git = (...args: string[]) =>
      execFileSync('git', args, { cwd: repo, env, encoding: 'utf8' }).trim();
    git(`--work-tree=${resolve(dir)}`, 'add', '--all', '--force', '.');
    const tree = git('write-tree');
    if (parent !== undefined && git('rev-parse', `${parent}^{tree}`) === tree) return undefined;
    return git('commit-tree', tree, ...(parent ? ['-p', parent] : []), '-m', message);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

const root = fileURLToPath(new URL('..', import.meta.url));
const siteDir = join(root, 'apps/web/dist-pages');

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function run(command: string, args: string[], env: Record<string, string> = {}): void {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
}

function report(what: string, problems: string[]): boolean {
  if (problems.length === 0) {
    console.log(`pages: ${what} resolves under its sub-path`);
    return true;
  }
  console.error(`pages: ${what} does not work under its sub-path:`);
  for (const problem of problems) console.error(`  ${problem}`);
  return false;
}

/** Builds the web app for `base` into apps/web/dist-pages, and checks it. */
async function build(base: string): Promise<boolean> {
  run('pnpm', ['--filter', '@jambot/web', 'exec', 'vite', 'build', '--outDir', 'dist-pages'], {
    BASE_PATH: base,
  });
  // Pages would run the site through Jekyll, which drops files starting with _.
  writeFileSync(join(siteDir, '.nojekyll'), '');
  return report('the build', await siteProblems(localSite(siteDir), base));
}

/** Waits until the live site serves this build's service worker, then checks it. */
async function checkLive(url: string, base: string, timeoutMs = 10 * 60_000): Promise<boolean> {
  const built = readFileSync(join(siteDir, 'sw.js'), 'utf8');
  const until = Date.now() + timeoutMs;
  console.log(`pages: waiting for ${url} to serve this build`);
  while ((await remoteSite(url)('sw.js')) !== built) {
    if (Date.now() > until) {
      console.error(
        `pages: ${url} still does not serve this build; see the repository's Pages settings`,
      );
      return false;
    }
    await new Promise((done) => setTimeout(done, 10_000));
  }
  return report(url, await siteProblems(remoteSite(url), base));
}

async function deploy(target: Target): Promise<boolean> {
  if (git('status', '--porcelain') !== '') {
    console.error('pages: commit or stash first; the site is built from a commit');
    return false;
  }
  git('fetch', '--quiet', 'origin', 'main');
  const head = git('rev-parse', 'HEAD');
  if (
    spawnSync('git', ['merge-base', '--is-ancestor', head, 'origin/main'], { cwd: root }).status
  ) {
    console.error('pages: HEAD is not on origin/main; the site shows main');
    return false;
  }
  run('pnpm', ['verify']);
  if (!(await build(target.base))) return false;
  const remote = git('ls-remote', 'origin', 'refs/heads/gh-pages');
  if (remote !== '') git('fetch', '--quiet', 'origin', 'gh-pages');
  const parent = remote === '' ? undefined : git('rev-parse', 'FETCH_HEAD');
  const message = `Deploy ${git('log', '-1', '--format=%h %s', head)}\n\nBuilt from ${head} for ${target.base}.`;
  const commit = commitSite(root, siteDir, parent, message);
  if (commit === undefined) console.log('pages: gh-pages already holds this build');
  else {
    run('git', ['push', 'origin', `${commit}:refs/heads/gh-pages`]);
    console.log(`pages: pushed ${commit.slice(0, 7)} to gh-pages`);
  }
  return checkLive(target.url, target.base);
}

function option(args: string[], name: string): string | undefined {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
}

async function main(args: string[]): Promise<boolean> {
  const target = pagesTarget(git('remote', 'get-url', 'origin'));
  const base = option(args, '--base') ?? target.base;
  switch (args[0]) {
    case 'build':
      return build(base);
    case 'serve': {
      const port = Number(option(args, '--port') ?? 4318);
      serveSite(siteDir, base).listen(port, () =>
        console.log(`pages: serving ${siteDir} on http://localhost:${port}${base}`),
      );
      return true;
    }
    case 'deploy':
      return deploy(target);
    case 'check': {
      const url = args[1] ?? target.url;
      const liveBase = args[1] ? new URL(url).pathname : target.base;
      return report(url, await siteProblems(remoteSite(url), liveBase));
    }
    default:
      console.error('usage: pnpm pages build | serve | deploy | check [url]');
      return false;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (ok) => ok || process.exit(1),
    (error: unknown) => {
      console.error(`pages: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    },
  );
}
