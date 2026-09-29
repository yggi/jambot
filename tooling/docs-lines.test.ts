/**
 * Docs keep the line breaks their author wrote (#172): `.prettierrc.json` sets
 * `proseWrap: "preserve"` for `*.md`, so a doc is written one sentence to a
 * line, and changing a word touches that line alone. With `"always"`, prettier
 * reflowed the whole paragraph, and two edits to different sentences of it
 * conflicted. Prettier still formats tables and lists.
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

describe('docs keep their line breaks', () => {
  it('is shown firing: a reflowed paragraph is a different text, and a one-sentence line stays', async () => {
    const sentences =
      '# Probe\n\nThe first sentence stands on its own line.\nThe second does too.\n';
    const opts = await options();
    expect(await format(sentences, opts)).toBe(sentences);
    const reflowed = await format(sentences, { ...opts, proseWrap: 'always', printWidth: 80 });
    expect(reflowed).not.toBe(sentences);
  });

  it('leaves a sentence past 80 columns on its line', async () => {
    const long =
      '# Probe\n\nThis sentence is written as one very long line on purpose, so it runs well past eighty columns.\n';
    const opts = await options();
    expect(await check(long, opts)).toBe(true);
  });
});
