import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { PAGE_CSS, inlineModule, page } from './screenshot.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const scratch = mkdtempSync(join(tmpdir(), 'screenshot-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** A module written for the test, as a path from the repository's root. */
const moduleOf = (name: string, source: string) => {
  const file = join(scratch, name);
  writeFileSync(file, source);
  return relative(root, file);
};

describe('inlineModule', () => {
  it("inlines the synth's voices for a page: types stripped, exports kept", () => {
    const js = inlineModule('apps/web/src/audio/voices.ts');
    expect(js).toContain('export function voices(ctx');
    expect(js).not.toMatch(/import type|: BaseAudioContext|: AudioNode/);
    // What is left runs as JavaScript.
    expect(() => new Function(js.replace(/^\s*export /gm, ''))).not.toThrow();
  });

  it('refuses a module that imports a value, which a page could not resolve', () => {
    const path = moduleOf(
      'values.ts',
      "import { band } from '@jambot/engine';\nexport const x = band;\n",
    );
    expect(() => inlineModule(path)).toThrow(/imports @jambot\/engine, and a page has no resolver/);
    const typed = moduleOf(
      'types.ts',
      "import type { Style } from '@jambot/engine';\nexport const x: Style | null = null;\n",
    );
    expect(inlineModule(typed)).toContain('export const x');
  });
});

describe('page', () => {
  it('frames a body with the palette, and marks a page that renders late', () => {
    const html = page('A title', '<p>body</p>');
    expect(html).toContain('<title>A title</title>');
    expect(html).toContain(PAGE_CSS);
    expect(html).toContain('<body><main><p>body</p></main></body>');
    expect(page('Late', '', { wait: true })).toContain('<body data-wait>');
  });
});
