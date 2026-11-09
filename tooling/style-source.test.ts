// tooling/style-source.ts over its cases, then over Jambot's source (#596).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { presetsOf, restated } from './style-source.ts';

const root = join(import.meta.dirname, '..');
const STYLES = readFileSync(
  join(root, 'packages/engine/node_modules/@yggi/cells/fragments/styles/01-styles.md'),
  'utf8',
);
const presets = presetsOf(STYLES);

/** The one place each is written on purpose: the typed list of the axes (style.ts), and the score's frozen spelling. */
const ALLOWED = new Set(['packages/engine/src/style.ts', 'packages/score/src/score.ts']);

describe('no preset and no list of the style axes in Jambot’s source (#596)', () => {
  it('reads cells’ library of styles: every preset, its point on its axes', () => {
    expect(presets.length).toBeGreaterThanOrEqual(10);
    expect(presets.find((p) => p.id === 'funk')).toEqual({
      id: 'funk',
      axes: presets[0]!.axes,
      values: expect.any(Array),
    });
    for (const p of presets) expect(p.axes).toEqual(presets[0]!.axes);
  });

  it('is shown firing: a preset table as Jambot wrote one, an object of axes, and a list of the axes', () => {
    const funk = presets.find((p) => p.id === 'funk')!;
    const [a, b, c, d] = funk.values.map(String) as [string, string, string, string];
    const [w, x, y, z] = funk.axes as [string, string, string, string];
    expect(restated(`preset('Funk', [${a}, ${b}, ${c}, ${d}, 104]),`, presets)).toEqual([
      { line: 1, what: 'the point of funk' },
    ]);
    expect(
      restated(
        `const f = {\n  ${w}: ${a},\n  ${x}: ${b},\n  ${y}: ${c},\n  ${z}: ${d},\n};`,
        presets,
      ),
    ).toEqual([{ line: 2, what: 'the point of funk' }]);
    expect(
      restated(`const AXES = ['${w}', '${x}', '${y}', '${z}'] as const;`, presets),
    ).toHaveLength(1);
  });

  it('passes numbers that only share some of a point, or are far apart', () => {
    const funk = presets.find((p) => p.id === 'funk')!;
    expect(restated(`[${funk.values.slice(0, 3).join(', ')}, 0.99]`, presets)).toEqual([]);
    expect(
      restated(
        `f(${funk.values[0]}); g(); const t = 'x'; h(${funk.values.slice(1).join(', ')})`,
        presets,
      ),
    ).toEqual([]);
  });

  it('finds none in the packages’ and the app’s source, but the typed list of the axes and the score’s frozen spelling', () => {
    const files = execFileSync('git', ['ls-files', 'packages/*/src/**', 'apps/*/src/**'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((f) => /\.(ts|svelte)$/.test(f) && !/\.test\.ts$/.test(f) && !ALLOWED.has(f));
    expect(files.length).toBeGreaterThan(50);
    const found = files.flatMap((f) =>
      restated(readFileSync(join(root, f), 'utf8'), presets).map((r) => `${f}:${r.line} ${r.what}`),
    );
    expect(found).toEqual([]);
  });
});
