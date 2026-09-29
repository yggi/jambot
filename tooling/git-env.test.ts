import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPOSITORY_VARIABLES, withoutRepository } from './git-env.ts';

describe('the repository a test runs git in', () => {
  it('is shown firing: with GIT_DIR set, `git -C <dir>` works on GIT_DIR, not on <dir>', () => {
    const real = mkdtempSync(join(tmpdir(), 'jambot-real-'));
    const other = mkdtempSync(join(tmpdir(), 'jambot-other-'));
    try {
      spawnSync('git', ['init', '-q', real]);
      const env = { ...process.env, GIT_DIR: join(real, '.git') };
      spawnSync('git', ['-C', other, 'init', '-q'], { env });
      const top = (dir: string, environment: NodeJS.ProcessEnv) =>
        spawnSync('git', ['-C', dir, 'rev-parse', '--git-dir'], {
          env: environment,
          encoding: 'utf8',
        }).stdout.trim();
      // With the variable, the throwaway repository was never made: `other` is in no repository.
      expect(top(other, env)).toBe(join(real, '.git'));
      expect(top(other, withoutRepository(env))).not.toBe(join(real, '.git'));
    } finally {
      rmSync(real, { recursive: true, force: true });
      rmSync(other, { recursive: true, force: true });
    }
  });

  it('is scrubbed of every variable that picks a repository', () => {
    const dirty = Object.fromEntries(REPOSITORY_VARIABLES.map((name) => [name, 'x']));
    const clean = withoutRepository({ ...dirty, GIT_AUTHOR_NAME: 'kept', PATH: '/bin' });
    expect(Object.keys(clean).sort()).toEqual(['GIT_AUTHOR_NAME', 'PATH']);
  });

  it('holds for the test process itself, whatever it was started from', () => {
    for (const name of REPOSITORY_VARIABLES) expect(process.env[name]).toBeUndefined();
  });
});
