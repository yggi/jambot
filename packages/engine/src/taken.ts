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
import { signatureOf } from '@yggi/cells/engine/use';
import type { CompileResult, Resolve } from '@yggi/cells/engine/program';
import { fitsAs, useOn } from '@yggi/cells/repository/fit';
import type { LearnedLayer } from '@yggi/cells/repository/fragments';
import { resolveSeed } from '@yggi/cells/repository/library';

/** The id a template is taken by on its workbench. */
const TAKEN = 'taken';

/** The compiles a collection's fit is judged by, kept by text: the last `COMPILES`, its `from` lines read from cells' seed. */
const COMPILES = 2048;
const compiles = new Map<string, CompileResult>();
function compiledSeed(text: string): CompileResult {
  const kept = compiles.get(text);
  if (kept) {
    compiles.delete(text);
    compiles.set(text, kept);
    return kept;
  }
  const result = compileSource(text, undefined, { resolve: resolveSeed });
  compiles.set(text, result);
  if (compiles.size > COMPILES) compiles.delete(compiles.keys().next().value!);
  return result;
}

/** A fragment on a workbench: the text, and how its `from` lines read. */
export interface Taken {
  readonly text: string;
  readonly resolve: Resolve;
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
  const resolve: Resolve = (id, hash) => (id === TAKEN ? text : resolveSeed(id, hash));
  const on = signatureOf(text)
    ? useOn(bench, TAKEN, { resolve, ...as }).text
    : // (a collection's fit compiles its lines and the workbench's, never the id it is taken by: kept by text)
      fitsAs(TAKEN, bench, { resolve, compiled: compiledSeed }).text;
  return { text: on, resolve };
}

/** A taken text compiled through its resolve. */
export const compileTaken = ({ text, resolve }: Taken): CompileResult =>
  compileSource(text, undefined, { resolve });

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
