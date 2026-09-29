// Runs before every tooling test file: no test may inherit a repository from the environment (git-env.ts).
import { REPOSITORY_VARIABLES } from './git-env.ts';

for (const name of REPOSITORY_VARIABLES) delete process.env[name];
