/**
 * Cells' repository of modes, as a preset finds its own (#420, rung 3):
 * cells' `MODE_FRAGMENTS` (v0.9.0, yggi/cells#233, decision 056), each one
 * line that defines the piece's main key, `&key scale(dorian, free(C))`,
 * read by cells' own compiler into one of the composer's modes
 * (`readModeFragment`) and ranked by cells' own `query` on the facet `mode`.
 *
 * A fragment states the mode and leaves the tonic to the host, a hole
 * (`scale(dorian, &tonic)`, yggi/cells#300), which the key plan sets as it
 * moves. One the band can't play is left out, and says why: a scale that is
 * none of `COMPOSER_MODES`, a tonic fixed, no key, or a text that doesn't
 * compile. Cells' five are all played, the bell
 * and scale as ionian.
 *
 * A preset's mode is the one found nearest its point (`presetMode`): each
 * of the eight finds the mode `PRESETS` once named by hand, at distance 0.
 * It asks cells' seed alone, so a preset wishes for the same mode in every
 * session; the band takes the wish where its next section starts
 * (`nextKey`).
 */

import { gaps, diatonicMode } from '@jambot/theory';
import { compileSource } from '@yggi/cells/engine/compile';
import { type Fragment, createRepository } from '@yggi/cells/repository/fragments';
import { holesOf } from '@yggi/cells/repository/holes';
import { MODE_FRAGMENTS } from '@yggi/cells/repository/modes';
import { COMPOSER_MODES, type ComposerMode } from './key.ts';
import { withInstruments } from './instruments.ts';
import { MISS_DISTANCE, type StylePoint, stylePoint } from './meter-query.ts';
import type { Preset } from './style.ts';

/** A mode fragment as the band plays it: its id in the repository, and its mode. */
export interface ModeFragment {
  readonly id: string;
  readonly mode: ComposerMode;
}

/** A repository of modes: what it holds, and how it ranks them. */
export interface ModeRepository {
  /** The fragments the band can play, by id. */
  readonly fragments: ReadonlyMap<string, ModeFragment>;
  /** Every fragment the band can play, with its distance from a point, nearest first. */
  query(point: StylePoint): readonly { readonly id: string; readonly distance: number }[];
}

/** The workbench a fragment is read on: a meter, which a stepped key (the bell and scale's) taps, and a tonic for its hole. */
const BENCH = '&bar meter("4/4") step=120bpm\n&tonic C';

/** Each composer mode's steps, in semitones, from its tonic. */
const STEPS = COMPOSER_MODES.map((mode) => ({ mode, steps: gaps(diatonicMode(mode)) }));

/** A fragment read by cells' compiler into one of the composer's modes, or why the band can't play it. */
export function readModeFragment(fragment: Fragment): ModeFragment | string {
  // (the bell and scale strikes the General MIDI kit's agogô, a hole its instrument fills: yggi/cells#260)
  const compiled = compileSource(`${BENCH}\n${withInstruments(fragment.text)}`);
  const errors = compiled.diagnostics.filter((d) => d.severity === 'error');
  if (errors.length) return `it doesn't compile: ${errors.map((d) => d.message).join('; ')}`;
  const key = compiled.mainKey === undefined ? undefined : compiled.cells.get(compiled.mainKey);
  if (!key?.scan) return 'it has no key, a scale(…)';
  if (!holesOf(fragment.text, compileSource).uses.includes('&tonic'))
    return 'its tonic is fixed, which the key plan sets: scale(…, &tonic) leaves it to the host';
  const { lap, steps } = key.scan;
  const found = STEPS.find((mode) => lap === 12 && mode.steps.join(' ') === steps.join(' '))?.mode;
  if (!found) return `its scale, ${steps.join(' ')}, is none of the composer's modes`;
  return { id: fragment.id, mode: found };
}

/** Cells' mode fragments, each read, and why each the band can't play is left out. */
export const MODE_READINGS: readonly {
  readonly id: string;
  readonly read: ModeFragment | string;
}[] = MODE_FRAGMENTS.map((fragment) => ({ id: fragment.id, read: readModeFragment(fragment) }));

/** A repository of the mode fragments the band can play, ranked by cells' query on the facet `mode`. */
export function modeRepository(fragments: readonly Fragment[] = MODE_FRAGMENTS): ModeRepository {
  const played = new Map<string, ModeFragment>();
  for (const fragment of fragments) {
    const read = readModeFragment(fragment);
    if (typeof read !== 'string') played.set(fragment.id, read);
  }
  const cells = createRepository(fragments.filter((f) => played.has(f.id)));
  return {
    fragments: played,
    query: (point) =>
      cells
        .query(point, played.size, {}, { facet: 'mode' })
        .map((found) => ({ id: found.fragment.id, distance: found.distance })),
  };
}

/** Cells' modes, as a preset finds its own. */
export const MODE_REPOSITORY: ModeRepository = modeRepository();

/** A preset's mode: the mode of the fragment found nearest its point; null where it misses (`MISS_DISTANCE`). */
export function presetMode(
  preset: Pick<Preset, 'style'>,
  repository: ModeRepository = MODE_REPOSITORY,
): ComposerMode | null {
  const nearest = repository.query(stylePoint(preset.style))[0];
  if (!nearest || nearest.distance > MISS_DISTANCE) return null;
  return repository.fragments.get(nearest.id)!.mode;
}
