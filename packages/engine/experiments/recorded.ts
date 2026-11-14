/**
 * An experiment's recorded numbers, kept beside its test in `<name>.recorded.json` and written by a tool, not by
 * hand (yggi/music-commons#68).
 *
 * A change to what the band plays moves an experiment's numbers, and every pull request that moves them edited the
 * same literals in the same test: each conflicted with every other, and each conflict was settled by hand. Here the
 * test says what it measures and the file says what it measured: `pnpm record <test file>` plays the experiment and
 * writes the file, a pull request's diff of it shows each number before and after, and a conflict in it is settled by
 * recording again on the merged code. What an experiment must hold whatever the numbers (a bound, a count) stays an
 * assertion in its test.
 *
 * `recording(import.meta.url)` gives a test file its `record(name, value)`: it holds `value` to the one recorded
 * under `name`, or with `RECORD=1` keeps it and writes the file when the test file ends, with only the names that
 * run recorded, in the order they ran. A name with nothing recorded fails and says how to record it.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, expect } from 'vitest';

/** A value an experiment records: what JSON keeps as it is. */
export type Recorded =
  string | number | boolean | null | readonly Recorded[] | { readonly [key: string]: Recorded };

/** Where a test file's numbers are recorded: beside it, `<name>.recorded.json` for `<name>.test.ts`. */
export const recordedPath = (test: string): string =>
  (test.startsWith('file:') ? fileURLToPath(test) : test).replace(/\.test\.ts$/, '.recorded.json');

/** The text of a recorded file: a name to a line where its value fits one, so a merge that moves one number touches one line. */
export function recordedText(values: Readonly<Record<string, Recorded>>): string {
  const lines = Object.entries(values).map(
    ([name, value]) => `  ${JSON.stringify(name)}: ${JSON.stringify(value)}`,
  );
  return `{\n${lines.join(',\n')}\n}\n`;
}

/**
 * What `record` does for the test file `test`, apart from vitest's hooks: `hold` compares or keeps a value, and `end`
 * writes the file where values were kept. `writing` is `RECORD=1`.
 */
export function recorder(test: string, writing: boolean) {
  const path = recordedPath(test);
  const known: Record<string, Recorded> =
    !writing && existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, Recorded>)
      : {};
  const kept: Record<string, Recorded> = {};
  return {
    hold(name: string, value: Recorded): void {
      if (name in kept) throw new Error(`recorded: "${name}" is recorded twice in ${path}`);
      // (as JSON keeps it, so a value read back is the value compared)
      kept[name] = JSON.parse(JSON.stringify(value)) as Recorded;
      if (writing) return;
      if (!(name in known))
        throw new Error(
          `recorded: nothing is recorded as "${name}" in ${path}: run pnpm record <this test file> and commit it`,
        );
      expect(kept[name], `${name} (pnpm record writes ${path})`).toEqual(known[name]);
    },
    end(): void {
      if (writing && Object.keys(kept).length > 0) writeFileSync(path, recordedText(kept));
    },
  };
}

/** A test file's `record(name, value)`; pass `import.meta.url`. */
export function recording(test: string): (name: string, value: Recorded) => void {
  const { hold, end } = recorder(test, Boolean(process.env.RECORD));
  afterAll(end);
  return hold;
}
