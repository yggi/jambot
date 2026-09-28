import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const eslint = new ESLint({ cwd: root });

/** The rules that fire on `code` as if it stood at `path` in the repository. */
async function firing(code: string, path: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: `${root}/${path}` });
  return result!.messages.map((m) => m.ruleId ?? m.message);
}

const pureSources = [
  'packages/analyzer/src/probe.ts',
  'packages/engine/src/probe.ts',
  'packages/score/src/probe.ts',
  'packages/session/src/probe.ts',
  'packages/theory/src/probe.ts',
];

// What keeps the pure packages pure. The type checker already refuses the
// DOM and Node's timers there (their `lib` is ES2023 and `types` is empty),
// but not the clock or `Math.random`, which are part of ECMAScript.
const impure: [string, string][] = [
  ['Math.random()', 'no-restricted-properties'],
  ['Date.now()', 'no-restricted-globals'],
  ['new Date()', 'no-restricted-globals'],
  ['performance.now()', 'no-restricted-globals'],
  ['setTimeout(() => {}, 1)', 'no-restricted-globals'],
  ['setInterval(() => {}, 1)', 'no-restricted-globals'],
  ['requestAnimationFrame(() => {})', 'no-restricted-globals'],
  ['crypto.getRandomValues(new Uint8Array(4))', 'no-restricted-globals'],
  ['document.title', 'no-restricted-globals'],
  ['new AudioContext()', 'no-restricted-globals'],
];
/** Code that uses `expression`, after `imports`. */
const using = (expression: string, imports = '') =>
  `${imports}export const probe = () => ${expression};\n`;
const nodeFs = using('readFileSync', "import { readFileSync } from 'node:fs';\n");
const tonal = using('note', "import { note } from 'tonal';\n");

describe('lint keeps the pure packages pure', () => {
  it.each(impure)('refuses %s in their sources', async (expression, rule) => {
    for (const path of pureSources) expect(await firing(using(expression), path)).toContain(rule);
  });

  it('refuses Node APIs and tonal in their sources', async () => {
    for (const path of pureSources) {
      expect(await firing(nodeFs, path)).toContain('no-restricted-imports');
      expect(await firing(tonal, path)).toContain('no-restricted-imports');
    }
  });

  it('lets their tests use a random, a clock and tonal, but not Node APIs', async () => {
    // A test may need an unkeyed random, for instance to show a law check fire.
    const test = 'packages/engine/src/probe.test.ts';
    for (const code of [using('Math.random()'), using('Date.now()'), tonal])
      expect(await firing(code, test)).toEqual([]);
    expect(await firing(nodeFs, test)).toContain('no-restricted-imports');
  });

  it('leaves the app free to use all of them', async () => {
    for (const [expression] of impure)
      expect(await firing(using(expression), 'apps/web/src/probe.ts')).toEqual([]);
  });

  it('allows the pure code the pure packages are made of', async () => {
    const code = 'export const draw = (seed: number) => Math.imul(seed, 2654435761) >>> 0;\n';
    for (const path of pureSources) expect(await firing(code, path)).toEqual([]);
  });

  it('refuses a raw comparison against a draw, and lets chance() and pick() through', async () => {
    for (const code of [
      using('draw(1, "form") < 0.5'),
      using('0.5 > heldDraw(1, ["form", "themeRenewal"], 0, 0, 0, 0, 0)'),
    ])
      for (const path of pureSources)
        expect(await firing(code, path)).toContain('no-restricted-syntax');
    const code = using(
      "chance(draw(1, 'form'), 0.5)",
      "import { chance, draw } from './random.ts';\n",
    );
    for (const path of pureSources)
      expect(await firing(code, path)).not.toContain('no-restricted-syntax');
  });
});
