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
 * Past `LAYER_CAP` bytes of JSON as a host keeps it (`storedLayer`, its groove variations by reference), the oldest
 * of what it learned goes first
 * (`cappedLayer`): its points, then its counts of use together, then its
 * filed fragments, each list oldest first, as each grows at its end.
 */

import { fragmentHash } from '@yggi/cells/engine/use';
import type { FragmentFile } from '@yggi/cells/repository/files';
import { writeFragment } from '@yggi/cells/repository/files';
import type { LearnedLayer, Repository } from '@yggi/cells/repository/fragments';
import { RHYTHM_FRAGMENTS } from './library.ts';

export { EMPTY_LAYER, type LearnedLayer } from '@yggi/cells/repository/fragments';

/**
 * The most a layer may weigh, in bytes of its JSON (UTF-8): 16,000, so the
 * host's record of it, the layer and some 50 bytes around it, stays under
 * #398's bound of 16 KiB. A layer that learned only meters stays far under
 * it: after 3 hours of the radio's walk it weighs at most about 1.6 KB (E34,
 * learning), since use raises a point where one is, and the meters have one
 * each; with the rhythms, and the grooves the Muse files on a miss
 * (#401) and the composer's variations of them and of the seed rhythms
 * (#411, #414), at most 11,550 bytes, eleven grooves at most (E38, E39);
 * with the bass lines too, at most 15,035 (E41). With the lead lines and a
 * player answering one section in four (E42), it reaches the cap, which drops
 * its oldest in 29 sections of 5,385 over 3 hours (#580).
 */
export const LAYER_CAP = 16_000;

/**
 * The UTF-8 length of a text, in bytes: a byte for each code unit below 0x80, two below 0x800, four for a surrogate
 * pair (a code point past 0xFFFF), three for any other. Counted over code units, as a layer is weighed each time a
 * repository is used (#471).
 */
function utf8Bytes(text: string): number {
  let bytes = text.length;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) continue;
    if (code < 0x800) bytes += 1;
    else if (code >= 0xd800 && code < 0xdc00 && (text.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
      bytes += 2;
      i++;
    } else bytes += 2;
  }
  return bytes;
}

/** The meta key a groove variation keeps the meter it was made on in, by its name (`4/4`), so its text can be rebuilt. */
export const BENCH = 'bench';
/** The meta key a groove variation keeps the meter fragment of its bench in, where it came from one. */
export const BENCH_FRAGMENT = 'benchFragment';
/** The meta key a stored groove variation keeps its text's hash in (cells' `fragmentHash`), to check its rebuild by. */
export const HASH = 'hash';

/** Each text's hash, kept: a layer is weighed each time it is used, its few dozen grooves each time. */
const HASHES = new Map<string, string>();
const hashOf = (text: string) => {
  let hash = HASHES.get(text);
  if (hash === undefined) HASHES.set(text, (hash = fragmentHash(text)));
  return hash;
};

/**
 * A layer as a host keeps it (#553): each groove variation the composer filed whose source the layer still holds, a
 * seed rhythm or a groove filed before it, by reference: its text left out (`''`) and its hash kept (`HASH`), since its
 * source, the variation's name (`by`) and its bench (`BENCH`, `BENCH_FRAGMENT`) give it back (`rebuiltLayer`). A
 * groove's text is most of its entry, some 445 of 743 bytes over E42's three hours; a line's is a sixth of its, so
 * the lines keep theirs. A variation whose source is gone keeps its text, so no reference dangles. The band holds
 * its layer whole; this is what is weighed (`layerBytes`) and stored.
 */
export function storedLayer(layer: LearnedLayer): LearnedLayer {
  const held = new Set(RHYTHM_FRAGMENTS.map((f) => f.id));
  let referred = false;
  const filed = layer.filed.map((file) => {
    const { meta } = file;
    const source = meta['varies'];
    held.add(file.fragment.id);
    if (
      typeof meta[BENCH] !== 'string' ||
      typeof meta['by'] !== 'string' ||
      typeof source !== 'string' ||
      source === file.fragment.id ||
      !held.has(source) ||
      file.fragment.text === ''
    )
      return file;
    referred = true;
    return {
      ...file,
      fragment: { ...file.fragment, text: '' },
      meta: { ...meta, [HASH]: hashOf(file.fragment.text) },
    };
  });
  return referred ? { ...layer, filed } : layer;
}

/** What a layer weighs: the bytes of its JSON as a host keeps it (`storedLayer`). */
export const layerBytes = (layer: LearnedLayer): number =>
  utf8Bytes(JSON.stringify(storedLayer(layer)));

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

/**
 * Those of `ids` a repository with a layer still holds: its seeds, and the
 * fragments the layer files. A fragment the layer's cap dropped meanwhile
 * (`cappedLayer`), which a section may still have been playing, is gone, so
 * its use is learned no more.
 */
export function stillHeld(
  repository: Repository,
  layer: LearnedLayer,
  ids: readonly string[],
): string[] {
  const held = (id: string) =>
    repository.fragments.some((f) => f.id === id) || layer.filed.some((f) => f.fragment.id === id);
  return ids.filter(held);
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
