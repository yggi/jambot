import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  commitSite,
  localSite,
  pagesTarget,
  references,
  resolveReference,
  serveSite,
  siteProblems,
  type Site,
} from './pages.ts';

const prototype = readFileSync(
  new URL('../prototype/jambot-prototype.html', import.meta.url),
  'utf8',
);

/** A site built for /jambot/, the way Vite and vite-plugin-pwa write it. */
const built: Record<string, string> = {
  'index.html': `<!doctype html><html><head>
    <link rel="icon" href="/jambot/icon.svg" type="image/svg+xml" />
    <script type="module" crossorigin src="/jambot/assets/index-1a.js"></script>
    <link rel="stylesheet" crossorigin href="/jambot/assets/index-2b.css">
    <link rel="manifest" href="/jambot/manifest.webmanifest">
    <script id="vite-plugin-pwa:register-sw" src="/jambot/registerSW.js"></script>
    </head><body><a href="#top">top</a></body></html>`,
  'prototype.html': '<!doctype html><style>body{font:15px system-ui}</style><main></main>',
  'icon.svg': '<svg/>',
  'icon-192.png': 'png',
  'assets/index-1a.js': 'console.log(1)',
  'assets/index-2b.css': 'body{background:url(data:image/png;base64,AA)}',
  'manifest.webmanifest': JSON.stringify({
    start_url: '/jambot/',
    scope: '/jambot/',
    icons: [{ src: 'icon-192.png' }],
  }),
  'registerSW.js': `navigator.serviceWorker.register('/jambot/sw.js', { scope: '/jambot/' })`,
  'sw.js':
    'define(["./workbox-9c"],function(e){e.precacheAndRoute([{url:"prototype.html",revision:"52"},' +
    '{url:"assets/index-1a.js",revision:null}],{}),' +
    'e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))})',
  'workbox-9c.js': 'define(["exports"],function(t){})',
};

const siteOf =
  (files: Record<string, string>): Site =>
  async (path) =>
    files[path];

describe('the Pages target', () => {
  it.each([
    ['https://github.com/yggi/jambot', '/jambot/', 'https://yggi.github.io/jambot/'],
    ['https://github.com/yggi/jambot.git', '/jambot/', 'https://yggi.github.io/jambot/'],
    ['git@github.com:yggi/jambot.git', '/jambot/', 'https://yggi.github.io/jambot/'],
    ['http://proxy@127.0.0.1:8080/git/Yggi/jambot', '/jambot/', 'https://yggi.github.io/jambot/'],
    ['https://github.com/yggi/yggi.github.io', '/', 'https://yggi.github.io/'],
  ])('of %s is %s at %s', (remote, base, url) => {
    expect(pagesTarget(remote)).toEqual({ base, url });
  });
});

describe('resolving a reference under the sub-path', () => {
  it.each([
    ['index.html', '/jambot/icon.svg', 'icon.svg'],
    ['index.html', '/jambot/', 'index.html'],
    ['index.html', '/jambot', 'index.html'],
    ['index.html', 'prototype.html?x=1#top', 'prototype.html'],
    ['assets/index.css', '../icon.svg', 'icon.svg'],
    ['assets/index.css', './font.woff2', 'assets/font.woff2'],
    ['sw.js', './workbox-9c.js', 'workbox-9c.js'],
  ])('from %s, %s is %s', (from, ref, path) => {
    expect(resolveReference(from, ref, '/jambot/')).toEqual({ path });
  });

  it.each(['#top', 'data:image/png;base64,AA', 'blob:x', 'mailto:a@b.c', ''])(
    'skips %j, which fetches nothing',
    (ref) => {
      expect(resolveReference('index.html', ref, '/jambot/')).toBeUndefined();
    },
  );

  it.each([
    ['/icon.svg', 'outside /jambot/'],
    ['/jambotx/icon.svg', 'outside /jambot/'],
    ['../icon.svg', 'outside /jambot/'],
    ['https://fonts.googleapis.com/css2?family=IBM+Plex+Sans', 'from outside the site'],
    ['//fonts.gstatic.com/x.woff2', 'from outside the site'],
  ])('refuses %s', (ref, problem) => {
    const resolved = resolveReference('index.html', ref, '/jambot/');
    expect(resolved).toHaveProperty('problem');
    expect((resolved as { problem: string }).problem).toContain(problem);
  });
});

