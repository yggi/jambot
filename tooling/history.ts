/**
 * The ratchet over time (#43): the catalogues read at any version, the
 * gate that their evidence only rises and their rules are withdrawn only
 * with a reason, and the report of entries by evidence and rules by how.
 * It reads the form before #43, where a rule was a part of the status, so
 * the whole history of `main` reads the same way.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CATALOGUES, readCatalogue, ways } from './pawl.ts';

/** The evidence ladder, lowest first; `none` is a rule with no evidence yet. */
const ladder = ['none', 'speculative', 'open', 'derived', 'measured'] as const;
export type Evidence = (typeof ladder)[number];

/** An entry as the history sees it. */
export interface Reading {
  evidence: Evidence;
  failing: boolean;
  rule: string | undefined;
  retired: string | undefined;
  alias: string | undefined;
}

/** The catalogues at one version, by id. */
export type Version = Map<string, Reading>;

/** Splits a status into its parts, keeping the semicolons inside a scope. */
function parts(status: string): string[] {
  const found: string[] = [];
  let depth = 0;
  let part = '';
  for (const char of status) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ';' && depth === 0) {
      found.push(part.trim());
      part = '';
    } else part += char;
  }
  found.push(part.trim());
  return found.filter((p) => p !== '');
}

/** The catalogues' texts, by path, read as one version. */
export function readVersion(texts: Record<string, string>): Version {
  const version: Version = new Map();
  for (const text of Object.values(texts)) {
    for (const entry of readCatalogue(text)) {
      let evidence: Evidence = 'none';
      let failing = false;
      let rule = entry.decided;
      let retired = entry.retired;
      for (const part of parts(entry.status ?? '')) {
        if (part.startsWith('decided')) rule ??= part;
        else if (part.startsWith('retired')) retired ??= part;
        else {
          const rung = ladder.find((r) => r !== 'none' && part.startsWith(r));
          if (rung && ladder.indexOf(rung) > ladder.indexOf(evidence)) evidence = rung;
          if (part.startsWith('measured, failing')) failing = true;
        }
      }
      version.set(entry.id, { evidence, failing, rule, retired, alias: entry.same });
    }
  }
  return version;
}

/** Everything that fell between two versions without a reason, one line each. */
export function falls(before: Version, after: Version): string[] {
  const problems: string[] = [];
  for (const [id, was] of before) {
    const now = after.get(id);
    if (was.alias !== undefined || was.retired !== undefined) continue;
    if (!now) {
      problems.push(`${id}: the entry disappeared without Retired:`);
      continue;
    }
    if (now.retired !== undefined || now.alias !== undefined) continue;
    if (ladder.indexOf(now.evidence) < ladder.indexOf(was.evidence))
      problems.push(
        `${id}: the evidence fell from ${was.evidence} to ${now.evidence} without Retired:`,
      );
    if (was.rule !== undefined && now.rule === undefined)
      problems.push(`${id}: the rule "${was.rule}" was withdrawn without Retired:`);
  }
  return problems;
}

/** One version's counts: entries by evidence, rules by how, aliases. */
export interface Counts {
  entries: number;
  none: number;
  speculative: number;
  open: number;
  derived: number;
  measured: number;
  failing: number;
  rules: Record<string, number>;
  aliases: number;
}

/** The counts of each version, in order. */
export function series(versions: Version[]): Counts[] {
  return versions.map((version) => {
    const counts: Counts = {
      entries: 0,
      none: 0,
      speculative: 0,
      open: 0,
      derived: 0,
      measured: 0,
      failing: 0,
      rules: {},
      aliases: 0,
    };
    for (const reading of version.values()) {
      if (reading.alias !== undefined) {
        counts.aliases++;
        continue;
      }
      if (reading.retired !== undefined) continue;
      counts.entries++;
      counts[reading.evidence]++;
      if (reading.failing) counts.failing++;
      if (reading.rule !== undefined) {
        const way = ways.find((w) => reading.rule!.includes(`, ${w}`)) ?? 'unsaid';
        counts.rules[way] = (counts.rules[way] ?? 0) + 1;
      }
    }
    return counts;
  });
}

const git = (...args: string[]) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

/** The catalogues at a revision; a catalogue that did not exist yet is left out. */
function at(rev: string): Version {
  const texts: Record<string, string> = {};
  for (const path of CATALOGUES) {
    try {
      texts[path] = git('show', `${rev}:${path}`);
    } catch {
      // Not there yet at this revision.
    }
  }
  return readVersion(texts);
}

/**
 * `pnpm ratchet [rev]`: every commit on the first-parent line of `rev`
 * (default `origin/main`) that changed a catalogue, with its counts, and
 * what fell between neighbours.
 */
function report(rev = 'origin/main'): void {
  const commits = git(
    'log',
    '--first-parent',
    '--reverse',
    '--format=%h %ad %s',
    '--date=short',
    rev,
    '--',
    ...CATALOGUES,
  )
    .trim()
    .split('\n')
    .filter(Boolean);
  const versions = commits.map((line) => at(line.split(' ')[0]!));
  const rows = series(versions);
  const header =
    'commit   date        entries  none spec open derv meas fail aliases  rules (by how)';
  console.log(header);
  commits.forEach((line, n) => {
    const [sha, date] = line.split(' ');
    const c = rows[n]!;
    const rules = Object.entries(c.rules)
      .map(([way, count]) => `${way} ${count}`)
      .join(', ');
    const cells = [c.none, c.speculative, c.open, c.derived, c.measured, c.failing].map((v) =>
      String(v).padStart(4),
    );
    console.log(
      `${sha!.padEnd(8)} ${date}  ${String(c.entries).padStart(7)} ${cells.join(' ')} ${String(c.aliases).padStart(7)}  ${rules}`,
    );
    if (n > 0)
      for (const fall of falls(versions[n - 1]!, versions[n]!))
        console.log(`         fell: ${fall}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) report(process.argv[2]);
