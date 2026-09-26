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
  return repoOf({ 'docs/language.md': catalogue }, files);
}

/** A repository holding each of `catalogues` at its path, and `files`. */
function repoOf(catalogues: Record<string, string>, files: Record<string, string> = {}): Repo {
  const all: Record<string, string> = { ...catalogues, ...files };
  return {
    catalogues: Object.keys(catalogues),
    paths: Object.keys(all),
    read: (path) => all[path]!,
  };
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

  it('refuses an entry with neither evidence nor a rule, or evidence off the ladder (rule 1)', () => {
    expect(pawlProblems(repo('**C1. Nothing jumps.** Source: spirit.'))).toEqual([
      'docs/language.md:1 C1 has no status and is not decided',
    ]);
    expect(pawlProblems(repo('**C1. Nothing jumps.** Status: settled.'))).toEqual([
      'docs/language.md:1 C1 has a status off the ladder: "settled"',
    ]);
  });

  it('takes every rung of the evidence ladder, with a scope and several parts', () => {
    const statuses = [
      'speculative',
      'open',
      'derived',
      'measured',
      'measured, failing (prototype)',
      'measured (drums); measured, failing (the score, E1)',
    ];
    for (const status of statuses) {
      const entry = `**C1. Nothing jumps.**\nTest: \`style.test.ts\`.\nStatus: ${status}.`;
      expect(pawlProblems(repo(entry, styleTests)), status).toEqual([]);
    }
  });

  it('keeps a rule out of the evidence: decided is its own field (rule 1)', () => {
    expect(pawlProblems(repo('**C1. Nothing jumps.** Status: decided.'))).toEqual([
      'docs/language.md:1 C1 writes "decided" in its status; a rule goes in Decided:',
    ]);
    expect(
      pawlProblems(repo('**C1. Nothing jumps.** Status: decided (provenance); open.')),
    ).toEqual([
      'docs/language.md:1 C1 writes "decided (provenance)" in its status; a rule goes in Decided:',
    ]);
  });

  it('takes a rule with where and how it was decided, with or without evidence (rule 8)', () => {
    const decisions = [
      'spirit, inherited',
      'spirit, inherited (the behaviour)',
      '#38, on measured options',
      '#7 after #33, dissolved',
      '#37 step 3, in the working track',
      '#7, ahead of the evidence',
    ];
    for (const decided of decisions) {
      expect(pawlProblems(repo(`**C1. Nothing jumps.** Decided: ${decided}.`)), decided).toEqual(
        [],
      );
      const measured = `${glide}\nDecided: ${decided}.`;
      expect(pawlProblems(repo(measured, styleTests)), decided).toEqual([]);
    }
  });

  it('refuses a rule that does not say how it was decided (rule 8)', () => {
    expect(pawlProblems(repo('**C1. Nothing jumps.** Decided: #38.'))).toEqual([
      'docs/language.md:1 C1 is decided, but not how: say inherited, dissolved, on measured options, in the working track or ahead of the evidence',
    ]);
    expect(pawlProblems(repo('**C1. Nothing jumps.** Decided: #38, because.'))).toEqual([
      'docs/language.md:1 C1 is decided, but not how: say inherited, dissolved, on measured options, in the working track or ahead of the evidence',
    ]);
  });

  it('takes a retired entry with its reason, and refuses one without (rule 8)', () => {
    const retired = '**C1. Nothing jumps.** Status: open. Retired: C9 says it better.';
    expect(pawlProblems(repo(retired))).toEqual([]);
    expect(pawlProblems(repo('**C1. Nothing jumps.** Status: open. Retired: .'))).toEqual([
      'docs/language.md:1 C1 is retired without a reason',
    ]);
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

  it('refuses a test that cites an id no catalogue defines, or cites it in another form (rule 4)', () => {
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
      'packages/engine/src/style.test.ts cites "#12 Q1"; a citation names the id alone',
    ]);
    const loose = {
      'packages/engine/src/style.test.ts': spec(
        'starts from where the running glide is',
        'glides (C1, see below)',
      ),
    };
    expect(pawlProblems(repo(glide, loose))).toEqual([
      'packages/engine/src/style.test.ts cites "see below"; a citation holds only ids and issue numbers',
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
        'keeps its rate (#38, C1)',
      ),
    };
    expect(pawlProblems(repo(byId, files))).toEqual([]);
  });

  it('refuses an id defined twice (rule 6)', () => {
    const twice = `${glide}\n\n**C1. Nothing jumps, again.** Decided: spirit, inherited.`;
    expect(pawlProblems(repo(twice, styleTests))).toEqual([
      'docs/language.md:6 C1 is defined twice, first at line 1',
    ]);
  });

  it('refuses an id defined in two catalogues (rule 6)', () => {
    const catalogues = {
      'docs/language.md': glide,
      'docs/quinetic.md': '**C1. Nothing jumps, here too.** Status: open.',
    };
    expect(pawlProblems(repoOf(catalogues, styleTests))).toEqual([
      'docs/quinetic.md:1 C1 is defined twice, first at docs/language.md:1',
    ]);
  });

  it('reads an alias as its target: no status of its own, and a citation of it checked against the target (rule 7)', () => {
    const catalogues = {
      'docs/language.md': glide,
      'docs/quinetic.md': '**Q1. Nothing jumps.** Same as C1.',
    };
    const files = {
      'packages/engine/src/style.test.ts': spec(
        'starts from where the running glide is',
        'glides (Q1)',
      ),
    };
    expect(pawlProblems(repoOf(catalogues, files))).toEqual([]);
    const elsewhere = { ...styleTests, 'packages/engine/src/swing.test.ts': spec('swings (Q1)') };
    expect(pawlProblems(repoOf(catalogues, elsewhere))).toEqual([
      'packages/engine/src/swing.test.ts cites Q1, whose test does not name that file',
    ]);
  });

  it('refuses an alias with fields of its own, which would go unchecked (rule 7)', () => {
    const catalogues = {
      'docs/language.md': glide,
      'docs/quinetic.md': '**Q1. Nothing jumps.** Same as C1. Status: bogus rung.',
    };
    expect(pawlProblems(repoOf(catalogues, styleTests))).toEqual([
      'docs/quinetic.md:1 Q1 is the same as C1, so it has no fields of its own',
    ]);
  });

  it("reads Same as only as an entry's first field, so prose can't make an alias", () => {
    const prose = '**C1. Foo.** Status: measured. Test: open. Same as C2 in spirit.';
    expect(pawlProblems(repo(prose))).toEqual([
      'docs/language.md:1 C1 is measured but its test names no file',
    ]);
  });

  it('refuses an alias of an id no catalogue defines, or of another alias (rule 7)', () => {
    const missing = {
      'docs/language.md': glide,
      'docs/quinetic.md': '**Q1. Nothing.** Same as C9.',
    };
    expect(pawlProblems(repoOf(missing, styleTests))).toEqual([
      'docs/quinetic.md:1 Q1 is the same as C9, which no catalogue defines',
    ]);
    const chain = {
      'docs/language.md': glide,
      'docs/quinetic.md': '**Q1. Nothing.** Same as C1.\n\n**Q2. Still nothing.** Same as Q1.',
    };
    expect(pawlProblems(repoOf(chain, styleTests))).toEqual([
      'docs/quinetic.md:3 Q2 is the same as Q1, which is itself an alias',
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
      '**R1. A musician reads it like a lead sheet.** Source: spirit. Status:\nopen. Test: open. Decided: spirit, inherited.',
    );
    expect(entry).toMatchObject({
      id: 'R1',
      line: 1,
      status: 'open',
      test: 'open',
      decided: 'spirit, inherited',
    });
  });

  it('reads on over a wrapped line that starts with an issue number, and stops at a heading', () => {
    const [entry, next] = readCatalogue(
      [
        '**C4. A part morphs.**',
        'Source: the prototype README and',
        "#40's review. Status: measured.",
        '## Pitch',
        'Status: decided.',
      ].join('\n'),
    );
    expect(entry).toMatchObject({ id: 'C4', status: 'measured' });
    expect(next).toBeUndefined();
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
    expect(citations('splits at the octave (#38, P6)')).toEqual(['#38', 'P6']);
    expect(citations('decides it (#38)')).toEqual([]);
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
