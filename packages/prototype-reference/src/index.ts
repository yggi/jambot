/**
 * The prototype as a test reference.
 *
 * Ported code is pinned to `prototype/jambot-prototype.html` itself, not to a
 * copy of it: `loadPrototype` cuts named top-level definitions out of the
 * prototype's script, unchanged, and evaluates them together. A test can then
 * compare a port against the real prototype over every case it cares about.
 */

import { readFileSync } from 'node:fs';

const prototypeFile = new URL('../../../prototype/jambot-prototype.html', import.meta.url);

let cachedScript: string | undefined;

function prototypeScript(): string {
  if (cachedScript === undefined) {
    const html = readFileSync(prototypeFile, 'utf8');
    const start = html.indexOf('<script>');
    const end = html.lastIndexOf('</script>');
    if (start < 0 || end < start) throw new Error('prototype: no <script> block found');
    cachedScript = html.slice(start + '<script>'.length, end);
  }
  return cachedScript;
}

/**
 * Loads top-level definitions (`const`, `let` or `function`) from the
 * prototype's script. Definitions refer to each other by name, so load
 * everything a definition uses, or pass it in as a stub.
 */
export function loadPrototype<T = Record<string, unknown>>(
  names: readonly string[],
  stubs: Record<string, unknown> = {},
): T {
  const script = prototypeScript();
  const sources = names.map((name) => definitionSource(script, name));
  const body = `${sources.join('\n')}\nreturn { ${names.join(', ')} };`;
  const stubNames = Object.keys(stubs);
  return new Function(...stubNames, body)(...stubNames.map((stubName) => stubs[stubName])) as T;
}

function definitionSource(script: string, name: string): string {
  const match = new RegExp(`^(?:const|let|function)\\s+${name}\\b`, 'm').exec(script);
  if (!match) throw new Error(`prototype: no top-level definition named "${name}"`);
  const start = match.index;
  const end = match[0].startsWith('function')
    ? endOfFunction(script, start)
    : endOfStatement(script, start);
  return script.slice(start, end);
}

/** Index just past the `}` that closes the function body starting after `start`. */
function endOfFunction(src: string, start: number): number {
  let depth = 0;
  let bodyOpened = false;
  return scan(src, start, (ch, i) => {
    if (ch === '(' || ch === '[' || ch === '{') {
      if (ch === '{' && depth === 0) bodyOpened = true;
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth === 0 && bodyOpened && ch === '}') return i + 1;
    }
    return undefined;
  });
}

/** Index just past the `;` that ends the statement starting at `start`. */
function endOfStatement(src: string, start: number): number {
  let depth = 0;
  return scan(src, start, (ch, i) => {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ';' && depth === 0) return i + 1;
    return undefined;
  });
}

/**
 * Walks JavaScript source from `start`, skipping strings, template literals,
 * comments and regex literals, and calls `visit` for every other character
 * until it returns an index.
 */
function scan(
  src: string,
  start: number,
  visit: (ch: string, i: number) => number | undefined,
): number {
  let i = start;
  let lastSignificant = '';
  while (i < src.length) {
    const ch = src[i]!;
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) break;
      continue;
    }
    if (ch === '/' && next === '*') {
      i = src.indexOf('*/', i + 2) + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(src, i, ch);
      lastSignificant = ch;
      continue;
    }
    if (ch === '`') {
      i = skipTemplate(src, i);
      lastSignificant = ch;
      continue;
    }
    if (ch === '/' && startsRegex(src, i, lastSignificant)) {
      i = skipRegex(src, i);
      lastSignificant = '/';
      continue;
    }
    const end = visit(ch, i);
    if (end !== undefined) return end;
    if (!/\s/.test(ch)) lastSignificant = ch;
    i++;
  }
  throw new Error('prototype: definition does not end');
}

function skipString(src: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < src.length && src[i] !== quote) i += src[i] === '\\' ? 2 : 1;
  return i + 1;
}

function skipTemplate(src: string, start: number): number {
  let i = start + 1;
  while (i < src.length && src[i] !== '`') {
    if (src[i] === '\\') i += 2;
    else if (src[i] === '$' && src[i + 1] === '{') {
      let depth = 0;
      i = scan(src, i + 1, (ch, j) => {
        if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) return j + 1;
        return undefined;
      });
    } else i++;
  }
  return i + 1;
}

/** A `/` starts a regex literal where an expression is expected, not after a value. */
function startsRegex(src: string, i: number, lastSignificant: string): boolean {
  if (lastSignificant === '' || '(,=:[!&|?{};+-*%<>~^'.includes(lastSignificant)) return true;
  const before = src.slice(Math.max(0, i - 7), i).trimEnd();
  return /\b(?:return|typeof|case)$/.test(before);
}

function skipRegex(src: string, start: number): number {
  let i = start + 1;
  let inClass = false;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') i += 2;
    else {
      if (ch === '[') inClass = true;
      else if (ch === ']') inClass = false;
      else if (ch === '/' && !inClass) break;
      i++;
    }
  }
  i++;
  while (i < src.length && /[a-z]/i.test(src[i]!)) i++;
  return i;
}
