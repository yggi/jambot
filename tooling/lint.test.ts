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
const strudel = using('mini', "import { mini } from '@strudel/mini';\n");

describe('lint keeps the pure packages pure', () => {
  it.each(impure)('refuses %s in their sources', async (expression, rule) => {
    for (const path of pureSources) expect(await firing(using(expression), path)).toContain(rule);
  });

  it('refuses Node APIs, tonal and @strudel/mini in their sources (#11)', async () => {
    for (const path of pureSources) {
      expect(await firing(nodeFs, path)).toContain('no-restricted-imports');
      expect(await firing(tonal, path)).toContain('no-restricted-imports');
      expect(await firing(strudel, path)).toContain('no-restricted-imports');
    }
  });

  it('lets their tests use a random, a clock, tonal and @strudel/mini, but not Node APIs (#11)', async () => {
    // A test may need an unkeyed random, for instance to show a law check fire.
    const test = 'packages/engine/src/probe.test.ts';
    for (const code of [using('Math.random()'), using('Date.now()'), tonal, strudel])
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

describe('lint keeps the screens presentational', () => {
  const lobby = 'apps/web/src/screens/Probe.svelte';
  const screen = (imports: string) =>
    `<script lang="ts">\n  ${imports}\n</script>\n\n<p>probe</p>\n`;

  it('refuses a screen that runs the player, the device or the sessions, and one that knows the other', async () => {
    for (const imports of [
      "import { Sessions } from '../session/sessions.svelte.ts';",
      "import { Player } from '../player.svelte.ts';",
      "import { Device } from '../device.svelte.ts';",
      "import { Instruments } from '../instruments.svelte.ts';",
      "import { Metronome } from '../metronome.svelte.ts';",
      "import { Profile } from '../profile.svelte.ts';",
      "import Band from './Band.svelte';",
      "import Lobby from './Lobby.svelte';",
    ])
      expect(await firing(screen(imports), lobby), imports).toContain('no-restricted-imports');
  });

  it('lets a screen name their types, and use the components and the pure helpers', async () => {
    const imports = [
      "import type { Player } from '../player.svelte.ts';",
      "import type { Found } from '../session/sessions.svelte.ts';",
      "import Level from '../components/Level.svelte';",
      "import { tempoView } from '../conductor.ts';",
    ].join('\n  ');
    expect(await firing(screen(imports), lobby)).not.toContain('no-restricted-imports');
  });

  it('leaves the page and the components free to run them', async () => {
    const code = screen("import { Sessions } from '../session/sessions.svelte.ts';");
    for (const path of ['apps/web/src/Probe.svelte', 'apps/web/src/components/Probe.svelte'])
      expect(await firing(code, path)).not.toContain('no-restricted-imports');
  });
});
