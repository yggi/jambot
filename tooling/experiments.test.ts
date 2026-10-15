// The experiments under `packages/*/experiments/` are typechecked by `pnpm verify`:
// tooling's `check` runs `tsconfig.experiments.json`, which takes every one of them.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const tsc = join(root, 'node_modules/typescript/bin/tsc');
const CONFIG = 'tsconfig.experiments.json';

/** Runs tsc over the experiments config in `tooling`, under the repository `base`. */
const typecheck = (base: string, ...args: string[]) =>
  spawnSync(process.execPath, [tsc, '-p', join(base, 'tooling', CONFIG), ...args], {
    encoding: 'utf8',
  });

/** Every experiment in the repository, relative to its root. */
const experiments = readdirSync(join(root, 'packages')).flatMap((name) => {
  const dir = join(root, 'packages', name, 'experiments');
  try {
    return readdirSync(dir)
      .filter((file) => file.endsWith('.ts'))
      .map((file) => `packages/${name}/experiments/${file}`);
  } catch {
    return [];
  }
});

describe('the experiments are typechecked (tooling/tsconfig.experiments.json)', () => {
  it("is run by tooling's check, which `pnpm check`, and so `pnpm verify`, runs", () => {
    const tooling = JSON.parse(readFileSync(join(root, 'tooling/package.json'), 'utf8'));
    expect(tooling.scripts.check).toContain(`tsc -p ${CONFIG}`);
  });

  it('takes every experiment of every package', () => {
    const listed = typecheck(root, '--listFilesOnly').stdout;
    expect(experiments.length).toBeGreaterThan(0);
    for (const path of experiments) expect(listed).toContain(join(root, path));
  });

  // A copy of the config in a repository of its own, with one experiment in a
  // package that doesn't exist here: it passes until the experiment is wrong.
  const scratch = mkdtempSync(join(tmpdir(), 'jambot-experiments-'));
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));
  mkdirSync(join(scratch, 'tooling'));
  mkdirSync(join(scratch, 'packages/probe/experiments'), { recursive: true });
  cpSync(join(root, 'tsconfig.base.json'), join(scratch, 'tsconfig.base.json'));
  cpSync(join(root, 'tooling', CONFIG), join(scratch, 'tooling', CONFIG));
  symlinkSync(join(root, 'tooling/node_modules'), join(scratch, 'tooling/node_modules'));
  const probe = join(scratch, 'packages/probe/experiments/probe.ts');

  it('fails on a type error in a new package’s experiment, and passes once it is fixed', () => {
    writeFileSync(
      probe,
      "import { argv } from 'node:process';\nexport const n: number = argv[0];\n",
    );
    const wrong = typecheck(scratch);
    expect(wrong.status).not.toBe(0);
    expect(wrong.stdout).toMatch(/probe\.ts\(2,14\): error TS2322/);
    writeFileSync(
      probe,
      "import { argv } from 'node:process';\nexport const n: number = argv.length;\n",
    );
    const right = typecheck(scratch);
    expect(right.stdout).toBe('');
    expect(right.status).toBe(0);
  });
});