describe('the site check', () => {
  it('passes a site built for its sub-path', async () => {
    expect(await siteProblems(siteOf(built), '/jambot/')).toEqual([]);
  });

  it('fails a site built for / on a sub-path', async () => {
    const forRoot = Object.fromEntries(
      Object.entries(built).map(([path, text]) => [path, text.replaceAll('/jambot/', '/')]),
    );
    // What points outside isn't followed, so the service worker is never reached.
    expect(await siteProblems(siteOf(forRoot), '/jambot/')).toEqual([
      'index.html points at /icon.svg, outside /jambot/',
      'index.html points at /assets/index-1a.js, outside /jambot/',
      'index.html points at /assets/index-2b.css, outside /jambot/',
      'index.html points at /manifest.webmanifest, outside /jambot/',
      'index.html points at /registerSW.js, outside /jambot/',
    ]);
  });

  it('fails a page that fetches fonts from Google', async () => {
    const withFonts = {
      ...built,
      'prototype.html':
        '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans" rel="stylesheet">',
    };
    expect(await siteProblems(siteOf(withFonts), '/jambot/')).toEqual([
      'prototype.html fetches https://fonts.googleapis.com/css2?family=IBM+Plex+Sans from outside the site',
    ]);
  });

  it.each(['prototype.html', 'assets/index-1a.js', 'icon-192.png', 'sw.js', 'workbox-9c.js'])(
    'fails when %s is missing, and names who references it',
    async (path) => {
      const rest = Object.fromEntries(Object.entries(built).filter(([file]) => file !== path));
      const problems = await siteProblems(siteOf(rest), '/jambot/');
      expect(problems).toHaveLength(1);
      expect(problems[0]).toMatch(new RegExp(`^${path.replace('.', '\\.')}, which .* is missing$`));
    },
  );

  it('reads the markup of a page, not its inline scripts', () => {
    const page = `<script src="/jambot/a.js"></script><script>const src='let id;'; x.href = "b.html";</script>`;
    expect(references('index.html', page)).toEqual(['/jambot/a.js']);
  });

  it('reads what the service worker precaches and loads', () => {
    expect(references('sw.js', built['sw.js']!)).toEqual([
      'prototype.html',
      'assets/index-1a.js',
      './workbox-9c.js',
      'index.html',
    ]);
    expect(references('workbox-9c.js', built['workbox-9c.js']!)).toEqual([]);
  });
});

describe('the prototype', () => {
  it("fetches nothing: its fonts are the system's", () => {
    expect(references('prototype.html', prototype)).toEqual([]);
  });
});

const scratch = mkdtempSync(join(tmpdir(), 'jambot-pages-test-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function writeSite(dir: string, files: Record<string, string>) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
}

describe('a built site on disk', () => {
  const dir = join(scratch, 'site');
  writeSite(dir, built);

  it('is checked as it is in memory', async () => {
    expect(await siteProblems(localSite(dir), '/jambot/')).toEqual([]);
  });

  it('is served as Pages serves it: under the sub-path, and 404 for what is not a file', async () => {
    const server = serveSite(dir, '/jambot/');
    await new Promise<void>((done) => server.listen(0, done));
    const { port } = server.address() as AddressInfo;
    const status = async (path: string) => (await fetch(`http://localhost:${port}${path}`)).status;
    try {
      expect(await status('/jambot/')).toBe(200);
      expect(await status('/jambot/prototype.html')).toBe(200);
      expect(await status('/jambot/assets/index-1a.js')).toBe(200);
      expect(await status('/prototype.html')).toBe(404);
      expect(await status('/jambot/missing.html')).toBe(404);
      expect(await status('/jambot/assets')).toBe(404);
    } finally {
      server.close();
    }
  });
});

describe('committing the site to gh-pages', () => {
  const repo = join(scratch, 'repo');
  const dir = join(scratch, 'commit-site');
  mkdirSync(repo);
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
  beforeEach(() => {
    for (const role of ['AUTHOR', 'COMMITTER']) {
      vi.stubEnv(`GIT_${role}_NAME`, 'Jambot');
      vi.stubEnv(`GIT_${role}_EMAIL`, 'jambot@example.com');
    }
  });
  git('init', '--quiet');
  writeFileSync(join(repo, 'README.md'), 'the working tree\n');
  writeSite(dir, { 'index.html': 'one', '.nojekyll': '', 'assets/a.js': 'a' });

  it('commits the whole site as the tree, and leaves the working tree and index alone', () => {
    const first = commitSite(repo, dir, undefined, 'Deploy one');
    expect(first).toBeDefined();
    expect(git('ls-tree', '-r', '--name-only', first!).split('\n')).toEqual([
      '.nojekyll',
      'assets/a.js',
      'index.html',
    ]);
    expect(git('status', '--porcelain')).toBe('?? README.md');
  });

  it('commits on top of the last deploy, and nothing when the site is unchanged', () => {
    const first = commitSite(repo, dir, undefined, 'Deploy one')!;
    expect(commitSite(repo, dir, first, 'Deploy again')).toBeUndefined();
    writeFileSync(join(dir, 'index.html'), 'two');
    const second = commitSite(repo, dir, first, 'Deploy two')!;
    expect(git('rev-parse', `${second}^`)).toBe(first);
    expect(git('show', `${second}:index.html`)).toBe('two');
  });
});
