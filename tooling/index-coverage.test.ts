import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  diskRepo,
  directoriesOf,
  gapsInRepo,
  headless,
  roots,
  sourcePaths,
  uncoveredDirectories,
  unlinkedDocs,
  type FileRepo,
} from './index-coverage.ts';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/** A `FileRepo` over an in-memory tree, `path -> content`. */
function fakeRepo(files: Record<string, string>): FileRepo {
  return {
    list: (root) => Object.keys(files).filter((p) => p.startsWith(`${root}/`)),
    read: (path) => files[path] ?? '',
  };
}

describe('sourcePaths', () => {
  it('lists the files under a root, skipping tests and config', () => {
    const repo = fakeRepo({
      'packages/theory/src/helix.ts': '',
      'packages/theory/src/helix.test.ts': '',
      'apps/web/src/App.svelte': '',
      'apps/web/src/App.e2e.ts': '',
      'tooling/pages.ts': '',
      'tooling/package.json': '',
    });
    expect(sourcePaths(repo, ['packages/theory/src', 'apps/web/src', 'tooling'])).toEqual([
      'apps/web/src/App.svelte',
      'packages/theory/src/helix.ts',
      'tooling/pages.ts',
    ]);
  });
});

describe('roots', () => {
  it('expands packages/*/src and apps/*/src to the packages and apps that have one', () => {
    const repo = fakeRepo({
      'packages/theory/src/helix.ts': '',
      'packages/engine/src/band.ts': '',
      'packages/engine/experiments/performance.ts': '',
      'apps/web/src/App.svelte': '',
      'tooling/pages.ts': '',
      '.claude/settings.json': '',
    });
    expect(roots(repo).sort()).toEqual(
      ['.claude', 'apps/web/src', 'packages/engine/src', 'packages/theory/src', 'tooling'].sort(),
    );
  });
});

describe('directoriesOf', () => {
  it('gives each directory that holds a file once', () => {
    expect(
      directoriesOf(['tooling/pages.ts', 'tooling/lint.ts', 'apps/web/src/audio/output.ts']),
    ).toEqual(['apps/web/src/audio', 'tooling']);
  });
});

describe('uncoveredDirectories', () => {
  it('finds a directory named nowhere in the index, by its full path', () => {
    const index = 'The engine, `packages/engine/src/`: the machines.';
    expect(uncoveredDirectories(['packages/engine/src'], index)).toEqual([]);
    expect(uncoveredDirectories(['packages/theory/src'], index)).toEqual(['packages/theory/src']);
  });

  it('is shown firing: a new directory with no line in the index is caught', () => {
    const repo = fakeRepo({
      'apps/web/src/App.svelte': '',
      'apps/web/src/brand_new/thing.ts': '',
    });
    const dirs = directoriesOf(sourcePaths(repo, ['apps/web/src']));
    const index = 'The app is `apps/web/src/`.';
    expect(uncoveredDirectories(dirs, index)).toEqual(['apps/web/src/brand_new']);
  });

  it('does not count a parent directory or a longer path as naming a child', () => {
    expect(uncoveredDirectories(['apps/web/src/audio'], 'the app is `apps/web/src/`')).toEqual([
      'apps/web/src/audio',
    ]);
    expect(uncoveredDirectories(['apps/web/src'], 'the audio is `apps/web/src/audio/`')).toEqual([
      'apps/web/src',
    ]);
  });
});

describe('unlinkedDocs', () => {
  it('is shown firing: a doc the index does not link is caught, and one of the same name elsewhere is not it', () => {
    const index = '- [`theory.md`](memory/theory.md): the memory page';
    expect(unlinkedDocs(['docs/memory/theory.md'], index)).toEqual([]);
    expect(unlinkedDocs(['docs/theory.md'], index)).toEqual(['docs/theory.md']);
  });
});

describe('headless', () => {
  const files: Record<string, string> = {
    'a.ts': '/** What a is. */\nexport {};',
    'b.ts': '// What b is.\nexport {};',
    'c.ts': "import { x } from './x.ts';",
    'd.svelte': '<!-- What d is. -->\n<script></script>',
    'e.svelte': '<script lang="ts">\n  // What e is.\n</script>',
    'f.svelte': '<script lang="ts">\n  import x from "x";\n</script>',
    'g.sh': '#!/bin/sh',
  };
  it('is shown firing: a source file that opens without a comment is caught', () => {
    expect(headless(Object.keys(files), (path) => files[path]!)).toEqual(['c.ts', 'f.svelte']);
  });
});

describe('the real repository', () => {
  it('names every source directory and every doc in docs/INDEX.md, and every source file has a header', () => {
    expect(gapsInRepo(repoRoot)).toEqual({ directories: [], docs: [], headless: [] });
  });

  it('walks the real filesystem the same way the fake repo does', () => {
    const repo = diskRepo(repoRoot);
    expect(repo.list('packages/theory/src')).toContain('packages/theory/src/helix.ts');
    expect(repo.read('docs/INDEX.md')).toContain('# Index');
  });
});
