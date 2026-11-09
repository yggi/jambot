/**
 * A fragment taken onto a workbench, as the band reads one (#562, yggi/cells
 * decision 065): a template, a text with a signature (`&bassline from
 * &harm`), by a `from` line, its head and its main argument the cells the
 * reader names (cells' `useOn`: `&bassline from taken &harm`); any other
 * text, a collection (a groove, a line the Muse filed), by its lines (cells'
 * `fitsAs`, the union its fit reads: a line the workbench gives word for
 * word kept once, a name both define by different lines renamed).
 *
 * Nothing is bound by name: a reader names the head it reads and the main
 * argument the workbench gives, since a meter, a key and a harmony all read
 * as tables, and cells picks none where several meet a parameter (yggi/cells
 * decision 075). The text compiles through the resolve it comes with, which
 * reads the template as `taken` and every other id from cells' seed library.
 */

import { compileSource } from '@yggi/cells/engine/compile';
import { hasUse, signatureOf } from '@yggi/cells/engine/use';
import type { CompileResult, Resolve } from '@yggi/cells/engine/program';
import { declarations, fitsAs, useOn } from '@yggi/cells/repository/fit';
import type { LearnedLayer } from '@yggi/cells/repository/fragments';
import { resolveSeed } from '@yggi/cells/repository/library';

/** The id a template is taken by on its workbench. */
const TAKEN = 'taken';

/**
 * Compiles kept by text, the last `COMPILES`: a template's, read through its own resolve, kept by the template too (each
 * is taken as `taken`), and a collection's, read from cells' seed. A template's copy is compiled by `useOn` and again by
 * its reader, and a collection's fit compiles the workbench each time: once each, so the warm-up that reads them costs
 * the page's main thread no more than a union did (#562).
 */
const COMPILES = 2048;
const compiles = new Map<string, CompileResult>();
function compiledBy(template: string, resolve: Resolve): (text: string) => CompileResult {
  return (text) => {
    const key = `${template}\u0000${text}`;
    const kept = compiles.get(key);
    if (kept) {
      compiles.delete(key);
      compiles.set(key, kept);
      return kept;
    }
    const result = compileSource(text, undefined, { resolve });
    compiles.set(key, result);
    if (compiles.size > COMPILES) compiles.delete(compiles.keys().next().value!);
    return result;
  };
}

/**
 * Whether a collection's union with a workbench renames any of its names: whether a name both define is defined by
 * different lines (cells' union by lines renames those, and only after one of those any other).
 */
export function collides(text: string, bench: string): boolean {
  const there = new Map(declarations(bench).map((l) => [l.name, l.code]));
  return declarations(text).some((l) => there.has(l.name) && there.get(l.name) !== l.code);
}

/**
 * A collection's union with a workbench, written without judging the fit, where cells' union by lines is no more than
 * text: no name collides and the collection takes nothing by a `from` line. The workbench, then each of its lines the
 * workbench doesn't give word for word (lifted from yggi/cells src/repository/fit.ts `unionByName` @ v0.21.0, its case
 * with nothing to rename). Null otherwise: cells' `fitsAs` writes it. A union is text a read compiles, and judging it
 * there costs the warm-up its compiles on the page's main thread (#562).
 */
export function unionOn(text: string, bench: string): string | null {
  if (hasUse(text) || collides(text, bench)) return null;
  const there = new Map(declarations(bench).map((l) => [l.name, l.code]));
  const head = bench.replace(/\s+$/, '');
  const kept = declarations(text)
    .filter((l) => there.get(l.name) !== l.code)
    .map((l) => l.written);
  return [...(head ? [head] : []), ...kept].join('\n');
}

/** A fragment on a workbench: the text, how its `from` lines read, and its compile, kept by text. */
export interface Taken {
  readonly text: string;
  readonly resolve: Resolve;
  readonly compiled: (text: string) => CompileResult;
}

/** What a template is taken as: its head's name and its main argument, both the workbench's to give. */
export interface TakenAs {
  readonly head: string;
  readonly main: string;
}

/**
 * A fragment's text on a workbench (see the module's comment): a template by a `from` line, as `as` names it, and a
 * collection by its lines.
 */
export function takenOn(text: string, bench: string, as: TakenAs): Taken {
  const template = signatureOf(text) !== null;
  const resolve: Resolve = (id, hash) => (template && id === TAKEN ? text : resolveSeed(id, hash));
  // (a collection's fit compiles its lines and the workbench's, never the id it is taken by: kept by text alone)
  const compiled = compiledBy(template ? text : '', resolve);
  const on = template
    ? useOn(bench, TAKEN, { resolve, compiled, ...as }).text
    : (unionOn(text, bench) ??
      fitsAs(TAKEN, bench, {
        resolve: (id, hash) => (id === TAKEN ? text : resolveSeed(id, hash)),
        compiled,
      }).text);
  return { text: on, resolve, compiled };
}

/** A taken text compiled through its resolve, kept by text. */
export const compileTaken = ({ text, compiled }: Taken): CompileResult => compiled(text);

/** The signature each facet's stated lines are written with (`lineText`, `progressionText`), by facet and head. */
const SIGNED: readonly {
  readonly facet: string;
  readonly head: string;
  readonly signature: string;
}[] = [
  { facet: 'bass', head: '&bassline', signature: '&bassline from &harm' },
  { facet: 'harmony', head: '&harm', signature: '&harm from &key' },
];

/**
 * A kept layer's bass lines and progressions with the signature they are stated with since cells v0.21.0 (#562), for
 * one filed before: cells' identity keeps the names a signature declares, so a line heard again is known as the one
 * filed only once both are templates. A layer with none to sign is returned as it is.
 */
export function signedLayer(layer: LearnedLayer): LearnedLayer {
  const signed = (file: LearnedLayer['filed'][number]) => {
    const { text, association } = file.fragment;
    const as = SIGNED.find(
      (s) => association.some((p) => p.facet === s.facet) && text.startsWith(`${s.head} `),
    );
    return as && !signatureOf(text)
      ? { ...file, fragment: { ...file.fragment, text: `${as.signature}\n${text}` } }
      : file;
  };
  const filed = layer.filed.map(signed);
  return filed.every((file, i) => file === layer.filed[i]) ? layer : { ...layer, filed };
}
