import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../.claude/skills/review-pr/prepare.sh', import.meta.url));

const identity = {
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};
const passing = 'echo "      Tests  12 passed (12)"';

let root: string;
let clone: string;

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, env: { ...process.env, ...identity }, encoding: 'utf8' }).trim();

function commit(file: string, text: string, message: string) {
  writeFileSync(join(clone, file), text);
  git(clone, 'add', file);
  git(clone, 'commit', '-q', '-m', message);
}

/**
 * Runs prepare.sh in the clone, with `verify` standing in for install and
 * `pnpm verify`, and `e2e`, when given, for `pnpm e2e`.
 */
function prepare(args: string[], verify = passing, input?: string, e2e?: string) {
  const run = spawnSync('sh', input === undefined ? [script, ...args] : ['-s', '--', ...args], {
    cwd: clone,
    input,
    env: { ...process.env, ...identity, JAMBOT_VERIFY: verify, ...(e2e && { JAMBOT_E2E: e2e }) },
    encoding: 'utf8',
  });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

// An origin with main and a pull request #7 (a branch `feature`, also at
// refs/pull/7/head as GitHub has it), and a clone of it to run from.
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'review-pr-'));
  const origin = join(root, 'origin.git');
  clone = join(root, 'clone');
  git(root, 'init', '-q', '--bare', '-b', 'main', origin);
  git(root, 'clone', '-q', origin, clone);
  commit('shared.txt', 'one\n', 'Base');
  git(clone, 'push', '-q', 'origin', 'HEAD:main');
  git(clone, 'checkout', '-q', '-b', 'feature');
  commit('shared.txt', 'two\n', 'Step 1: change the shared file');
  for (let i = 0; i < 35; i++) writeFileSync(join(clone, `file-${i}.txt`), `${i}\n`);
  git(clone, 'add', '.');
  git(clone, 'commit', '-q', '-m', 'Step 2: add 35 files');
  commit('last.txt', 'last\n', 'Step 3: the last file');
  git(clone, 'push', '-q', 'origin', 'feature', 'feature:refs/pull/7/head');
  git(clone, 'checkout', '-q', 'main');
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('review-pr prepare.sh', () => {
  it('checks out a pull request by number and lists every commit and every file', () => {
    const { status, stdout } = prepare(['7', join(root, 'wt')]);
    expect(status).toBe(0);
    expect(stdout).toContain(`Reviewing 7 at ${git(clone, 'rev-parse', '--short', 'feature')}`);
    for (const step of ['Step 1', 'Step 2', 'Step 3']) expect(stdout).toContain(step);
    for (const file of ['shared.txt', 'file-0.txt', 'file-34.txt', 'last.txt'])
      expect(stdout).toContain(file);
  });

  it('reports the unit and the end-to-end test counts', () => {
    const { stdout } = prepare(
      ['7', join(root, 'wt')],
      passing,
      undefined,
      'echo "  3 passed (1.2s)"',
    );
    expect(stdout).toContain('pnpm verify passes (Tests 12 passed (12))');
    expect(stdout).toContain('pnpm e2e passes (3 passed (1.2s))');
  });

  it('reports failing end-to-end tests apart from verify', () => {
    const e2e = 'echo "  1 failed"; echo "  2 passed (1.2s)"; exit 1';
    const { stdout } = prepare(['7', join(root, 'wt')], passing, undefined, e2e);
    expect(stdout).toContain('pnpm verify passes');
    expect(stdout).toContain('pnpm e2e FAILS (1 failed; 2 passed (1.2s))');
  });

  it('leaves end-to-end tests out where the repository has none', () => {
    expect(prepare(['7', join(root, 'wt')]).stdout).not.toContain('pnpm e2e');
  });

  it('says when verify fails, and shows the end of its output', () => {
    const { status, stdout } = prepare(['7', join(root, 'wt')], 'echo the build broke; exit 1');
    expect(status).toBe(0);
    expect(stdout).toContain('pnpm verify FAILS');
    expect(stdout).toContain('the build broke');
  });

  it('warns when main has moved past the merge base, and names the conflicts', () => {
    commit('shared.txt', 'three\n', 'Main moves on');
    git(clone, 'push', '-q', 'origin', 'main');
    const { stdout } = prepare(['7', join(root, 'wt')]);
    expect(stdout).toContain('Behind main by 1 commit');
    expect(stdout).toContain('conflicts with main in: shared.txt');
  });

  it('says a pull request behind main merges cleanly when it does', () => {
    commit('other.txt', 'x\n', 'Main moves on elsewhere');
    git(clone, 'push', '-q', 'origin', 'main');
    const { stdout } = prepare(['7', join(root, 'wt')]);
    expect(stdout).toContain('Behind main by 1 commit');
    expect(stdout).toContain('merges with main cleanly');
  });

  it('does not warn when the pull request is up to date with main', () => {
    expect(prepare(['7', join(root, 'wt')]).stdout).not.toContain('Behind main');
  });

  it('scopes the commits and the diff with --from', () => {
    const from = git(clone, 'rev-parse', 'feature~1');
    const { stdout } = prepare(['7', '--from', from, join(root, 'wt')]);
    expect(stdout).toContain(`Scope: ${from.slice(0, 7)}..`);
    expect(stdout).toContain('Step 3');
    expect(stdout).not.toContain('Step 1');
    expect(stdout).not.toContain('file-0.txt');
    // The printed diff command shows the scoped change and nothing else.
    const diff = /^Diff: (git .*)$/m.exec(stdout)![1]!;
    expect(
      execFileSync('sh', ['-c', diff.replace(' diff ', ' diff --name-only ')], {
        encoding: 'utf8',
      }),
    ).toBe('last.txt\n');
  });

  it('leaves main out of --from, after main was merged into the pull request', () => {
    const from = git(clone, 'rev-parse', 'feature~1');
    commit('other.txt', 'x\n', 'Main moves on elsewhere');
    git(clone, 'push', '-q', 'origin', 'main');
    git(clone, 'checkout', '-q', 'feature');
    git(clone, 'merge', '-q', '--no-edit', 'main');
    git(clone, 'push', '-q', 'origin', 'feature:refs/pull/7/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', '--from', from, join(root, 'wt')]);
    expect(stdout).toContain('(2 of 4 commits)');
    expect(stdout).toContain('Step 3');
    expect(stdout).toContain('last.txt');
    expect(stdout).not.toContain('Main moves on elsewhere');
    expect(stdout).not.toContain('other.txt');
    expect(stdout).not.toContain('Behind main');
    const diff = /^Diff: (git .*)$/m.exec(stdout)![1]!;
    expect(
      execFileSync('sh', ['-c', diff.replace(' diff ', ' diff --name-only ')], {
        encoding: 'utf8',
      }),
    ).toBe('last.txt\n');
  });

  it('limits --from to the files it touched when <commit> conflicts with main', () => {
    const from = git(clone, 'rev-parse', 'feature~1');
    commit('shared.txt', 'three\n', 'Main changes the shared file too');
    commit('last.txt', 'main\n', 'Main adds the last file too');
    git(clone, 'push', '-q', 'origin', 'main');
    git(clone, 'checkout', '-q', 'feature');
    git(clone, 'merge', '-q', '-X', 'ours', '--no-edit', 'main');
    git(clone, 'push', '-q', 'origin', 'feature:refs/pull/7/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', '--from', from, join(root, 'wt')]);
    expect(stdout).toContain('does not merge with main cleanly');
    expect(stdout).toContain("may show main's changes in: last.txt\n");
    const diff = /^Diff: (git .*)$/m.exec(stdout)![1]!;
    expect(
      execFileSync('sh', ['-c', diff.replace(' diff ', ' diff --name-only ')], {
        encoding: 'utf8',
      }),
    ).toBe('last.txt\n');
  });

  it('checks out a branch by name', () => {
    const { status, stdout } = prepare(['feature', join(root, 'wt')]);
    expect(status).toBe(0);
    expect(stdout).toContain('Reviewing feature at');
  });

  it('fails cleanly for a branch that does not exist', () => {
    const { status, stderr } = prepare(['no-such-branch', join(root, 'wt')]);
    expect(status).toBe(1);
    expect(stderr).toContain('could not fetch');
  });

  it('runs from main when piped to sh, for a checkout that does not have it', () => {
    const { status, stdout } = prepare(
      ['7', join(root, 'wt')],
      passing,
      readFileSync(script, 'utf8'),
    );
    expect(status).toBe(0);
    expect(stdout).toContain('Reviewing 7 at');
  });
});
