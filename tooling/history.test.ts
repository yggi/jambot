import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { falls, readVersion, series, type Version } from './history.ts';
import { CATALOGUES } from './pawl.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

/** A version of the catalogues: docs/language.md as `text`. */
const version = (text: string): Version => readVersion({ 'docs/language.md': text });

const measured = '**C1. Nothing jumps.** Test: `style.test.ts`. Status: measured.';
const open = '**C1. Nothing jumps.** Test: open. Status: open.';

describe('reading a version', () => {
  it('takes the highest rung of the evidence, and the rule with where and how', () => {
    const [entry] = version(
      '**C1. Nothing jumps.** Status: measured (drums); open (compile). Decided: spirit, inherited.',
    ).values();
    expect(entry).toMatchObject({ evidence: 'measured', rule: 'spirit, inherited' });
  });

  it('reads the form before #43, where a rule was a part of the status', () => {
    const [entry] = version(
      '**A3. Every event carries its source.** Status: decided (provenance); open (confidence).',
    ).values();
    expect(entry).toMatchObject({ evidence: 'open', rule: 'decided (provenance)' });
    const [bare] = version('**L1. The bottom is flat.** Status: decided.').values();
    expect(bare).toMatchObject({ evidence: 'none', rule: 'decided' });
  });

  it('reads an alias as an alias, with no evidence of its own', () => {
    const [entry] = version('**Q2. Analysis settles.** Same as F4.').values();
    expect(entry).toMatchObject({ alias: 'F4' });
  });
});

describe('the evidence only rises (the gate)', () => {
  it('lets evidence rise, and a rule arrive', () => {
    expect(falls(version(open), version(measured))).toEqual([]);
    expect(falls(version(open), version(`${open} Decided: #38, on measured options.`))).toEqual([]);
  });

  it('refuses evidence that falls, unless the entry is retired with a reason', () => {
    expect(falls(version(measured), version(open))).toEqual([
      'C1: the evidence fell from measured to open without Retired:',
    ]);
    expect(falls(version(measured), version(`${open} Retired: C9 says it better.`))).toEqual([]);
  });

  it('refuses a rule withdrawn, unless the entry is retired', () => {
    const decided = `${measured} Decided: spirit, inherited.`;
    expect(falls(version(decided), version(measured))).toEqual([
      'C1: the rule "spirit, inherited" was withdrawn without Retired:',
    ]);
    expect(falls(version(decided), version(`${measured} Retired: a rule no longer.`))).toEqual([]);
  });

  it('refuses an entry that disappears, unless it was retired first', () => {
    const other = '**C2. A range.** Status: open.';
    expect(falls(version(measured), version(other))).toEqual([
      'C1: the entry disappeared without Retired:',
    ]);
    const retired = `${measured} Retired: C2 says it better.`;
    expect(falls(version(retired), version(other))).toEqual([]);
  });

  it('lets an entry become an alias, which is a contraction', () => {
    const catalogues = (quinetic: string): Version =>
      readVersion({ 'docs/language.md': measured, 'docs/quinetic.md': quinetic });
    const before = catalogues('**Q1. Nothing jumps.** Status: open.');
    expect(falls(before, catalogues('**Q1. Nothing jumps.** Same as C1.'))).toEqual([]);
  });

  it('reads a move from decided to measured across #43 as no fall', () => {
    const before = version('**T1. The clock never waits.** Status: decided.');
    const after = version(
      '**T1. The clock never waits.** Test: `transport.test.ts`. Status: measured. Decided: spirit, inherited.',
    );
    expect(falls(before, after)).toEqual([]);
  });
});

describe('the report', () => {
  it('counts entries by evidence, rules by how, and aliases, per version', () => {
    const texts = [
      open,
      `${measured} Decided: spirit, inherited.\n\n**C2. A range.** Status: speculative.`,
    ];
    expect(series(texts.map(version))).toEqual([
      {
        entries: 1,
        none: 0,
        speculative: 0,
        open: 1,
        derived: 0,
        measured: 0,
        failing: 0,
        rules: {},
        aliases: 0,
      },
      {
        entries: 2,
        none: 0,
        speculative: 1,
        open: 0,
        derived: 0,
        measured: 1,
        failing: 0,
        rules: { inherited: 1 },
        aliases: 0,
      },
    ]);
  });
});

/** The merge base with origin/main, or undefined where there is no history to compare. */
function mergeBase(): string | undefined {
  try {
    return execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

const base = mergeBase();

/** The catalogues at `rev`, or as they are on disk. */
function catalogues(rev?: string): Version {
  const texts: Record<string, string> = {};
  for (const path of CATALOGUES) {
    try {
      texts[path] = rev
        ? execFileSync('git', ['show', `${rev}:${path}`], {
            cwd: root,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          })
        : readFileSync(join(root, path), 'utf8');
    } catch {
      // A catalogue that does not exist yet at that version.
    }
  }
  return readVersion(texts);
}

describe('the catalogues on this branch', () => {
  it.skipIf(base === undefined)(
    base === undefined
      ? 'keep their evidence and rules: skipped, as there is no origin/main to compare with'
      : 'keep their evidence and rules against the merge base with origin/main',
    () => {
      expect(falls(catalogues(base), catalogues())).toEqual([]);
    },
  );
});
