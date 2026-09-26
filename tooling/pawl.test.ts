import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  citations,
  pawlProblems,
  readCatalogue,
  repoOnDisk,
  testNames,
  type Repo,
} from './pawl.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

/** A test file's source with one test per name. */
const spec = (...names: string[]) =>
  names.map((name) => `it(${JSON.stringify(name)}, () => {});`).join('\n');

/** A repository holding `catalogue` as docs/language.md, and `files`. */
function repo(catalogue: string, files: Record<string, string> = {}): Repo {
  const all: Record<string, string> = { 'docs/language.md': catalogue, ...files };
  return { catalogue: 'docs/language.md', paths: Object.keys(all), read: (path) => all[path]! };
}

const glide = `**C1. Nothing jumps.**
Witness: \`glideTo\`.
Test: \`style.test.ts\`, "starts from where the running glide is".
Source: spirit. Status: measured. Lands in: #37.`;

const styleTests = {
  'packages/engine/src/style.test.ts': spec('starts from where the running glide is'),
};

describe('the pawl check', () => {
  it('passes a catalogue whose statuses, tests and citations agree', () => {
    expect(pawlProblems(repo(glide, styleTests))).toEqual([]);
  });

  it('refuses an entry without a status, or with one off the ladder (rule 1)', () => {
    expect(pawlProblems(repo('**C1. Nothing jumps.** Source: spirit.'))).toEqual([
      'docs/language.md:1 C1 has no status',
    ]);
    expect(pawlProblems(repo('**C1. Nothing jumps.** Status: settled.'))).toEqual([
      'docs/language.md:1 C1 has a status off the ladder: "settled"',
    ]);
    expect(pawlProblems(repo('**C1. Nothing jumps.** Status: retired.'))).toEqual([
      'docs/language.md:1 C1 has a status off the ladder: "retired"',
    ]);
  });

  it('takes every rung of the ladder, with a scope, several parts, and a reason to retire', () => {
    const statuses = [
      'speculative',
      'open',
      'measured',
      'measured, failing (prototype)',
      'derived',
      'decided (provenance); open (confidence)',
      'measured (drums); measured, failing (the score, E1)',
      'retired: F9 says it better',
    ];
    for (const status of statuses) {
      const entry = `**C1. Nothing jumps.**\nTest: \`style.test.ts\`.\nStatus: ${status}.`;
      expect(pawlProblems(repo(entry, styleTests)), status).toEqual([]);
    }
  });

  it('refuses a test file that does not exist, or a name that matches two files (rule 2)', () => {
    expect(pawlProblems(repo(glide))).toEqual([
      'docs/language.md:1 C1 names `style.test.ts`, which does not exist',
    ]);
    const twice = {
      ...styleTests,
      'apps/web/src/style.test.ts': spec('starts from where the running glide is'),
    };
    expect(pawlProblems(repo(glide, twice))).toEqual([
      'docs/language.md:1 C1 names `style.test.ts`, which could be apps/web/src/style.test.ts or packages/engine/src/style.test.ts',
    ]);
  });

  it('refuses a quoted test that its file does not hold, as after a rename (rule 2)', () => {
    const renamed = {
      'packages/engine/src/style.test.ts': spec('starts where the running glide is'),
    };
    expect(pawlProblems(repo(glide, renamed))).toEqual([
      'docs/language.md:1 C1 quotes "starts from where the running glide is", which is no test in packages/engine/src/style.test.ts',
    ]);
  });

  it('reads a quote across the lines of the catalogue, and only against a test file', () => {
    const wrapped = `**C1. Nothing jumps.**
Test: \`style.test.ts\`, "starts from where the
running glide is"; \`prototype/README.md\`, "Tested".
Status: measured.`;
    const files = { ...styleTests, 'prototype/README.md': '# Prototype' };
    expect(pawlProblems(repo(wrapped, files))).toEqual([]);
  });

  it('refuses a measured entry that names no file for its test (rule 3)', () => {
    const untested = '**C1. Nothing jumps.**\nTest: open: a glide from rest.\nStatus: measured.';
    expect(pawlProblems(repo(untested))).toEqual([
      'docs/language.md:1 C1 is measured but its test names no file',
    ]);
    const open = '**C1. Nothing jumps.**\nTest: open: a glide from rest.\nStatus: open.';
    expect(pawlProblems(repo(open))).toEqual([]);
  });

  it('refuses a test that cites an id no catalogue defines, or a catalogue that is not known (rule 4)', () => {
    const files = {
      'packages/engine/src/style.test.ts': spec(
        'starts from where the running glide is',
        'glides (C9)',
      ),
    };
    expect(pawlProblems(repo(glide, files))).toEqual([
      'packages/engine/src/style.test.ts cites C9, which the catalogue does not define',
    ]);
    const elsewhere = {
      'packages/engine/src/style.test.ts': spec(
        'starts from where the running glide is',
        'glides (#12 Q1)',
      ),
    };
    expect(pawlProblems(repo(glide, elsewhere))).toEqual([
      'packages/engine/src/style.test.ts cites #12 Q1, which is in no known catalogue',
    ]);
  });

  it("refuses a test that cites an entry whose test doesn't name its file (rule 5)", () => {
    const files = {
      ...styleTests,
      'packages/engine/src/swing.test.ts': spec('is undone by its inverse (C1)'),
    };
    expect(pawlProblems(repo(glide, files))).toEqual([
      'packages/engine/src/swing.test.ts cites C1, whose test does not name that file',
    ]);
  });

  it('lets an entry name a file whose tests cite it, without quoting them', () => {
    const byId = `**C1. Nothing jumps.**\nTest: \`style.test.ts\`.\nStatus: measured.`;
    const files = {
      'packages/engine/src/style.test.ts': spec(
        'starts from rest (C1)',
        'keeps its rate (C1, #39 Q5)',
      ),
    };
    expect(pawlProblems(repo(byId, files))).toEqual([]);
  });

  it('refuses an id defined twice (rule 6)', () => {
    const twice = `${glide}\n\n**C1. Nothing jumps, again.** Status: decided.`;
    expect(pawlProblems(repo(twice, styleTests))).toEqual([
      'docs/language.md:6 C1 is defined twice, first at line 1',
    ]);
  });

  it('reads the experiments as ids, which tests may cite', () => {
    const withExperiment = `${glide}\n\n- **E1. Cold against warm compile** (S2).`;
    const files = {
      'packages/engine/src/style.test.ts': spec(
        'starts from where the running glide is',
        'compiles cold (E1)',
      ),
    };
    expect(pawlProblems(repo(withExperiment, files))).toEqual([]);
  });
});

