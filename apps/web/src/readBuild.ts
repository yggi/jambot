// What a build knows about itself (buildInfo.ts), read at build time for vite.config.ts: the commit and the branch
// (CI's variables, else git), the date, and the versions of the dependencies it ships. Everything it reads from outside
// is an argument, so the test runs it over a made-up checkout.
// Lifted from yggi/cell-studio tools/build-info.ts @ 560c4f038e212a2a48adf58b41cb888b6e7aa341, adapted: a workspace, whose dependencies are spread over
// the manifests of the app and its packages, and listed by name (the app has no use for the rest).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildInfo } from './buildInfo.ts';

interface Manifest {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface Sources {
  /** The directories of the app and of the packages it takes dependencies from: each has a package.json and, installed, a node_modules. The first is the app. */
  dirs: string[];
  /** CI's variables (`GITHUB_SHA`, `GITHUB_HEAD_REF`, `GITHUB_REF_NAME`). */
  env: Record<string, string | undefined>;
  /** `git <args>`'s output, or '' where there is no git or no repository. */
  git: (args: string[]) => string;
  now: Date;
}

const readManifest = (path: string): Manifest | undefined =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Manifest) : undefined;

/** The version a dependency runs: its tag when it is taken from git (`github:yggi/cells#v0.2.0`), else the installed one, else what package.json asks for. */
function versionOf(dirs: string[], name: string, wanted: string): string {
  const tag = /#(.+)$/.exec(wanted)?.[1];
  if (tag !== undefined) return tag;
  for (const dir of dirs) {
    const installed = readManifest(join(dir, 'node_modules', name, 'package.json'))?.version;
    if (installed !== undefined) return installed;
  }
  return wanted;
}

/** The build's facts. `names` are the dependencies to list, named in some manifest's `dependencies` or `devDependencies`; one that no manifest names (yet) is left out, so naming a future one costs nothing. */
export function buildInfo({ dirs, env, git, now }: Sources, names: string[]): BuildInfo {
  const manifests = dirs.map((dir) => readManifest(join(dir, 'package.json')) ?? {});
  const declared: Record<string, string> = {};
  for (const manifest of manifests)
    Object.assign(declared, manifest.devDependencies, manifest.dependencies);
  const commit = env.GITHUB_SHA ?? git(['rev-parse', 'HEAD']);
  // a pull request's build runs on a merge ref: GITHUB_HEAD_REF is its branch
  const ci = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
  const branch = ci || git(['rev-parse', '--abbrev-ref', 'HEAD']);
  return {
    name: manifests[0]?.name ?? '',
    version: manifests[0]?.version ?? '',
    commit,
    // a detached head (git says `HEAD`) is no branch
    branch: branch === 'HEAD' ? '' : branch,
    builtAt: now.toISOString(),
    dependencies: names
      .filter((name) => name in declared)
      .sort()
      .map((name) => ({ name, version: versionOf(dirs, name, declared[name]!) })),
  };
}
