/**
 * The license gate: what the web app ships from other packages has to be
 * under a permissive license and carry its license text, which the build
 * passes on in `licenses.txt`. A copyleft package, such as Strudel
 * (AGPL-3.0-or-later), fails the build instead of arriving unnoticed; taking
 * one in is a decision, not a side effect of an import (`docs/memory/repository-and-ci.md`).
 * `apps/web/vite.config.ts` runs it over the modules of every build.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The SPDX ids the app may ship without further thought. */
export const PERMISSIVE: ReadonlySet<string> = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MIT-0',
  'Unlicense',
  'Zlib',
]);

/**
 * Whether an SPDX expression lets the app ship the package: `OR` needs one
 * side permitted, `AND` both. An expression that doesn't parse is refused.
 */
export function permits(expression: string | undefined): boolean {
  const tokens = expression?.match(/\(|\)|[^\s()]+/g) ?? [];
  let at = 0;
  const either = (): boolean | undefined => {
    let permitted = both();
    while (permitted !== undefined && tokens[at] === 'OR') {
      at++;
      const other = both();
      permitted = other === undefined ? undefined : permitted || other;
    }
    return permitted;
  };
  const both = (): boolean | undefined => {
    let permitted = single();
    while (permitted !== undefined && tokens[at] === 'AND') {
      at++;
      const other = single();
      permitted = other === undefined ? undefined : permitted && other;
    }
    return permitted;
  };
  const single = (): boolean | undefined => {
    const token = tokens[at++];
    if (token === '(') {
      const permitted = either();
      return tokens[at++] === ')' ? permitted : undefined;
    }
    if (token === undefined || ['OR', 'AND', ')'].includes(token)) return undefined;
    return PERMISSIVE.has(token);
  };
  const permitted = either();
  return permitted === true && at === tokens.length;
}

/** A package the app ships, as read from its directory. */
export interface Shipped {
  name: string;
  version: string;
  license: string | undefined;
  /** Its license and notice files, joined. */
  text: string;
}

/** What keeps each package out of the app, if anything. */
export function licenseProblems(shipped: Shipped[]): string[] {
  const problems: string[] = [];
  for (const { name, version, license, text } of shipped) {
    const id = `${name}@${version}`;
    if (!license) problems.push(`${id} states no license`);
    else if (!permits(license))
      problems.push(`${id} is ${license}, which is not on the permissive list`);
    else if (!text.trim()) problems.push(`${id} ships no license text to pass on`);
  }
  return problems;
}

const licenseFile = /^(licen[cs]e|copying|notice)([.-]|$)/i;

/** A package's name, version, license and license text, from its directory. */
export function readShipped(dir: string): Shipped {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    name: string;
    version: string;
    license?: string;
  };
  const text = readdirSync(dir)
    .filter((file) => licenseFile.test(file))
    .sort()
    .map((file) => readFileSync(join(dir, file), 'utf8').trim())
    .join('\n\n');
  return { name: manifest.name, version: manifest.version, license: manifest.license, text };
}

const packagePath = /^.*\/node_modules\/(@[^/]+\/)?[^/]+/;
const virtualName = /^\0((@[^/]+\/)?[^/?]+)/;

/**
 * The directory of the package a bundled module comes from, or undefined
 * for Jambot's own sources. A virtual module (`\0vite/…`) belongs to the
 * package it names, found with `resolve`, and one no package claims throws.
 */
export function packageDirOf(
  moduleId: string,
  resolve: (name: string) => string | undefined,
): string | undefined {
  if (moduleId.startsWith('\0')) {
    const name = virtualName.exec(moduleId)?.[1];
    const dir = name === undefined ? undefined : resolve(name);
    if (dir === undefined)
      throw new Error(`cannot tell which package ships \\0${moduleId.slice(1)}`);
    return dir;
  }
  return packagePath.exec(moduleId)?.[0];
}

/**
 * The workbox packages in a service worker workbox-build wrote: each module
 * leaves a `workbox:<module>:<version>` marker.
 */
export function workboxPackages(source: string): string[] {
  const names = [...source.matchAll(/workbox:([a-z-]+):\d/g)].map(([, name]) => `workbox-${name}`);
  return [...new Set(names)].sort();
}

const rule = `\n\n${'-'.repeat(72)}\n\n`;

/** `licenses.txt`: Jambot's own license, then each shipped package by name. */
export function notices(own: string, shipped: Shipped[]): string {
  const sorted = [...shipped].sort((a, b) => a.name.localeCompare(b.name));
  const parts = sorted.map(
    ({ name, version, license, text }) => `${name}@${version} (${license})\n\n${text}`,
  );
  return [
    `Jambot\n\n${own.trim()}`,
    'Jambot ships code from these packages, under their licenses:',
    ...parts,
  ]
    .join(rule)
    .concat('\n');
}
