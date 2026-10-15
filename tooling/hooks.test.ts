import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { remember, workingTree } from './verify.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const failing = 'echo verify ran and failed; exit 1';

const repos: string[] = [];
afterEach(() => {
  for (const dir of repos.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function git(dir: string, ...args: string[]) {
  const run = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  if (run.status !== 0) throw new Error(run.stderr);
  return run.stdout.trim();
}

// The base repository is built once and copied, since building one takes
// most of a test's time in git.
let base: string;
beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), 'jambot-hook-base-'));
  git(base, 'init', '-q');
  git(base, 'config', 'user.email', 'hook@test');
  git(base, 'config', 'user.name', 'hook');
  writeFileSync(join(base, 'README.md'), 'a\n');
  git(base, 'add', '.');
  git(base, 'commit', '-qm', 'base');
  git(base, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

/** A repository whose `origin/main` holds `README.md`, with `files` committed on top of it. */
function repoWith(files: string[]) {
  const dir = mkdtempSync(join(tmpdir(), 'jambot-hook-'));
  repos.push(dir);
  cpSync(base, dir, { recursive: true });
  for (const file of files) writeFileSync(join(dir, file), 'b\n');
  if (files.length > 0) {
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'change');
  }
  return dir;
}

const zero = '0'.repeat(40);

/** Runs git's pre-push hook in `dir` for pushes of `refs`, with the two checks replaced by shell commands. */
function hook(
  dir: string,
  refs: { local?: string; remote?: string } | 'head' = 'head',
  checks: { verify?: string; docs?: string } = {},
) {
  const head = git(dir, 'rev-parse', 'HEAD');
  const { local = head, remote = 'refs/heads/work' } = refs === 'head' ? {} : refs;
  const run = spawnSync('sh', [`${root}/.githooks/pre-push`, 'origin', 'url'], {
    cwd: dir,
    input: `refs/heads/work ${local} ${remote} ${zero}\n`,
    env: {
      ...process.env,
      JAMBOT_VERIFY: checks.verify ?? 'true',
      JAMBOT_VERIFY_DOCS: checks.docs ?? 'true',
    },
    encoding: 'utf8',
  });
  return { status: run.status, stderr: run.stderr };
}

