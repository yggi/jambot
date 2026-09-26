import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  PERMISSIVE,
  licenseProblems,
  notices,
  packageDirOf,
  permits,
  readShipped,
  workboxPackages,
  type Shipped,
} from './licenses.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

const mit = (name: string, version = '1.0.0'): Shipped => ({
  name,
  version,
  license: 'MIT',
  text: `MIT License\n\nCopyright (c) the ${name} authors\n`,
});

describe('which licenses the app may ship', () => {
  it.each([...PERMISSIVE])('permits %s', (license) => {
    expect(permits(license)).toBe(true);
  });

  it.each([
    'AGPL-3.0-or-later',
    'AGPL-3.0-only',
    'GPL-3.0-only',
    'GPL-2.0-or-later',
    'LGPL-3.0-only',
    'MPL-2.0',
    'EUPL-1.2',
    'CC-BY-SA-4.0',
    'SEE LICENSE IN LICENSE.txt',
    'UNLICENSED',
    '',
  ])('refuses %j', (license) => {
    expect(permits(license)).toBe(false);
  });

  it('refuses a package without a license', () => {
    expect(permits(undefined)).toBe(false);
  });

  it('reads SPDX expressions: OR needs one side, AND needs both', () => {
    expect(permits('(MIT OR CC0-1.0)')).toBe(true);
    expect(permits('MIT OR GPL-3.0-only')).toBe(true);
    expect(permits('GPL-3.0-only OR MIT')).toBe(true);
    expect(permits('MIT AND Apache-2.0')).toBe(true);
    expect(permits('MIT AND GPL-3.0-only')).toBe(false);
    expect(permits('GPL-3.0-only OR (MIT AND Apache-2.0)')).toBe(true);
    expect(permits('(GPL-3.0-only OR MIT) AND MPL-2.0')).toBe(false);
    expect(permits('MIT AND (ISC OR GPL-3.0-only)')).toBe(true);
  });

  it('refuses an expression it cannot read', () => {
    for (const expression of ['MIT OR', '(MIT', 'MIT)', 'OR MIT', 'MIT ISC'])
      expect(permits(expression)).toBe(false);
  });
});

describe('the license gate', () => {
  it('passes permissive packages that carry their license text', () => {
    expect(licenseProblems([mit('svelte'), mit('workbox-core')])).toEqual([]);
  });

  it('refuses a copyleft package, a package without a license, and one without its text', () => {
    const strudel = { ...mit('@strudel/core', '1.2.5'), license: 'AGPL-3.0-or-later' };
    const bare = { ...mit('bare'), license: undefined };
    const textless = { ...mit('textless'), text: '' };
    expect(licenseProblems([strudel, bare, textless, mit('svelte')])).toEqual([
      '@strudel/core@1.2.5 is AGPL-3.0-or-later, which is not on the permissive list',
      'bare@1.0.0 states no license',
      'textless@1.0.0 ships no license text to pass on',
    ]);
  });
});

describe('which package a bundled module comes from', () => {
  const resolve = (name: string) => (name === 'vite' ? '/r/node_modules/vite' : undefined);

  it('takes the innermost package under node_modules, scoped or not', () => {
    const pnpm = '/r/node_modules/.pnpm/svelte@5.57.1_x@8/node_modules/svelte';
    expect(packageDirOf(`${pnpm}/src/internal/client/index.js`, resolve)).toBe(pnpm);
    expect(packageDirOf('/r/node_modules/a/node_modules/@s/b/lib/c.js?x', resolve)).toBe(
      '/r/node_modules/a/node_modules/@s/b',
    );
  });

  it("gives a virtual module to the package that names it, as Vite's polyfill", () => {
    expect(packageDirOf('\0vite/modulepreload-polyfill.js', resolve)).toBe('/r/node_modules/vite');
  });

  it('refuses a virtual module no package claims', () => {
    expect(() => packageDirOf('\0mystery', resolve)).toThrow(
      'cannot tell which package ships \\0mystery',
    );
  });

  it("leaves Jambot's own sources out", () => {
    for (const id of ['/r/packages/engine/src/band.ts', '/r/apps/web/index.html'])
      expect(packageDirOf(id, resolve)).toBeUndefined();
  });
});

describe("the service worker's workbox modules", () => {
  it('reads them from the markers each one leaves', () => {
    const source =
      'try{self["workbox:core:7.4.0"]&&_()}catch(t){}try{self["workbox:routing:7.4.0"]&&_()}' +
      'catch(t){}try{self["workbox:core:7.4.0"]&&_()}catch(t){}';
    expect(workboxPackages(source)).toEqual(['workbox-core', 'workbox-routing']);
  });

  it('finds none in code without markers', () => {
    expect(workboxPackages('self.addEventListener("fetch", () => {})')).toEqual([]);
  });
});

describe('the notices', () => {
  it("lead with Jambot's own license, then each package by name, with its text", () => {
    const text = notices('MIT License\n\nCopyright (c) Jambot\n', [
      mit('workbox-core', '7.4.1'),
      mit('svelte', '5.57.1'),
    ]);
    expect(text.indexOf('Copyright (c) Jambot')).toBeLessThan(text.indexOf('svelte@5.57.1 (MIT)'));
    expect(text.indexOf('svelte@5.57.1 (MIT)')).toBeLessThan(
      text.indexOf('workbox-core@7.4.1 (MIT)'),
    );
    expect(text).toContain('Copyright (c) the svelte authors');
  });
});

describe('reading a package from disk', () => {
  it("reads svelte's name, version, license and text", () => {
    const require = createRequire(`${root}/apps/web/package.json`);
    const shipped = readShipped(dirname(require.resolve('svelte/package.json')));
    expect(shipped).toMatchObject({ name: 'svelte', license: 'MIT' });
    expect(shipped.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(shipped.text).toContain('Permission is hereby granted');
  });
});
