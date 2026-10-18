/**
 * The learned layer as the band carries it (#398; yggi/cells decision 048):
 * what a jam learned, plain data the host keeps and hands to each query of
 * the repository, which keeps none.
 *
 * The band starts a song from a layer (`BandEnv.layer`, the host's, loaded
 * from where it keeps it) and carries it in its plans: at each section where
 * the composer keeps a meter it found in the repository, the layer learns
 * that use at the section's point (`MeterRepository.used`), and the next
 * section asks with the layer learned. So the band's events are made again
 * from the seed, the style and the layer it started from, and a forecast
 * learns as the band will.
 *
 * Past `LAYER_CAP` bytes of JSON, the oldest of what it learned goes first
 * (`cappedLayer`): its points, then its counts of use together, then its
 * filed fragments, each list oldest first, as each grows at its end.
 */

import type { FragmentFile } from '@yggi/cells/repository/files';
import { writeFragment } from '@yggi/cells/repository/files';
import type { LearnedLayer } from '@yggi/cells/repository/fragments';

export { EMPTY_LAYER, type LearnedLayer } from '@yggi/cells/repository/fragments';

/**
 * The most a layer may weigh, in bytes of its JSON (UTF-8): 16,000, so the
 * host's record of it, the layer and some 50 bytes around it, stays under
 * #398's bound of 16 KiB. A layer that learned only meters stays far under
 * it: after 3 hours of the radio's walk it weighs at most about 1.6 KB (E34,
 * learning), since use raises a point where one is, and the eleven meters
 * have one each; with the rhythms, and the grooves the Muse files on a miss
 * (#401) and the composer's variations of them (#411), at most 8,464 bytes,
 * eight grooves at most (E38, E39).
 */
export const LAYER_CAP = 16_000;

/** The UTF-8 length of a text, in bytes. */
function utf8Bytes(text: string): number {
  let bytes = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

/** What a layer weighs: the bytes of its JSON, as a host keeps it. */
export const layerBytes = (layer: LearnedLayer): number => utf8Bytes(JSON.stringify(layer));

/**
 * The layer within `cap` bytes: the same layer where it is, else with the
 * oldest of its points dropped first, then of its pairs, then of its filed
 * fragments, until it is.
 */
export function cappedLayer(layer: LearnedLayer, cap: number = LAYER_CAP): LearnedLayer {
  if (layerBytes(layer) <= cap) return layer;
  let { filed, points, together } = layer;
  const weight = () => layerBytes({ filed, points, together });
  while (points.length > 0 && weight() > cap) points = points.slice(1);
  while (together.length > 0 && weight() > cap) together = together.slice(1);
  while (filed.length > 0 && weight() > cap) filed = filed.slice(1);
  return { filed, points, together };
}

/** A file a person can save: its name and its text. */
export interface SavedFile {
  readonly name: string;
  readonly text: string;
}

/** A name for a file from a fragment's id: its letters and digits, the rest as dashes. */
const fileName = (id: string): string =>
  `${id.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'fragment'}.md`;

/**
 * The layer's filed fragments as fragment files (cells' `writeFragment`,
 * decision 047), each named by its id (a second of one name numbered): what a jam made, to carry to another
 * machine or offer to the seed library by a pull request.
 */
export function filedFiles(layer: LearnedLayer): SavedFile[] {
  const taken = new Set<string>();
  return layer.filed.map((file: FragmentFile) => {
    const base = fileName(file.fragment.id);
    let name = base;
    for (let n = 2; taken.has(name); n++) name = base.replace(/\.md$/, `-${n}.md`);
    taken.add(name);
    return { name, text: writeFragment(file) };
  });
}
