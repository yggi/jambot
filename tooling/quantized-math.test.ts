import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  AUDITED,
  diskSourceRepo,
  riskySources,
  unaudited,
  type SourceRepo,
} from './quantized-math.ts';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function fakeRepo(files: Record<string, string>): SourceRepo {
  return {
    files: (dir) => Object.keys(files).filter((p) => p.startsWith(`${dir}/`)),
    read: (path) => files[path] ?? '',
  };
}

describe('riskySources', () => {
  it('finds a call to a transcendental Math function, outside tests', () => {
    const repo = fakeRepo({
      'packages/engine/src/a.ts': 'export const x = Math.pow(2, 3);\n',
      'packages/engine/src/b.ts': 'export const x = 2 + 3;\n',
      'packages/engine/src/a.test.ts': 'Math.sin(1);\n',
    });
    expect(riskySources(repo, ['packages/engine/src'])).toEqual(['packages/engine/src/a.ts']);
  });
});

describe('unaudited', () => {
  it('is shown firing: a new risky call with no entry in the audit is caught', () => {
    const repo = fakeRepo({
      'packages/engine/src/random.ts': 'Math.sin(1);\n', // audited
      'packages/engine/src/brand_new.ts': 'Math.exp(1);\n', // not
    });
    expect(unaudited(repo, { 'packages/engine/src/random.ts': 'reviewed' })).toEqual([
      'packages/engine/src/brand_new.ts',
    ]);
  });

  it('has an entry, with a reason, for every risky call in the real pure packages', () => {
    const repo = diskSourceRepo(repoRoot);
    expect(unaudited(repo, AUDITED)).toEqual([]);
    for (const reason of Object.values(AUDITED)) expect(reason.length).toBeGreaterThan(20);
  });
});
