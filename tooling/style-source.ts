// No preset's point and no list of the four style axes is written in Jambot's source (#596): the presets are cells'
// library of styles (`STYLES`, read by `packages/engine/src/style.ts`), and the axes cells' table (`AXES`), so a preset
// or an axis written here again would drift from cells at its next pin. Run by its test, in `pnpm verify`.

/** A preset as cells' library writes it: its id and its point, its axes in order. */
export interface PresetPoint {
  readonly id: string;
  readonly axes: readonly string[];
  readonly values: readonly number[];
}

/** The presets in cells' library of styles, read from its text (`fragments/styles/01-styles.md`): each `&id map=style … axis=n …`. */
export function presetsOf(text: string): PresetPoint[] {
  return [...text.matchAll(/^&(\w+) map=style\b(.*)$/gm)].map((m) => {
    const named = [
      ...m[2]!.matchAll(/(?:^|\s)([a-z]+)=(-?(?:\d+(?:\.\d+)?|\.\d+))(?=\s|$)/g),
    ].filter(([, k]) => k !== 'step');
    return {
      id: m[1]!,
      axes: named.map(([, k]) => k!),
      values: named.map(([, , v]) => parseFloat(v!)),
    };
  });
}

/** What a source restates: a preset's point (its values, consecutive, as numbers written in order) or the axes' list. */
export interface Restated {
  readonly line: number;
  readonly what: string;
}

const NUMBER = /-?(?:\d+(?:\.\d+)?|\.\d+)(?![\w.])/g;

/** Where `source` writes a preset's point (its numbers in a row, at most an axis's name between) or the axes in order. */
export function restated(source: string, presets: readonly PresetPoint[]): Restated[] {
  const out: Restated[] = [];
  const lineOf = (at: number) => source.slice(0, at).split('\n').length;
  // (numbers in order, each with what stands between it and the next: a separator, or an axis's name and a colon)
  const numbers = [...source.matchAll(NUMBER)].map((m) => ({
    at: m.index!,
    end: m.index! + m[0].length,
    value: parseFloat(m[0]),
  }));
  const near = (a: { end: number }, b: { at: number }) =>
    /^[\s,[\]{}()]*(?:[a-z]+\s*[:=]\s*)?$/.test(source.slice(a.end, b.at));
  for (const p of presets) {
    const n = p.values.length;
    // (a point of all-equal or one-place values says nothing: the centre .5 .5 .5 .5 is anyone's)
    if (new Set(p.values).size < 3) continue;
    for (let i = 0; i + n <= numbers.length; i++) {
      const run = numbers.slice(i, i + n);
      if (
        run.every((x, k) => x.value === p.values[k]) &&
        run.slice(1).every((x, k) => near(run[k]!, x))
      )
        out.push({ line: lineOf(run[0]!.at), what: `the point of ${p.id}` });
    }
  }
  const axes = presets[0]?.axes ?? [];
  if (axes.length) {
    const list = new RegExp(axes.map((a) => `['"]${a}['"]`).join('\\s*,\\s*'), 'g');
    for (const m of source.matchAll(list))
      out.push({ line: lineOf(m.index!), what: `the style axes, ${axes.join(' ')}` });
  }
  return out;
}
