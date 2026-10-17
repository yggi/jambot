// What a build knows about itself, and the short line that stands for it. `vite.config.ts` fills `__BUILD__` through
// readBuild.ts; the lobby's banner shows `shortVersion`, and the version sheet (components/Version.svelte) lists the rest.
// Lifted from yggi/cell-studio src/buildInfo.ts @ 560c4f038e212a2a48adf58b41cb888b6e7aa341

export interface BuildInfo {
  /** The app's name, as package.json gives it. */
  name: string;
  /** package.json's version: not shown at a glance while releases aren't meaningful (the hash stands for a build). */
  version: string;
  /** The commit this build is from, in full; '' when git and CI said nothing. */
  commit: string;
  /** The branch it was built on (`pr-<n>` for a preview); '' when unknown. */
  branch: string;
  /** When it was built, ISO 8601, UTC. */
  builtAt: string;
  /** What the app ships: a name and the version it runs (a tag for a dependency taken from git). */
  dependencies: { name: string; version: string }[];
}

/** The commit's first 7 characters, or `dev` for a build that doesn't know its commit. */
export function shortVersion(info: Pick<BuildInfo, 'commit'>): string {
  return info.commit === '' ? 'dev' : info.commit.slice(0, 7);
}

/** The build date as a person reads it: `2026-10-17 14:03 UTC`. */
export function builtOn(info: Pick<BuildInfo, 'builtAt'>): string {
  return `${info.builtAt.slice(0, 10)} ${info.builtAt.slice(11, 16)} UTC`;
}
