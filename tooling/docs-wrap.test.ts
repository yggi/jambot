/**
 * Docs wrap at 80 columns (#45): `.prettierrc.json` sets `proseWrap: "always"`
 * and `printWidth: 80` for `*.md`, so `pnpm format:check` (part of
 * `pnpm verify`) refuses a doc whose prose runs past 80 columns, and
 * `pnpm format` rewraps it. Tables and code fences aren't prose, so
 * prettier leaves their width alone; that's the gate architecture.md's own
 * mermaid diagram relies on.
 */
import { resolveConfig, format, check } from 'prettier';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const docPath = `${repoRoot}/docs/probe.md`;

async function options() {
  const config = await resolveConfig(docPath);
  return { ...config, filepath: docPath };
}

describe('docs wrap at 80 columns', () => {
  it('is shown firing: a paragraph past 80 columns is not the wrapped form', async () => {
    const long =
      '# Probe\n\nThis paragraph is written as one very long line on purpose, so it runs well past eighty columns and shows the wrap check catching it.\n';
    const opts = await options();
    expect(await check(long, opts)).toBe(false);
    const wrapped = await format(long, opts);
    expect(await check(wrapped, opts)).toBe(true);
    expect(Math.max(...wrapped.split('\n').map((line) => line.length))).toBeLessThanOrEqual(80);
  });

  it('leaves a table and a code fence at their own width', async () => {
    const doc =
      '# Probe\n\n| a very long column header that runs well past eighty columns | another |\n| --- | --- |\n| x | y |\n\n```text\na code fence line that also runs well past the eighty column prose width on purpose\n```\n';
    const opts = await options();
    const formatted = await format(doc, opts);
    expect(Math.max(...formatted.split('\n').map((line) => line.length))).toBeGreaterThan(80);
    expect(await check(formatted, opts)).toBe(true);
  });
});
