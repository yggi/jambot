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

/**
 * An entry as the history sees it: its highest rung, the rung of each scope
 * its status names (`measured (drums); open (compile)`), its rule, and
 * whether it is retired or an alias.
 */
export interface Reading {
  evidence: Evidence;
  scopes: Map<string, Evidence>;
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
      const scopes = new Map<string, Evidence>();
      let failing = false;
      let rule = entry.decided;
      let retired = entry.retired;
      for (const part of parts(entry.status ?? '')) {
        if (part.startsWith('decided')) rule ??= part;
        else if (part.startsWith('retired')) retired ??= part;
        else {
          const rung = ladder.find((r) => r !== 'none' && part.startsWith(r));
          if (rung && ladder.indexOf(rung) > ladder.indexOf(evidence)) evidence = rung;
          const scope = /\(([^()]*)\)$/.exec(part)?.[1];
          if (rung && scope !== undefined) scopes.set(scope, rung);
          if (part.startsWith('measured, failing')) failing = true;
        }
      }
      version.set(entry.id, { evidence, scopes, failing, rule, retired, alias: entry.same });
    }
  }
  return version;
}

const below = (a: Evidence, b: Evidence) => ladder.indexOf(a) < ladder.indexOf(b);

/**
 * Everything that fell between two versions without a reason, one line
 * each. An entry that became an alias is held to the entry it now names,
 * and an entry taken out of retirement to what it had before.
 */
export function falls(before: Version, after: Version): string[] {
  const problems: string[] = [];
  for (const [id, was] of before) {
    if (was.alias !== undefined) continue;
    const now = after.get(id);
    if (!now) {
      if (was.retired === undefined) problems.push(`${id}: the entry disappeared without Retired:`);
      continue;
    }
    if (now.retired !== undefined) continue;
    const target = now.alias === undefined ? now : after.get(now.alias);
    if (!target) continue; // The pawl refuses an alias of nothing.
    const as = now.alias === undefined ? '' : `, as the same as ${now.alias},`;
    if (below(target.evidence, was.evidence))
      problems.push(
        `${id}: the evidence fell from ${was.evidence} to ${target.evidence}${as} without Retired:`,
      );
    else
      for (const [scope, rung] of was.scopes) {
        const kept = target.scopes.get(scope);
        if (kept !== undefined && below(kept, rung))
          problems.push(
            `${id}: the evidence for ${scope} fell from ${rung} to ${kept}${as} without Retired:`,
          );
      }
    if (was.rule !== undefined && target.rule === undefined)
      problems.push(`${id}: the rule "${was.rule}" was withdrawn${as} without Retired:`);
  }
  return problems;
}

/**
 * The version the gate compares with: the merge base with `origin/main`,
 * or, where that is `HEAD` itself, as on `main`, `HEAD`'s first parent.
 */
export function baseOf(mergeBase: string, head: string, parent: string | undefined): string {
  return mergeBase === head && parent !== undefined ? parent : mergeBase;
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rev = process.argv[2] ?? 'origin/main';
  try {
    git('rev-parse', '--verify', `${rev}^{commit}`);
  } catch {
    console.error(`no revision ${rev}: fetch it first, as with git fetch origin main`);
    process.exit(1);
  }
  report(rev);
}
