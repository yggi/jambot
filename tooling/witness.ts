/**
 * CI's witness for the deploy on a merge into `main` (`.github/workflows/deploy.yml`): whether the tests CI passed on the
 * pull request's head stand for the deploy's own `pnpm verify`, so a merge doesn't wait on the same tests a third time.
 * They do only when every condition holds, and the deploy runs everything otherwise:
 * - the run is a push to `main`, not a deploy by hand;
 * - a pull request was merged as the commit deployed (its `merge_commit_sha` is HEAD);
 * - its head has HEAD's tree, so the head already held everything `main` had;
 * - the latest run of each of CI's jobs that make up the gate (`check`, which is `pnpm verify`) on that head completed
 *   with `success`, read as the review-pr skill's `prepare.sh` reads them;
 * - the pull request changes more than `*.md` files, since CI runs `pnpm verify --docs` alone for those.
 * Anything unreadable (the API, the fetch) means run everything: the fail-safe is the full gate.
 *
 *   node --experimental-strip-types --no-warnings tooling/witness.ts
 *
 * It reads GITHUB_EVENT_NAME and GITHUB_REPOSITORY, asks GitHub through `gh api` (GH_TOKEN), and prints its decision and
 * why. On "skip" it writes `head=<sha>` and `run=<url>` to GITHUB_OUTPUT, for `pnpm pages deploy --tests-passed-on`
 * (`tooling/pages.ts`). It always exits 0.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** CI's jobs whose success on the head stands for the deploy's `pnpm verify`. */
export const GATE_JOBS = ['check'];

/** The deploy's choice: skip the tests, with what witnessed them, or run them, with why. */
export type Decision =
  | { skip: true; head: string; run: string; tree: string; reason: string }
  | { skip: false; reason: string };

interface Pull {
  number: number;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: { sha: string };
}

interface CheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
}

/**
 * Runs a command (`gh` or `git`) and returns its output, trimmed; throws when it fails. The tests give canned answers.
 */
export type Shell = (command: string, args: string[]) => string;

const run = (reason: string): Decision => ({ skip: false, reason });

/**
 * Decides, asking GitHub and git through `shell`, whether the deploy of `sha` (HEAD) in `repo` (`owner/name`) may skip
 * the tests CI's `jobs` passed on its pull request's head.
 */
export function witness(
  event: string,
  repo: string,
  sha: string,
  shell: Shell,
  jobs: string[] = GATE_JOBS,
): Decision {
  if (event !== 'push') return run(`a deploy by ${event || 'hand'}, not a merge's push`);
  const ask = <T>(what: string, args: string[]): T | string => {
    try {
      return JSON.parse(shell('gh', ['api', ...args])) as T;
    } catch (error) {
      return `could not read ${what} (${error instanceof Error ? error.message.split('\n')[0] : String(error)})`;
    }
  };

  const pulls = ask<Pull[]>('the pull requests of HEAD', [`repos/${repo}/commits/${sha}/pulls`]);
  if (typeof pulls === 'string') return run(pulls);
  const pull = Array.isArray(pulls)
    ? pulls.find((p) => p.merged_at && p.merge_commit_sha === sha)
    : undefined;
  if (!pull) return run(`no pull request was merged as ${sha.slice(0, 7)}`);
  const head = pull.head.sha;

  let tree: string;
  let headTree: string;
  try {
    tree = shell('git', ['rev-parse', 'HEAD^{tree}']);
    // (by its sha, or, where GitHub won't serve that, by the pull request's own ref)
    try {
      shell('git', ['fetch', '--quiet', '--no-tags', 'origin', head]);
    } catch {
      shell('git', ['fetch', '--quiet', '--no-tags', 'origin', `pull/${pull.number}/head`]);
    }
    headTree = shell('git', ['rev-parse', `${head}^{tree}`]);
  } catch {
    return run(`could not fetch #${pull.number}'s head ${head.slice(0, 7)}`);
  }
  if (headTree !== tree)
    return run(
      `#${pull.number}'s head ${head.slice(0, 7)} has tree ${headTree.slice(0, 7)}, HEAD ${tree.slice(0, 7)}`,
    );

  const checks = ask<{ check_runs?: CheckRun[] }>(`the check runs of ${head.slice(0, 7)}`, [
    `repos/${repo}/commits/${head}/check-runs?per_page=100`,
  ]);
  if (typeof checks === 'string') return run(checks);
  const runs = Array.isArray(checks.check_runs) ? checks.check_runs : [];
  const last = (name: string) => runs.filter((r) => r.name === name).sort((a, b) => b.id - a.id)[0];
  for (const job of jobs) {
    const latest = last(job);
    if (!latest) return run(`CI ran no \`${job}\` on ${head.slice(0, 7)}`);
    if (latest.status !== 'completed' || latest.conclusion !== 'success')
      return run(
        `CI's \`${job}\` on ${head.slice(0, 7)} is ${latest.status === 'completed' ? latest.conclusion : latest.status}`,
      );
  }

  let files: string[];
  try {
    files = shell('gh', [
      'api',
      '--paginate',
      `repos/${repo}/pulls/${pull.number}/files?per_page=100`,
      '--jq',
      '.[].filename',
    ])
      .split('\n')
      .filter(Boolean);
  } catch {
    return run(`could not read #${pull.number}'s changed files`);
  }
  if (files.length === 0 || files.every((file) => file.endsWith('.md')))
    return run(`#${pull.number} changes \`*.md\` files alone, so CI ran its docs check only`);

  const witnessed = last(jobs[0]!)!;
  return {
    skip: true,
    head,
    run: witnessed.html_url,
    tree,
    reason: `CI passed ${jobs.map((job) => `\`${job}\``).join(' and ')} on #${pull.number}'s head ${head.slice(0, 7)} (run ${witnessed.html_url}), same tree ${tree.slice(0, 7)}`,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let decision: Decision;
  try {
    const shell: Shell = (command, args) =>
      execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    decision = witness(
      process.env.GITHUB_EVENT_NAME ?? '',
      process.env.GITHUB_REPOSITORY ?? 'yggi/jambot',
      shell('git', ['rev-parse', 'HEAD']),
      shell,
    );
  } catch (error) {
    decision = run(
      `the witness failed (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  if (decision.skip) {
    console.log(`witness: the deploy skips its tests: ${decision.reason}`);
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `head=${decision.head}\nrun=${decision.run}\n`);
  } else console.log(`witness: the deploy runs its tests: ${decision.reason}`);
}