describe('the parts of the check', () => {
  it('reads an entry whose fields share a line with its title', () => {
    const [entry] = readCatalogue(
      '**R1. A musician reads it like a lead sheet.** Source: spirit. Status:\ndecided. Test: open.',
    );
    expect(entry).toMatchObject({ id: 'R1', line: 1, status: 'decided', test: 'open' });
  });

  it('reads the names of `it`, `test` and `describe`, in any quotes, and skips `each` tables', () => {
    const source = [
      "it('one', () => {});",
      'test("two", () => {});',
      'describe(`three`, () => {});',
      "it('four’s \\'quoted\\'', () => {});",
      "it.each([1])('five %s', () => {});",
    ].join('\n');
    expect(testNames(source)).toEqual(['one', 'two', 'three', "four’s 'quoted'"]);
  });

  it('reads a citation only from a trailing group of ids', () => {
    expect(citations('keeps time (T4, #39 Q1c)')).toEqual(['T4', '#39 Q1c']);
    expect(citations('every 1 ≤ k < n ≤ 16 (P4)')).toEqual(['P4']);
    expect(citations('writes a chord (pad or stab)')).toEqual([]);
    expect(citations('writes (C1) in the middle')).toEqual([]);
  });
});

describe('the catalogues on main', () => {
  it('keep the pawl: statuses on the ladder, named tests that exist, citations that agree', () => {
    expect(pawlProblems(repoOnDisk(root))).toEqual([]);
  });
});