describe('pre-push', () => {
  it('blocks a push when verify fails, and says why', () => {
    const { status, stderr } = hook(repoWith(['a.ts']), 'head', { verify: failing });
    expect(status).toBe(1);
    expect(stderr).toContain('verify ran and failed');
    expect(stderr).toContain('the push was blocked');
  });

  it('keeps the whole output of a failed check, and says where, since its end may miss the failure', () => {
    const dir = repoWith(['a.ts']);
    const long = 'echo the first line failed; for i in $(seq 100); do echo noise $i; done; exit 1';
    const { stderr } = hook(dir, 'head', { verify: long });
    expect(stderr).not.toContain('the first line failed');
    const kept = /full log: (\S+)/.exec(stderr)?.[1];
    expect(kept).toBeDefined();
    expect(readFileSync(kept!, 'utf8')).toContain('the first line failed');
    expect(kept!.startsWith(git(dir, 'rev-parse', '--absolute-git-dir'))).toBe(true);
  });

  it('lets a push through when verify passes', () => {
    expect(hook(repoWith(['a.ts'])).status).toBe(0);
  });

  it('says in one line that verify passed, with the count of tests, for the pull request to quote', () => {
    const dir = repoWith(['a.ts']);
    const passing =
      'echo " Test Files  3 passed (3)"; echo "      Tests  1234 passed | 2 skipped (1236)"';
    const { status, stderr } = hook(dir, 'head', { verify: passing });
    expect(status).toBe(0);
    const short = git(dir, 'rev-parse', '--short', 'HEAD^{tree}');
    expect(stderr.trim()).toBe(
      `pre-push: pnpm verify passed on tree ${short}, 1234 tests passed, so the push goes ahead.`,
    );
  });

  it('says so for the docs check too, and leaves the count out where there is none', () => {
    const { stderr } = hook(repoWith(['notes.md']));
    expect(stderr.trim()).toMatch(
      /^pre-push: the docs check \(markdown alone changed\) passed on tree \w+, so the push goes ahead\.$/,
    );
  });

  it('does not run verify again on a tree a verify by hand passed, and says so', () => {
    const dir = repoWith(['a.ts']);
    // What `pnpm verify` does when it passes.
    remember(dir, workingTree(dir)!);
    const { status, stderr } = hook(dir, 'head', { verify: failing });
    expect(status).toBe(0);
    expect(stderr).toContain('passed pnpm verify before, so it is not run again');
    expect(stderr).not.toContain('verify ran and failed');
  });

  it('finds a tree verify passed before its changes were committed', () => {
    const dir = repoWith(['a.ts']);
    writeFileSync(join(dir, 'a.ts'), 'edited\n');
    remember(dir, workingTree(dir)!);
    git(dir, 'commit', '-qam', 'edit');
    expect(hook(dir, 'head', { verify: failing }).status).toBe(0);
  });

  it('verifies again a commit that leaves out a file a verify by hand passed with', () => {
    const dir = repoWith(['a.ts']);
    writeFileSync(join(dir, 'new.ts'), 'n\n');
    remember(dir, workingTree(dir)!);
    const { status, stderr } = hook(dir, 'head', { verify: failing });
    expect(status).toBe(1);
    expect(stderr).toContain('verify ran and failed');
  });

  it("does not remember HEAD's tree when its check saw an untracked file", () => {
    const dir = repoWith(['a.ts']);
    writeFileSync(join(dir, 'new.ts'), 'n\n');
    expect(hook(dir).status).toBe(0);
    rmSync(join(dir, 'new.ts'));
    expect(hook(dir, 'head', { verify: failing }).status).toBe(1);
  });

  it.each([
    ['deleting a branch', { local: zero, remote: 'refs/heads/work' }],
    ['pushing a tag', { remote: 'refs/tags/v1' }],
    ['the deploy to gh-pages', { remote: 'refs/heads/gh-pages' }],
  ])('does not run verify for %s', (_, refs) => {
    expect(hook(repoWith(['a.ts']), refs, { verify: failing })).toEqual({
      status: 0,
      stderr: '',
    });
  });

  it('refuses to push a commit other than the one checked out', () => {
    const dir = repoWith(['a.ts']);
    const other = git(dir, 'rev-parse', 'origin/main');
    const { status, stderr } = hook(dir, { local: other });
    expect(status).toBe(1);
    expect(stderr).toContain('not the checked out commit');
  });

  it('refuses a push while a tracked file has uncommitted changes', () => {
    const dir = repoWith(['a.ts']);
    writeFileSync(join(dir, 'a.ts'), 'edited\n');
    const { status, stderr } = hook(dir);
    expect(status).toBe(1);
    expect(stderr).toContain('uncommitted');
  });

  it('is not troubled by an untracked file, which the push does not send', () => {
    const dir = repoWith(['a.ts']);
    writeFileSync(join(dir, 'scratch.txt'), 'x\n');
    expect(hook(dir).status).toBe(0);
  });

  it('does not verify a tree twice, so a retried push is free', () => {
    const dir = repoWith(['a.ts']);
    expect(hook(dir).status).toBe(0);
    expect(hook(dir, 'head', { verify: failing }).status).toBe(0);
  });

  it('verifies again once the tree changes', () => {
    const dir = repoWith(['a.ts']);
    expect(hook(dir).status).toBe(0);
    writeFileSync(join(dir, 'b.ts'), 'c\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'more');
    expect(hook(dir, 'head', { verify: failing }).status).toBe(1);
  });

  it('does not remember a tree that failed', () => {
    const dir = repoWith(['a.ts']);
    expect(hook(dir, 'head', { verify: failing }).status).toBe(1);
    expect(hook(dir, 'head', { verify: failing }).status).toBe(1);
  });

  it('runs only the docs check for a branch that changes markdown alone', () => {
    const dir = repoWith(['notes.md']);
    expect(hook(dir, 'head', { verify: failing }).status).toBe(0);
    expect(hook(dir, 'head', { verify: 'true', docs: failing }).status).toBe(1);
  });

  it('runs the docs check through verify, which installs first and ends with its summary', () => {
    const hookText = readFileSync(`${root}/.githooks/pre-push`, 'utf8');
    expect(hookText).toContain('check="${JAMBOT_VERIFY_DOCS:-pnpm verify --docs}"');
  });

  it('runs everything once code changes with the markdown', () => {
    const dir = repoWith(['notes.md', 'a.ts']);
    expect(hook(dir, 'head', { verify: failing, docs: 'true' }).status).toBe(1);
  });

  it('does not remember a tree that only the docs check passed', () => {
    const dir = repoWith(['notes.md']);
    expect(hook(dir).status).toBe(0);
    // The branch then gains code: a new tree, and the full check applies.
    writeFileSync(join(dir, 'a.ts'), 'c\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'code');
    expect(hook(dir, 'head', { verify: failing }).status).toBe(1);
  });

  it('runs its check without the GIT_DIR a linked worktree hands a hook', () => {
    const dir = repoWith(['a.ts']);
    const head = git(dir, 'rev-parse', 'HEAD');
    const run = spawnSync('sh', [`${root}/.githooks/pre-push`, 'origin', 'url'], {
      cwd: dir,
      input: `refs/heads/work ${head} refs/heads/work ${zero}\n`,
      env: {
        ...process.env,
        GIT_DIR: join(dir, '.git'),
        JAMBOT_VERIFY: 'test -z "$GIT_DIR" || { echo GIT_DIR leaked; exit 1; }',
      },
      encoding: 'utf8',
    });
    expect(run.stderr).not.toContain('GIT_DIR leaked');
    expect(run.status).toBe(0);
  });

  it('is what a checkout runs: the install points core.hooksPath at it', () => {
    const scripts = JSON.parse(readFileSync(`${root}/package.json`, 'utf8')).scripts;
    expect(scripts.prepare).toContain('core.hooksPath .githooks');
  });
});

describe('agent settings', () => {
  const settings = JSON.parse(readFileSync(`${root}/.claude/settings.json`, 'utf8'));

  it.each(['push_files', 'create_or_update_file', 'delete_file'])(
    'denies the GitHub tool %s, which writes to the remote without the pre-push hook',
    (name) => {
      expect(settings.permissions.deny).toContain(`mcp__github__${name}`);
    },
  );
});

/** What branch-status.sh says in `dir`. */
function branchStatus(dir: string) {
  const run = spawnSync('sh', [`${root}/.claude/hooks/branch-status.sh`], {
    cwd: dir,
    encoding: 'utf8',
  });
  return run.stdout.trim();
}

/** Commits `name` on the current branch. */
function commit(dir: string, name: string) {
  writeFileSync(join(dir, name), 'x\n');
  git(dir, 'add', '.');
  git(dir, 'commit', '-qm', name);
}

describe('branch-status', () => {
  it('says how far the branch is ahead of origin/main', () => {
    const dir = repoWith(['a.ts']);
    expect(branchStatus(dir)).toMatch(/: 0 behind, 1 ahead of origin\/main \(/);
    expect(branchStatus(dir)).not.toContain(';');
  });

  it('tells a branch that is behind and has work to merge main', () => {
    const dir = repoWith(['a.ts']);
    git(dir, 'checkout', '-q', '-b', 'other', 'origin/main');
    commit(dir, 'main-moves.ts');
    git(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    git(dir, 'checkout', '-q', '-');
    expect(branchStatus(dir)).toContain('1 behind, 1 ahead');
    expect(branchStatus(dir)).toContain('merge origin/main before starting');
  });

  it('tells a branch main already holds to restart from main', () => {
    const dir = repoWith([]);
    git(dir, 'checkout', '-q', '-b', 'old');
    commit(dir, 'merged.ts');
    git(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    commit(dir, 'later-on-main.ts');
    git(dir, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    git(dir, 'reset', '-q', '--hard', 'HEAD~1');
    expect(branchStatus(dir)).toContain('1 behind, 0 ahead');
    expect(branchStatus(dir)).toContain('git checkout -B old origin/main');
  });

  it('tells a checkout that the remote branch has moved', () => {
    const dir = repoWith(['a.ts']);
    const branch = git(dir, 'branch', '--show-current');
    const mine = git(dir, 'rev-parse', 'HEAD');
    commit(dir, 'pushed-elsewhere.ts');
    git(dir, 'update-ref', `refs/remotes/origin/${branch}`, 'HEAD');
    git(dir, 'reset', '-q', '--hard', mine);
    expect(branchStatus(dir)).toContain(
      `origin/${branch} has 1 commits this checkout lacks: git merge --ff-only`,
    );
  });

  it('says so when HEAD is detached or origin/main is not fetched', () => {
    const dir = repoWith([]);
    git(dir, 'update-ref', '-d', 'refs/remotes/origin/main');
    expect(branchStatus(dir)).toContain('origin/main unknown');
    git(dir, 'checkout', '-q', '--detach');
    expect(branchStatus(dir)).toBe('branch: detached HEAD');
  });
});

describe('session-start', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  /**
   * Runs session-start.sh in a fresh repository, with `pnpm` and `uv` replaced
   * by `pnpm` (shell) and a `uv` that fails, and `@yggi/cells` installed or not.
   */
  function sessionStart(pnpm: string, cells: boolean) {
    const dir = repoWith([]);
    const bin = mkdtempSync(join(tmpdir(), 'jambot-bin-'));
    dirs.push(bin);
    for (const [name, body] of [
      ['pnpm', pnpm],
      ['uv', 'exit 1'],
    ] as const) {
      writeFileSync(join(bin, name), `#!/bin/sh\n${body}\n`);
      chmodSync(join(bin, name), 0o755);
    }
    if (cells) {
      mkdirSync(join(dir, 'packages/score/node_modules/@yggi/cells'), { recursive: true });
      writeFileSync(join(dir, 'packages/score/node_modules/@yggi/cells/package.json'), '{}');
    }
    writeFileSync(join(dir, 'AGENTS.md'), 'rules\n');
    mkdirSync(join(dir, 'docs'));
    writeFileSync(join(dir, 'docs/MEMORY.md'), 'memory\n');
    const run = spawnSync('sh', [`${root}/.claude/hooks/session-start.sh`], {
      cwd: dir,
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir, PATH: `${bin}:${process.env.PATH}` },
      encoding: 'utf8',
    });
    return { status: run.status, stdout: run.stdout, stderr: run.stderr };
  }

  it('tells the agent, when the install leaves @yggi/cells missing, that the session lacks yggi/cells and how to attach it', () => {
    const { status, stdout } = sessionStart(
      'echo "fatal: could not read from yggi/cells"; exit 1',
      false,
    );
    // stdout reaches the agent only when the hook exits 0.
    expect(status).toBe(0);
    const line = stdout.split('\n')[0]!;
    expect(line).toContain('@yggi/cells is not installed');
    expect(line).toContain('no access to the private repository yggi/cells');
    expect(line).toContain('add_repo');
    expect(line).toContain('pnpm install --frozen-lockfile');
    expect(stdout).toContain('session-start: dependencies incomplete, @yggi/cells missing');
  });

  it('says nothing of yggi/cells when the install holds it', () => {
    const { status, stdout } = sessionStart('exit 0', true);
    expect(status).toBe(0);
    expect(stdout).not.toContain('yggi/cells');
    expect(stdout).toContain('session-start: dependencies installed');
  });

  it('stops on an install that fails for another reason', () => {
    const { status, stderr } = sessionStart('echo "ERR_PNPM_OUTDATED_LOCKFILE"; exit 1', true);
    expect(status).toBe(1);
    expect(stderr).toContain('ERR_PNPM_OUTDATED_LOCKFILE');
    expect(stderr).toContain('pnpm install failed');
  });
});
