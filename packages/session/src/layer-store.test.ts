import { EMPTY_LAYER, type LearnedLayer } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import {
  LAYER_FORMAT,
  type TextSlot,
  layerText,
  memoryLayerStore,
  readLayerText,
  textLayerStore,
} from './layer-store.ts';

/** A layer as the band learns one: a seed meter's point raised, and a pair counted. */
const LEARNED: LearnedLayer = {
  filed: [],
  points: [
    {
      id: 'meter_4_4_leaning_on_16n',
      point: { sync: 0.5, harm: 0.75, artic: 0.35, energy: 0.5 },
      weight: 1.2,
      facet: 'meter',
    },
    {
      id: 'meter_5_4',
      point: { sync: 0.3, harm: 0.4, artic: 0.6, energy: 0.45 },
      weight: 1.1,
      facet: 'meter',
    },
  ],
  together: [{ ids: ['meter_4_4', 'meter_5_4'], count: 3 }],
};

/** A slot in memory, with every warning a store gave. */
function slot(text: string | null = null) {
  const kept = { text };
  const warnings: string[] = [];
  const s: TextSlot = {
    read: () => kept.text,
    write: (t) => {
      kept.text = t;
    },
  };
  return { kept, warnings, store: textLayerStore(s, (m) => warnings.push(m)) };
}

describe('the learned layer a host keeps (#398)', () => {
  it('keeps a layer across a reload byte for byte', async () => {
    const first = slot();
    await first.store.save(LEARNED);
    const written = first.kept.text!;
    // A reload: a new store over the same slot.
    const again = slot(written);
    const loaded = await again.store.load();
    expect(loaded).toEqual(LEARNED);
    await again.store.save(loaded);
    expect(again.kept.text).toBe(written);
    expect(again.warnings).toEqual([]);
  });

  it('reads a layer kept at cells v0.15.0, which names the seed ids before they were words, as the same layer in words (#558)', () => {
    const before: LearnedLayer = {
      filed: [],
      points: [
        { ...LEARNED.points[0]!, id: '4/4 leaning on 16n' },
        { ...LEARNED.points[1]!, id: '5/4' },
      ],
      together: [{ ids: ['4/4', '5/4'], count: 3 }],
    };
    const read = readLayerText(layerText(before));
    expect(read.problem).toBeNull();
    // (the same points and pairs, none left out as unheld)
    expect(read.layer).toEqual(LEARNED);
  });

  it('loads nothing kept as the empty layer, without a warning', async () => {
    const { store, warnings } = slot();
    expect(await store.load()).toBe(EMPTY_LAYER);
    expect(warnings).toEqual([]);
  });

  it.each([
    ['not JSON', '{"format":', 'it is not JSON'],
    [
      'another format',
      JSON.stringify({ format: 'x', version: 1, layer: EMPTY_LAYER }),
      `it is not a ${LAYER_FORMAT}`,
    ],
    [
      'an unknown version',
      JSON.stringify({ format: LAYER_FORMAT, version: 2, layer: EMPTY_LAYER }),
      'its version, 2, is not 1',
    ],
    [
      'a malformed layer',
      JSON.stringify({
        format: LAYER_FORMAT,
        version: 1,
        layer: { filed: [], points: [{}], together: [] },
      }),
      'learned point 1: no id',
    ],
    [
      'a layer that files a seed meter',
      JSON.stringify({
        format: LAYER_FORMAT,
        version: 1,
        layer: {
          ...EMPTY_LAYER,
          filed: [
            {
              fragment: {
                id: 'meter_4_4',
                text: '&bar meter("4/4")',
                association: [{ point: { sync: 0.5 }, weight: 0.1 }],
              },
              meta: { source: 'composer', created: 'now' },
              prose: '',
            },
          ],
        },
      }),
      "the layer files meter_4_4, a seed fragment's id",
    ],
  ])('loads %s as the empty layer, with one warning that says why', async (_, text, why) => {
    const { store, warnings } = slot(text);
    expect(await store.load()).toBe(EMPTY_LAYER);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain(why);
  });

  it('reads an export as it was written, and says what is wrong with one that isn’t', () => {
    expect(readLayerText(layerText(LEARNED))).toEqual({ layer: LEARNED, problem: null });
    expect(readLayerText('[]').problem).toBe(`it is not a ${LAYER_FORMAT}`);
    expect(readLayerText(null)).toEqual({ layer: EMPTY_LAYER, problem: null });
  });

  it('keeps a layer in memory, for tests and the lobby', async () => {
    const store = memoryLayerStore();
    expect(await store.load()).toBe(EMPTY_LAYER);
    await store.save(LEARNED);
    expect(await store.load()).toBe(LEARNED);
  });
});
