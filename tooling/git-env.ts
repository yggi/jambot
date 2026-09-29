/**
 * The environment variables that tell git which repository to work on. A hook
 * run from a linked worktree inherits them, and they beat `git -C <dir>`, so a
 * test that makes a throwaway repository would write to the real one instead:
 * refs, config and a push to the real remote (#172). The tooling tests run
 * without them (`vitest.config.ts`).
 */
export const REPOSITORY_VARIABLES = [
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_PREFIX',
  'GIT_COMMON_DIR',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_NAMESPACE',
];

/** `env` without the variables that pick a repository. */
export function withoutRepository(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const rest = { ...env };
  for (const name of REPOSITORY_VARIABLES) delete rest[name];
  return rest;
}
