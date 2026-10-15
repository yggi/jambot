import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  GROUPS,
  INSTALL,
  passedTests,
  plan,
  remember,
  report,
  stampsPath,
  verify,
  workingTree,
  type Stage,
} from './verify.ts';

const stage = (name: string, command: string): Stage => ({ name, command });

describe('verify', () => {
  it('runs the stages of a group at the same time', async () => {
    const started = Date.now();
    const outcomes = await verify([[stage('a', 'sleep 1'), stage('b', 'sleep 1')]]);
    expect(outcomes.map((o) => o.ok)).toEqual([true, true]);
    expect(Date.now() - started).toBeLessThan(1800);
  });

  it('runs the groups one after another', async () => {
    const outcomes = await verify([
      [stage('a', 'sleep 0.3; echo first')],
      [stage('b', 'echo second')],
    ]);
    expect(outcomes.map((o) => o.name)).toEqual(['a', 'b']);
    expect(outcomes[1]!.output).toBe('second\n');
  });

  it('lets the stages of a group all end when one fails, then stops', async () => {
    const groups = [
      [stage('bad', 'echo broken; exit 1'), stage('slow', 'sleep 0.3; echo done')],
      [stage('after', 'echo never')],
    ];
    const outcomes = await verify(groups);
    expect(outcomes.map((o) => [o.name, o.ok])).toEqual([
      ['bad', false],
      ['slow', true],
    ]);
    const text = report(outcomes, groups);
    expect(text).toContain('- after skipped');
    expect(text).toContain('verify failed: bad');
    // The failure is at the end, whole, where a reader of the tail finds it.
    expect(text.indexOf('✓ slow')).toBeLessThan(text.indexOf('✗ bad'));
    expect(text.indexOf('✗ bad')).toBeLessThan(text.indexOf('broken'));
  });

  it('fails a stage whose command does not exist', async () => {
    const [outcome] = await verify([[stage('missing', 'no-such-command-anywhere')]]);
    expect(outcome!.ok).toBe(false);
  });

  it('shows the tests whole when they pass, for their counts, and only a line for the rest', async () => {
    const groups = [
      [stage('lint', 'echo lint noise')],
      [stage('test', 'echo "      Tests  12 passed (12)"')],
    ];
    const text = report(await verify(groups), groups);
    expect(text).toContain('Tests  12 passed (12)');
    expect(text).not.toContain('lint noise');
    expect(text.endsWith('\nverify passed: 12 tests passed')).toBe(true);
  });

  it("reads the count of tests passed off vitest's summary line, beside skipped ones too", () => {
    expect(
      passedTests(' Test Files  3 passed (3)\n      Tests  1200 passed | 3 skipped (1203)\n'),
    ).toBe(1200);
    expect(passedTests('      Tests  1 failed | 3 passed (4)')).toBe(3);
    expect(passedTests('no summary here')).toBeUndefined();
  });

  it('puts notes just above the summary line, which stays last', () => {
    const outcomes = [
      { ...stage('test', ''), ok: true, seconds: 1, output: 'Tests  2 passed (2)' },
    ];
    const lines = report(outcomes, [[stage('test', '')]], ['a note']).split('\n');
    expect(lines.slice(-2)).toEqual(['a note', 'verify passed: 2 tests passed']);
  });

  it('installs first, alone, in a checkout without node_modules, and not where it has them', () => {
    expect(plan(true)).toEqual(GROUPS);
    expect(plan(false)).toEqual([[INSTALL], ...GROUPS]);
    expect(INSTALL.command).toBe('pnpm install --frozen-lockfile');
  });

  it('runs nothing else when the install fails', async () => {
    const groups = [
      [stage('install', 'echo no access to the repository; exit 1')],
      [stage('test', 'echo ran')],
    ];
    const outcomes = await verify(groups);
    expect(outcomes.map((o) => o.name)).toEqual(['install']);
    expect(report(outcomes, groups)).toContain('- test skipped');
  });

  it('holds every stage verify is meant to run', () => {
    expect(
      GROUPS.flat()
        .map((s) => s.command)
        .sort(),
    ).toEqual(['pnpm build', 'pnpm check', 'pnpm format:check', 'pnpm lint', 'pnpm test']);
  });
});

describe('the tree verify passed', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  function git(dir: string, ...args: string[]) {
    const run = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
    if (run.status !== 0) throw new Error(run.stderr);
    return run.stdout.trim();
  }

  function repo() {
    const dir = mkdtempSync(join(tmpdir(), 'jambot-verify-'));
    dirs.push(dir);
    git(dir, 'init', '-q');
    git(dir, 'config', 'user.email', 'verify@test');
    git(dir, 'config', 'user.name', 'verify');
    writeFileSync(join(dir, 'a.ts'), 'a\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-qm', 'a');
    return dir;
  }

  it("is HEAD's tree when nothing tracked has changed, untracked files aside", () => {
    const dir = repo();
    writeFileSync(join(dir, 'scratch.txt'), 'x\n');
    expect(workingTree(dir)).toBe(git(dir, 'rev-parse', 'HEAD^{tree}'));
  });

  it('is the tree the commit of the changes on disk will have, so the push of that commit finds it', () => {
    const dir = repo();
    writeFileSync(join(dir, 'a.ts'), 'edited\n');
    const tree = workingTree(dir);
    expect(tree).not.toBe(git(dir, 'rev-parse', 'HEAD^{tree}'));
    git(dir, 'commit', '-qam', 'edit');
    expect(git(dir, 'rev-parse', 'HEAD^{tree}')).toBe(tree);
  });

  it('is not known outside a repository', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jambot-verify-'));
    dirs.push(dir);
    expect(workingTree(dir)).toBeUndefined();
  });

  it('is remembered once, in the file the pre-push hook reads', () => {
    const dir = repo();
    const tree = workingTree(dir)!;
    remember(dir, tree);
    remember(dir, tree);
    expect(stampsPath(dir)).toBe(
      join(git(dir, 'rev-parse', '--absolute-git-dir'), 'jambot-verified'),
    );
    expect(readFileSync(stampsPath(dir), 'utf8')).toBe(`${tree}\n`);
  });
});
