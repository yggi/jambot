import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../.claude/skills/review-pr/prepare.sh', import.meta.url));

const identity = {
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};
const passing = 'echo "      Tests  12 passed (12)"';
// CI's check runs, as GitHub's API answers for a commit; by default the lookup fails, as it does offline.
const noCi = 'exit 1';
const checkRuns = (...runs: [name: string, conclusion: string][]) =>
  `echo '${JSON.stringify({
    check_runs: runs.map(([name, conclusion], id) => ({
      id,
      name,
      status: 'completed',
      conclusion,
      html_url: `https://ci/${name}`,
    })),
  })}'`;

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
 * `pnpm verify`, `e2e`, when given, for `pnpm e2e`, and `ci` for the lookup
 * of CI's check runs.
 */
function prepare(args: string[], verify = passing, input?: string, e2e?: string, ci = noCi) {
  const run = spawnSync('sh', input === undefined ? [script, ...args] : ['-s', '--', ...args], {
    cwd: clone,
    input,
    env: {
      ...process.env,
      ...identity,
      JAMBOT_VERIFY: verify,
      JAMBOT_INSTALL: 'echo installed',
      JAMBOT_CI: ci,
      ...(e2e && { JAMBOT_E2E: e2e }),
    },
    encoding: 'utf8',
    // A run left waiting on the lock fails, rather than hang the suite.
    timeout: 15_000,
  });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

/** Runs prepare.sh like `prepare`, without waiting for it. */
function prepareAsync(args: string[], verify: string) {
  const run = spawn('sh', [script, ...args], {
    cwd: clone,
    env: { ...process.env, ...identity, JAMBOT_VERIFY: verify, JAMBOT_CI: noCi },
  });
  let stdout = '';
  let stderr = '';
  run.stdout.on('data', (data: Buffer) => (stdout += data.toString()));
  run.stderr.on('data', (data: Buffer) => (stderr += data.toString()));
  return new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve) =>
    run.on('close', (status) => resolve({ status, stdout, stderr })),
  );
}

