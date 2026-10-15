/**
 * `pnpm verify`: lint, format check, typecheck and build run side by side,
 * then the tests. The static stages share nothing and are mostly
 * single-threaded, so together they take as long as the slowest. The tests
 * come after them, not beside them: they take every core, and a suite with
 * timing in it fails when starved. Nothing is skipped: the tests run unless
 * a static stage has failed, which is enough to fix first.
 *
 * The output holds each stage's until it ends, and ends with the stages that
 * failed, whole, so a reader of the tail (`review-pr`, the pre-push hook)
 * finds the failure. The tests' output is shown even when they pass, for the
 * counts `review-pr` reports, and the summary line names how many passed.
 *
 * A checkout with no `node_modules`, as a git worktree an agent opens, is
 * installed first (`plan`). A tree that passed is remembered where the
 * pre-push hook (`.githooks/pre-push`) keeps its own, so a push right after a
 * verify by hand doesn't run it again (`workingTree`, `remember`).
 */
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Stage {
  name: string;
  command: string;
}

export interface Outcome extends Stage {
  ok: boolean;
  seconds: number;
  output: string;
}

/** The stages of a group run together; the groups run one after another. */
export const GROUPS: Stage[][] = [
  [
    { name: 'check', command: 'pnpm check' },
    { name: 'lint', command: 'pnpm lint' },
    { name: 'format', command: 'pnpm format:check' },
    { name: 'build', command: 'pnpm build' },
  ],
  [{ name: 'test', command: 'pnpm test' }],
];

/** What a checkout without `node_modules` runs before anything else. */
export const INSTALL: Stage = { name: 'install', command: 'pnpm install --frozen-lockfile' };

/** The groups to run: `groups`, after an install when nothing is installed. */
export function plan(installed: boolean, groups: Stage[][] = GROUPS): Stage[][] {
  return installed ? groups : [[INSTALL], ...groups];
}

function runStage(stage: Stage): Promise<Outcome> {
  return new Promise((done) => {
    const started = Date.now();
    let output = '';
    const end = (ok: boolean) =>
      done({ ...stage, ok, seconds: (Date.now() - started) / 1000, output });
    const child = spawn('sh', ['-c', stage.command], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk: Buffer) => (output += chunk));
    child.stderr.on('data', (chunk: Buffer) => (output += chunk));
    child.on('error', (error) => {
      output += String(error);
      end(false);
    });
    child.on('close', (code) => end(code === 0));
  });
}

/** Runs the groups in turn, each group's stages at once, and stops after a group with a failure. */
export async function verify(groups: readonly (readonly Stage[])[]): Promise<Outcome[]> {
  const outcomes: Outcome[] = [];
  for (const group of groups) {
    outcomes.push(...(await Promise.all(group.map(runStage))));
    if (outcomes.some((o) => !o.ok)) break;
  }
  return outcomes;
}

/** How many tests passed, read off vitest's summary line (`Tests  12 passed (12)`), if there is one. */
export function passedTests(output: string): number | undefined {
  const match = /^ *Tests +(?:\d+ failed \| )?(\d+) passed/m.exec(output);
  return match ? Number(match[1]) : undefined;
}

/**
 * What to print: the tests whole if they passed, a line for each stage that
 * passed, then each that failed whole, and a summary line that names the
 * count of tests passed. `notes` go just above the summary.
 */
export function report(
  outcomes: readonly Outcome[],
  groups: readonly (readonly Stage[])[] = GROUPS,
  notes: readonly string[] = [],
): string {
  const lines: string[] = [];
  const time = (o: Outcome) => `${o.seconds.toFixed(1)} s`;
  for (const o of outcomes) if (o.ok && o.name === 'test') lines.push(o.output.trimEnd());
  for (const o of outcomes) if (o.ok) lines.push(`✓ ${o.name} (${time(o)})`);
  const ran = new Set(outcomes.map((o) => o.name));
  for (const stage of groups.flat())
    if (!ran.has(stage.name)) lines.push(`- ${stage.name} skipped`);
  for (const o of outcomes)
    if (!o.ok) lines.push(`✗ ${o.name} (${time(o)})\n${o.output.trimEnd()}`);
  lines.push(...notes);
  const failed = outcomes.filter((o) => !o.ok).map((o) => o.name);
  const tests = passedTests(outcomes.find((o) => o.name === 'test')?.output ?? '');
  lines.push(
    failed.length
      ? `verify failed: ${failed.join(', ')}`
      : `verify passed${tests === undefined ? '' : `: ${tests} tests passed`}`,
  );
  return lines.join('\n');
}

function git(dir: string, ...args: string[]): string {
  const run = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  if (run.status !== 0) throw new Error(`git ${args.join(' ')}: ${run.stderr}`);
  return run.stdout.trim();
}

/**
 * The tree of the tracked files as they stand on disk: HEAD's when none has
 * changed, else the tree a commit of every change would have (`git stash
 * create` writes it and moves no ref). Untracked files are not in it, as the
 * pre-push hook doesn't look at them either. Undefined outside a repository
 * or before the first commit.
 */
export function workingTree(dir: string): string | undefined {
  try {
    return git(dir, 'rev-parse', `${git(dir, 'stash', 'create') || 'HEAD'}^{tree}`);
  } catch {
    return undefined;
  }
}

/** The pre-push hook's record of the trees that passed: one hash to a line, in the git directory. */
export function stampsPath(dir: string): string {
  return join(git(dir, 'rev-parse', '--absolute-git-dir'), 'jambot-verified');
}

/** Records `tree` as passed, once, where the pre-push hook looks before running verify. */
export function remember(dir: string, tree: string): void {
  const path = stampsPath(dir);
  const known = existsSync(path) ? readFileSync(path, 'utf8').split('\n') : [];
  if (!known.includes(tree)) appendFileSync(path, `${tree}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const installed = existsSync(join(root, 'node_modules'));
  if (!installed)
    console.log(
      'verify: no node_modules in this checkout (a git worktree starts with none), so pnpm install --frozen-lockfile runs first',
    );
  const groups = plan(installed);
  const tree = workingTree(root);
  const outcomes = await verify(groups);
  const passed = outcomes.every((o) => o.ok);
  const notes: string[] = [];
  // A tree edited while the stages ran is not the one they passed.
  if (passed && tree && workingTree(root) === tree) {
    remember(root, tree);
    notes.push(
      `tree ${tree.slice(0, 7)} remembered, so the pre-push hook doesn't run verify on it again`,
    );
  }
  console.log(report(outcomes, groups, notes));
  process.exitCode = passed ? 0 : 1;
}
