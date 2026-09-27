import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  diskRepo,
  roots,
  sourcePaths,
  uncovered,
  uncoveredInRepo,
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

describe('uncovered', () => {
  it('finds a path named nowhere in the index, by its path or its own name', () => {
    const index = 'src/helix.ts: the helix\nsrc/deep/nested.ts is named by its path here';
    expect(uncovered(['packages/theory/src/helix.ts'], index)).toEqual([]);
    expect(uncovered(['packages/theory/src/deep/nested.ts'], index)).toEqual([]);
    expect(uncovered(['packages/theory/src/gaps.ts'], index)).toEqual([
      'packages/theory/src/gaps.ts',
    ]);
  });

  it('is shown firing: a new file with no line in the index is caught', () => {
    const repo = fakeRepo({
      'packages/theory/src/helix.ts': '',
      'packages/theory/src/brand_new.ts': '',
    });
    const index = 'The theory package has `src/helix.ts`, the helix.';
    expect(uncovered(sourcePaths(repo, ['packages/theory/src']), index)).toEqual([
      'packages/theory/src/brand_new.ts',
    ]);
  });
});

describe('the real repository', () => {
  it('has a line in docs/INDEX.md for every source file', () => {
    expect(uncoveredInRepo(repoRoot)).toEqual([]);
  });

  it('walks the real filesystem the same way the fake repo does', () => {
    const repo = diskRepo(repoRoot);
    expect(repo.list('packages/theory/src')).toContain('packages/theory/src/helix.ts');
    expect(repo.read('docs/INDEX.md')).toContain('# Index');
  });
});
