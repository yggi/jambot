import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Runs the pre-push hook on a Bash command, with `verify` standing in for `pnpm verify`. */
function beforeBash(command: string, verify: string) {
  const run = spawnSync('sh', [`${root}/.claude/hooks/verify-before-push.sh`], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: root, JAMBOT_VERIFY: verify },
    encoding: 'utf8',
  });
  return { status: run.status, stderr: run.stderr };
}

const failing = 'echo verify ran and failed; exit 1';

describe('verify-before-push', () => {
  it.each([
    'git push -u origin claude/some-branch',
    'git push',
    'cd /home/user/jambot && git push origin HEAD',
    'git -C /home/user/jambot push',
    'pnpm verify; git push --force-with-lease',
    'GIT_TRACE=1 git push',
  ])('blocks `%s` when verify fails, and says why', (command) => {
    const { status, stderr } = beforeBash(command, failing);
    expect(status).toBe(2);
    expect(stderr).toContain('verify ran and failed');
    expect(stderr).toContain('pnpm verify failed');
  });

  it('lets a push through when verify passes', () => {
    expect(beforeBash('git push -u origin main', 'true').status).toBe(0);
  });

  it.each([
    'git status',
    'git commit -m "push the swing later"',
    'git log --grep push',
    'echo git push',
    'pnpm test',
  ])('does not run verify for `%s`', (command) => {
    expect(beforeBash(command, failing)).toEqual({ status: 0, stderr: '' });
  });
});