// An origin with main and a pull request #7 (a branch `feature`, also at
// refs/pull/7/head as GitHub has it), and a clone of it to run from. It is
// built once and copied for each test, since building it takes half a
// second of git.
let template: string;
beforeAll(() => {
  template = mkdtempSync(join(tmpdir(), 'review-pr-template-'));
  const origin = join(template, 'origin.git');
  clone = join(template, 'clone');
  git(template, 'init', '-q', '--bare', '-b', 'main', origin);
  git(template, 'clone', '-q', origin, clone);
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
afterAll(() => rmSync(template, { recursive: true, force: true }));

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'review-pr-'));
  cpSync(template, root, { recursive: true });
  clone = join(root, 'clone');
  git(clone, 'remote', 'set-url', 'origin', join(root, 'origin.git'));
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

  it("reuses CI's run on the head when verify and the end-to-end checks both passed there", () => {
    const local = 'echo ran locally; exit 1';
    const both = checkRuns(['check', 'success'], ['e2e', 'success']);
    const witnessed = prepare(['7', join(root, 'wt')], local, undefined, local, both);
    expect(witnessed.stdout).toContain(
      "CI passed pnpm verify and pnpm e2e on this commit, so they didn't run here (--verify runs them): https://ci/check",
    );
    expect(witnessed.stdout).not.toContain('ran locally');
    for (const ci of [
      checkRuns(['check', 'success'], ['e2e', 'failure']),
      checkRuns(['check', 'success']),
      noCi,
      'echo not json',
    ]) {
      const { stdout } = prepare(
        ['7', join(root, 'wt')],
        passing,
        undefined,
        'echo "  3 passed"',
        ci,
      );
      expect(stdout).toContain('pnpm verify passes');
      expect(stdout).toContain('pnpm e2e passes');
    }
    const forced = prepare(
      ['7', '--verify', join(root, 'wt')],
      passing,
      undefined,
      undefined,
      both,
    );
    expect(forced.stdout).toContain('pnpm verify passes');
  });

  it('runs no end-to-end checks for a pull request that changes markdown alone, nor asks CI for them', () => {
    git(clone, 'checkout', '-q', '-b', 'docs', 'main');
    commit('notes.md', 'x\n', 'Docs only');
    git(clone, 'push', '-q', 'origin', 'docs');
    git(clone, 'checkout', '-q', 'main');
    const local = prepare(['docs', join(root, 'wt')], passing, undefined, 'echo e2e ran; exit 1');
    expect(local.stdout).toContain('pnpm e2e not run: the pull request changes markdown alone');
    expect(local.stdout).not.toContain('e2e ran');
    const witnessed = prepare(
      ['docs', join(root, 'wt2')],
      'exit 1',
      undefined,
      'exit 1',
      checkRuns(['check', 'success']),
    );
    expect(witnessed.stdout).toContain('CI passed pnpm verify on this commit');
  });

  it('leaves end-to-end tests out where the repository has none', () => {
    expect(prepare(['7', join(root, 'wt')]).stdout).not.toContain('pnpm e2e');
  });

  it('says how to probe the engine from inside its package, where there is one', () => {
    expect(prepare(['7', join(root, 'wt')]).stdout).not.toContain('Probe:');
    git(clone, 'checkout', '-q', 'feature');
    mkdirSync(join(clone, 'packages/engine'), { recursive: true });
    commit('packages/engine/package.json', '{}\n', 'Step 4: an engine');
    git(clone, 'push', '-q', 'origin', '+feature:refs/pull/7/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', join(root, 'wt')]);
    expect(stdout).toContain(`Probe: cd ${join(root, 'wt')}/packages/engine && node `);
    expect(stdout).toContain("from '@jambot/engine'");
  });

  it('starts the probe with an env the band and the transport both run over', () => {
    git(clone, 'checkout', '-q', 'feature');
    mkdirSync(join(clone, 'packages/engine'), { recursive: true });
    commit('packages/engine/package.json', '{}\n', 'Step 4: an engine');
    git(clone, 'push', '-q', 'origin', '+feature:refs/pull/7/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', join(root, 'wt')]);
    const probe = /--input-type=module -e "(.*…)"$/m.exec(stdout)![1]!;
    // Run against this repository's engine, as a reviewer would run it.
    const engine = fileURLToPath(new URL('../packages/engine', import.meta.url));
    const body =
      'const played = transport.advance(env, null, { now: 0, until: 4 }).output.events.length;' +
      ' const written = band.advance(bandEnvAt(env, 0, null), band.initial, null).output.written.length;' +
      ' console.log(played > 0 && written > 0 && even(3, 8).heights.length === 3);';
    const run = spawnSync(
      'node',
      [
        '--experimental-strip-types',
        '--no-warnings',
        '--input-type=module',
        '-e',
        probe.replace('…', body),
      ],
      { cwd: engine, encoding: 'utf8' },
    );
    expect(run.stderr).toBe('');
    expect(run.stdout.trim()).toBe('true');
  });

  it('says how to probe the app from inside it, where there is one', () => {
    expect(prepare(['7', join(root, 'wt')]).stdout).not.toContain('Probe the app:');
    git(clone, 'checkout', '-q', 'feature');
    mkdirSync(join(clone, 'apps/web'), { recursive: true });
    commit('apps/web/package.json', '{}\n', 'Step 4: an app');
    git(clone, 'push', '-q', 'origin', '+feature:refs/pull/7/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', join(root, 'wt')]);
    expect(stdout).toContain(`Probe the app: cd ${join(root, 'wt')}/apps/web && node `);
    expect(stdout).toContain("from './src/hud.ts'");
  });

  it('starts the app’s probe with the view model over bars the band decided, and runs', () => {
    git(clone, 'checkout', '-q', 'feature');
    mkdirSync(join(clone, 'apps/web'), { recursive: true });
    commit('apps/web/package.json', '{}\n', 'Step 4: an app');
    git(clone, 'push', '-q', 'origin', '+feature:refs/pull/7/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', join(root, 'wt')]);
    const probe = /^Probe the app: .*--input-type=module -e "(.*…)"$/m.exec(stdout)![1]!;
    // Run against this repository's app, as a reviewer would run it.
    const app = fileURLToPath(new URL('../apps/web', import.meta.url));
    const body = 'console.log(hudOf({ heard: null, bars, track: env.track }).bar.bar === 0);';
    const run = spawnSync(
      'node',
      [
        '--experimental-strip-types',
        '--no-warnings',
        '--input-type=module',
        '-e',
        probe.replace('…', body),
      ],
      { cwd: app, encoding: 'utf8' },
    );
    expect(run.stderr).toBe('');
    expect(run.stdout.trim()).toBe('true');
  });

  it('says when verify fails, and shows the end of its output', () => {
    const { status, stdout } = prepare(['7', join(root, 'wt')], 'echo the build broke; exit 1');
    expect(status).toBe(0);
    expect(stdout).toContain('pnpm verify FAILS');
    expect(stdout).toContain('the build broke');
  });

  it("shows the failing tests from verify's output, not the lines around them", () => {
    const verify = [
      'echo noise before',
      'echo " FAIL  |engine| src/a.test.ts > breaks"',
      'echo "⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯"',
      'echo " FAIL  |engine| src/a.test.ts > breaks"',
      'echo "Error: Test timed out in 5000ms."',
      'echo " Test Files  1 failed (1)"',
      'echo "      Tests  1 failed | 3 passed (4)"',
      'for i in $(seq 40); do echo noise after; done',
      'exit 1',
    ].join('; ');
    const { stdout } = prepare(['7', join(root, 'wt')], verify);
    expect(stdout).toContain('pnpm verify FAILS (Tests 1 failed | 3 passed (4))');
    expect(stdout).toContain('Error: Test timed out in 5000ms.');
    expect(stdout).not.toContain('noise');
  });

  it('shows the end of the end-to-end output when only it fails', () => {
    const e2e = 'echo "  1) band.e2e.ts plays"; echo "  1 failed"; exit 1';
    const { stdout } = prepare(['7', join(root, 'wt')], 'echo verify noise', undefined, e2e);
    expect(stdout).toContain('1) band.e2e.ts plays');
    expect(stdout).not.toContain('verify noise');
  });

  it('runs one review at a time, so two never share the machine or the end-to-end port', async () => {
    const times = join(root, 'times');
    const verify = `echo start >>${times}; sleep 1; echo end >>${times}; ${passing}`;
    const runs = await Promise.all([
      prepareAsync(['7', join(root, 'a')], verify),
      prepareAsync(['feature', join(root, 'b')], verify),
    ]);
    for (const run of runs) expect(run.status).toBe(0);
    expect(readFileSync(times, 'utf8')).toBe('start\nend\nstart\nend\n');
    expect(runs.map((run) => run.stderr).join('')).toContain('waiting for another review');
  }, 20_000);

  it('fetches and checks out only once it holds the lock, since a fetch fails on a worktree still being added', async () => {
    const lock = join(git(clone, 'rev-parse', '--absolute-git-dir'), 'review-pr.lock');
    mkdirSync(lock);
    writeFileSync(join(lock, 'pid'), `${process.pid}\n`);
    const run = prepareAsync(['7', join(root, 'wt')], passing);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(existsSync(join(root, 'wt'))).toBe(false);
    expect(() => git(clone, 'rev-parse', '--verify', '-q', 'refs/remotes/origin/pr/7')).toThrow();
    rmSync(lock, { recursive: true });
    expect((await run).status).toBe(0);
  }, 20_000);

  it('takes over a lock whose review is gone', () => {
    const lock = join(git(clone, 'rev-parse', '--absolute-git-dir'), 'review-pr.lock');
    mkdirSync(lock);
    // A pid that no process has: above the kernel's limit.
    writeFileSync(join(lock, 'pid'), '99999999\n');
    const { status, stdout } = prepare(['7', join(root, 'wt')]);
    expect(status).toBe(0);
    expect(stdout).toContain('pnpm verify passes');
  }, 20_000);

  it('names the files it conflicts in with another pull request, with --against', () => {
    git(clone, 'checkout', '-q', '-b', 'rival', 'main');
    commit('shared.txt', 'rival\n', 'Rival changes the shared file');
    git(clone, 'push', '-q', 'origin', 'rival', 'rival:refs/pull/8/head');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', '--against', '8', join(root, 'wt')]);
    expect(stdout).toContain('Against 8: conflicts in: shared.txt');
  });

  it('says it merges cleanly with another branch, with --against', () => {
    git(clone, 'checkout', '-q', '-b', 'rival', 'main');
    commit('other.txt', 'rival\n', 'Rival adds another file');
    git(clone, 'push', '-q', 'origin', 'rival');
    git(clone, 'checkout', '-q', 'main');
    const { stdout } = prepare(['7', '--against', 'rival', join(root, 'wt')]);
    expect(stdout).toContain('Against rival: merges cleanly');
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
