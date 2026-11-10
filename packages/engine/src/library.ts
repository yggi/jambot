/**
 * Cells' seed library by facet (yggi/cells#638, v0.23.0): each list is the library's fragments whose points name the
 * facet, in the library's order, as cells' changelog migrates the per-facet lists it retired (`METER_FRAGMENTS` …).
 * A facet is read off a fragment's points, never off its folder (cells decision 046).
 */

import type { Fragment } from '@yggi/cells/repository/fragments';
import { LIBRARY } from '@yggi/cells/repository/library';

/** The seed fragments whose points name `facet`, in the library's order. */
export const facetFragments = (facet: string): readonly Fragment[] =>
  LIBRARY.filter((f) => f.association.some((p) => p.facet === facet));

export const METER_FRAGMENTS = facetFragments('meter');
/**
 * The rhythms the drummer reads: those of the facet `rhythm` but a mode placed as a rhythm too (the bell and scale, a
 * scale whose steps are its bell's timeline over a tonic the text gives), which no drum bar or clave is and the
 * drummer reads no hit of, as it never held it.
 */
export const RHYTHM_FRAGMENTS = facetFragments('rhythm').filter(
  (f) => !f.association.some((p) => p.facet === 'mode'),
);
export const BASS_FRAGMENTS = facetFragments('bass');
export const HARMONY_FRAGMENTS = facetFragments('harmony');
export const INSTRUMENT_FRAGMENTS = facetFragments('instrument');
export const MODE_FRAGMENTS = facetFragments('mode');
export const MOTIF_FRAGMENTS = facetFragments('motif');
export const FORM_FRAGMENTS = facetFragments('form');
