/**
 * The composer's short-term memory (#401; yggi/cells decision 043's
 * workbench, 046's use together): the fragments it kept or filed lately,
 * each with a weight that fades a section at a time (`fading.ts`, C9's
 * remember), so what was played a section ago is still in mind and what was
 * played long ago is not.
 *
 * At each section's start the memory fades by `SHORT_TERM_DECAY`, the
 * grooves the Muse files there enter it, and what weighs `SHORT_TERM_FLOOR`
 * or more is what the composer has chosen already (`chosenOf`, cells'
 * `chosen`): each query of the section ranks nearer a fragment used often
 * with those, so the meter and the groove pull each other over sections.
 * The meter, rhythm and clave the section keeps enter it after.
 *
 * A fragment kept at one section is in mind for the next two: a weight of
 * 1 fades to 0.5, then 0.25, the floor, then out. Two sections are what a
 * groove filed on a miss holds around its point (cells' `FILING_WEIGHT`: the
 * next 0.03, two sections of the radio's walk at entropy 0.3), so a style
 * walking past where a groove was filed meets it with the groove in mind.
 * Nothing learned, no pull: with no learned layer, or none of its uses
 * together, the memory chooses nothing a query weighs.
 */

import { fold } from './fading.ts';

/** The fragments in mind, by id, each with its weight: never negative, none below the floor. */
export type ShortTerm = readonly { readonly id: string; readonly weight: number }[];

/** Nothing in mind: a song's start. */
export const NO_SHORT_TERM: ShortTerm = [];

/** What a section keeps of the memory's weights: half, a time constant of 2 sections (`timeConstant`). */
export const SHORT_TERM_DECAY = 0.5;

/** The least weight in mind: a fragment kept at one section is in mind for the next two, then out. */
export const SHORT_TERM_FLOOR = 0.25;

/**
 * The memory after a fold (`fading.ts`'s `fold`): each weight faded by
 * `decay`, each of `ids` added 1 (a new one entering at the end), and
 * every one below the floor let go.
 */
export function remembered(
  memory: ShortTerm,
  ids: readonly string[],
  decay: number = SHORT_TERM_DECAY,
): ShortTerm {
  const alphabet = [...memory.map((m) => m.id)];
  for (const id of ids) if (!alphabet.includes(id)) alphabet.push(id);
  const weights = fold(
    alphabet.map((id) => memory.find((m) => m.id === id)?.weight ?? 0),
    decay,
    ids.map((id) => [alphabet.indexOf(id), 1] as const),
  );
  return alphabet
    .map((id, i) => ({ id, weight: weights[i]! }))
    .filter((m) => m.weight >= SHORT_TERM_FLOOR);
}

/** What the composer has chosen already: every fragment in mind, in the order it entered. */
export const chosenOf = (memory: ShortTerm): string[] => memory.map((m) => m.id);
