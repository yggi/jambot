/**
 * Where a host keeps what its band learned (#398; yggi/cells decision 048):
 * the learned layer, plain data the host hands each query and cells keeps
 * none of. A client keeps none: the host's composer decides, and its
 * clients follow the plan.
 *
 * `LayerStore` is the interface, asynchronous so that a store across the
 * network (a shared repository, decentral ones) fits it later: `load` gives
 * the layer kept, `save` keeps one. Here are two: one in memory, for tests
 * and the lobby (`memoryLayerStore`), and one over a slot of text, such as
 * a key of the browser's `localStorage` (`textLayerStore`).
 *
 * A layer is kept and exported as one JSON text (`layerText`): a record
 * naming its format and version around the layer as a host keeps it
 * (`storedLayer`: its groove variations by reference, #553), which reads back
 * to the same layer (`rebuiltLayer`) and writes back to the same text, byte
 * for byte. A record of version 1, each text written out, reads as it did. A
 * reference that can't be rebuilt (its source moved at another cells pin) is
 * left out and named (`dropped`), never played otherwise than it was filed. A text that
 * isn't one (not JSON, another format, another version, a layer a query
 * would refuse, `repositoryLayerProblems`) reads as the empty layer with its
 * problem (`readLayerText`): a store warns once and the band starts from
 * nothing learned, never stopping on it. Pure: the app gives the slot.
 */

import {
  EMPTY_LAYER,
  type LearnedLayer,
  keptLayer,
  rebuiltLayer,
  repositoryLayerProblems,
  storedLayer,
} from '@jambot/engine';

/** Where a host keeps its learned layer: loaded once a page starts, saved as the band learns. */
export interface LayerStore {
  /** The layer kept; the empty layer where none is, or one can't be read. Never rejects. */
  load(): Promise<LearnedLayer>;
  /** Keep this layer in place of the one kept. */
  save(layer: LearnedLayer): Promise<void>;
}

/** What a kept or exported layer says it is. */
export const LAYER_FORMAT = 'jambot-learned-layer';

/** The version of the record a layer is kept in: a change of its shape is a new one. 2 keeps groove variations by reference. */
export const LAYER_VERSION = 2;

/** The versions of the record read: 1, each text written out, and 2. */
const READ_VERSIONS: readonly unknown[] = [1, LAYER_VERSION];

/** A layer as kept and exported: its record, as JSON text, the layer as a host keeps it (`storedLayer`). */
export const layerText = (layer: LearnedLayer): string =>
  JSON.stringify({ format: LAYER_FORMAT, version: LAYER_VERSION, layer: storedLayer(layer) });

/** A layer read from a text: the layer, or the empty one with what was wrong. */
export interface LayerRead {
  readonly layer: LearnedLayer;
  /** What was wrong with the text, a sentence; null where it read, or where there was none. */
  readonly problem: string | null;
  /** The ids of the groove variations kept by reference that could not be rebuilt, and are left out. */
  readonly dropped?: readonly string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A layer from its record's text (`layerText`); none, null, is the empty layer with no problem. */
export function readLayerText(text: string | null): LayerRead {
  if (text === null) return { layer: EMPTY_LAYER, problem: null };
  const wrong = (problem: string): LayerRead => ({ layer: EMPTY_LAYER, problem });
  let record: unknown;
  try {
    record = JSON.parse(text);
  } catch {
    return wrong('it is not JSON');
  }
  if (!isRecord(record) || record.format !== LAYER_FORMAT)
    return wrong(`it is not a ${LAYER_FORMAT}`);
  if (!READ_VERSIONS.includes(record.version))
    return wrong(`its version, ${String(record.version)}, is not ${READ_VERSIONS.join(' or ')}`);
  // (a reference's text given back before the layer is checked, which asks every fragment for its text)
  const filed = isRecord(record.layer) && Array.isArray(record.layer.filed);
  const rebuilt =
    record.version === LAYER_VERSION && filed
      ? rebuiltLayer(record.layer as LearnedLayer)
      : { layer: record.layer, dropped: [] };
  const problems = repositoryLayerProblems(rebuilt.layer);
  if (problems.length) return wrong(problems.join('; '));
  // (a layer kept before cells v0.16.0 names the seed's old ids, #558, and one kept before #580 carries the lead's voice)
  return {
    layer: keptLayer(rebuilt.layer as LearnedLayer),
    problem: null,
    ...(rebuilt.dropped.length ? { dropped: rebuilt.dropped } : {}),
  };
}

/** A store that keeps the layer in memory: for tests, and a host with nowhere to keep it. */
export function memoryLayerStore(layer: LearnedLayer = EMPTY_LAYER): LayerStore {
  let kept = layer;
  return {
    load: async () => kept,
    save: async (given) => {
      kept = given;
    },
  };
}

/** A slot one text is kept in, such as a key of the browser's storage: none where nothing is kept yet. */
export interface TextSlot {
  read(): string | null;
  write(text: string): void;
}

/**
 * A store over a slot of text, each layer kept as its record (`layerText`).
 * A text kept that doesn't read loads as the empty layer, with one warning
 * saying why; the next save writes over it.
 */
export function textLayerStore(slot: TextSlot, warn: (message: string) => void): LayerStore {
  return {
    async load() {
      const { layer, problem, dropped } = readLayerText(slot.read());
      if (problem !== null)
        warn(
          `The learned layer kept can't be read (${problem}): the band starts from nothing learned.`,
        );
      if (dropped?.length)
        warn(
          `${dropped.length} groove${dropped.length === 1 ? '' : 's'} the band varied could not be rebuilt from ${dropped.length === 1 ? 'its source' : 'their sources'} and ${dropped.length === 1 ? 'is' : 'are'} left out: ${dropped.join(', ')}.`,
        );
      return layer;
    },
    async save(layer) {
      slot.write(layerText(layer));
    },
  };
}
