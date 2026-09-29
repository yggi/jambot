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
 * counts `review-pr` reports.
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
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

/** What to print: the tests whole if they passed, a line for each stage that passed, then each that failed whole. */
export function report(
  outcomes: readonly Outcome[],
  groups: readonly (readonly Stage[])[] = GROUPS,
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
  const failed = outcomes.filter((o) => !o.ok).map((o) => o.name);
  lines.push(failed.length ? `verify failed: ${failed.join(', ')}` : 'verify passed');
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outcomes = await verify(GROUPS);
  console.log(report(outcomes));
  process.exitCode = outcomes.every((o) => o.ok) ? 0 : 1;
}
