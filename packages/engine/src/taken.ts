/**
 * A fragment taken onto a workbench, as the band reads one (#562, yggi/cells
 * decision 065): a template, a text with a signature (`&bassline from
 * &harm`), by a `from` line, its head and its main argument the cells the
 * reader names (cells' `useOn`: `&bassline from fit_<hash> &harm`); any
 * other text, a collection (a groove, a line the Muse filed), by its lines
 * (cells' `unionOf`, the union its fit reads: a line the workbench gives word
 * for word kept once, a name both define by different lines renamed).
 *
 * Nothing is bound by name: a reader names the head it reads and the main
 * argument the workbench gives, since a meter, a key and a harmony all read
 * as tables, and cells picks none where several meet a parameter (yggi/cells
 * decision 075). The text compiles through the resolve it comes with, which
 * reads the template by the id cells gives its text (`fit_<hash>`) and every
 * other id from cells' seed library.
 */

import { compileSource } from '@yggi/cells';
import type { CompileResult, Resolve } from '@yggi/cells';
import { signatureOf, unionOf, useOn } from '@yggi/cells/repository';
import { resolveSeed } from '@yggi/cells/library';

/**
 * Compiles kept by text, the last `COMPILES`, each through the resolve it is handed: a template's text takes it by the
 * id cells gives its text, `fit_<hash>`, so one text reads one way whoever compiles it. A template's copy is compiled by
 * `useOn` and again by its reader: once, so the warm-up that reads them costs the page's main thread no more than a
 * union did (#562).
 */
const COMPILES = 2048;
const compiles = new Map<string, CompileResult>();
function compiledBy(text: string, resolve: Resolve): CompileResult {
  const kept = compiles.get(text);
  if (kept) {
    compiles.delete(text);
    compiles.set(text, kept);
    return kept;
  }
  const result = compileSource(text, undefined, { resolve });
  compiles.set(text, result);
  if (compiles.size > COMPILES) compiles.delete(compiles.keys().next().value!);
  return result;
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
 * A fragment's text on a workbench (see the module's comment): a template by a `from` line, as `as` names it (cells'
 * `useOn`, given the text), and a collection by its lines (cells' `unionOf`, written with no compile: a name both define
 * by different lines renamed, its `from` lines carried over).
 */
export function takenOn(text: string, bench: string, { head, main }: TakenAs): Taken {
  const taken =
    signatureOf(text) !== null
      ? useOn(bench, { text, head }, { resolve: resolveSeed, compiled: compiledBy, main })
      : { text: unionOf(text, bench).text, resolve: resolveSeed };
  return {
    text: taken.text,
    resolve: taken.resolve,
    compiled: (source) => compiledBy(source, taken.resolve),
  };
}

/** A taken text compiled through its resolve, kept by text. */
export const compileTaken = ({ text, compiled }: Taken): CompileResult => compiled(text);
