import {
  EMPTY_LAYER,
  type LearnedLayer,
  RETIRED_LEAD_VOICE,
  RHYTHM_REPOSITORY,
  leadRepository,
  repositoryLayerProblems,
} from '@jambot/engine';
import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import {
  LAYER_FORMAT,
  LAYER_VERSION,
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
      id: 'lofi_meter',
      point: { sync: 0.5, harm: 0.75, bite: 0.35 },
      weight: 1.2,
      facet: 'meter',
    },
    {
      id: 'odd_meter',
      point: { sync: 0.3, harm: 0.4, bite: 0.6 },
      weight: 1.1,
      facet: 'meter',
    },
  ],
  together: [{ ids: ['bar', 'odd_meter'], count: 3 }],
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

  it('reads a layer kept in an older form as it was kept: cells reads no retired form before its 1.0.0, and rewrites none (yggi/cells#643)', () => {
    // (kept at cells v0.15.0, its seed ids before they were words, #558)
    const ids: LearnedLayer = {
      filed: [],
      points: [
        { ...LEARNED.points[0]!, id: '4/4 leaning on 16n' },
        { ...LEARNED.points[1]!, id: '5/4' },
      ],
      together: [{ ids: ['4/4', '5/4'], count: 3 }],
    };
    // (kept before cells v0.23.0, its points on sync harm artic energy, decision 076)
    const axes = {
      ...LEARNED,
      points: LEARNED.points.map((p) => ({
        ...p,
        point: { sync: p.point.sync, harm: p.point.harm, artic: 0.5, energy: 0.5 },
      })),
    } as unknown as LearnedLayer;
    for (const before of [ids, axes]) {
      const read = readLayerText(layerText(before));
      expect(read.problem).toBeNull();
      expect(read.layer).toEqual(before);
    }
  });

  it('reads a layer kept before cells v0.30.0 with its meters named as cells names them now, which it would refuse as kept (#751)', () => {
    // (kept at cells v0.29.0: each meter a variant of the one template `meter`, and a groove variation's bench one)
    const before = {
      filed: [],
      points: [
        { ...LEARNED.points[0]!, id: 'meter(swing=16n:.65)' },
        { ...LEARNED.points[1]!, id: 'meter(grouping=meter("5/4"))' },
      ],
      together: [
        { ids: ['meter', 'meter(grouping=meter("5/4"))'], count: 2 },
        { ids: ['meter', 'meter(swing=16n:31/60)'], count: 4 },
        { ids: ['meter(swing=16n:31/60)', 'meter(grouping=meter("5/4"))'], count: 1 },
        { ids: ['meter(swing=16n:.6)', 'funk_drums'], count: 5 },
      ],
    };
    // (as kept, cells refuses it whole: a pair out of the order its ids now take)
    expect(repositoryLayerProblems(before)).not.toEqual([]);
    const read = readLayerText(layerText(before as unknown as LearnedLayer));
    expect(read.problem).toBeNull();
    expect(read.layer).toEqual({
      ...LEARNED,
      // (`meter` and Ambient's lean are both `bar` now: their pair is gone, and the two pairs with 5/4 are one)
      together: [
        { ids: ['bar', 'odd_meter'], count: 3 },
        { ids: ['funk_meter', 'funk_drums'], count: 5 },
      ],
    });
  });

  it('reads a layer kept before #580, its lead lines carrying the lead’s voice and card, with the lines alone', () => {
    const filed = leadRepository().file!(EMPTY_LAYER, {
      // (a line no seed motif plays: one that is a seed's is a use of it, not filed, #553)
      notes: [
        { step: 0, degree: 0, alter: 0 },
        { step: 4, degree: 3, alter: 0 },
        { step: 8, degree: 1, alter: 0 },
      ],
      bench: { meter: METERS['4/4'], meterFragment: 'bar' },
      point: { sync: 0.5, harm: 0.5, bite: 0.5, mood: 0.5 },
      source: 'Ada',
      created: 'song 1, bar 0',
      tags: ['lead line'],
    }).layer;
    const file = filed.filed[0]!;
    const text = [file.fragment.text, ...RETIRED_LEAD_VOICE].join('\n');
    const before: LearnedLayer = {
      ...filed,
      filed: [{ ...file, fragment: { ...file.fragment, text } }],
    };
    const read = readLayerText(layerText(before));
    expect(read.problem).toBeNull();
    expect(read.layer).toEqual(filed);
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
      JSON.stringify({ format: LAYER_FORMAT, version: 3, layer: EMPTY_LAYER }),
      'its version, 3, is not 1 or 2',
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
                id: 'bar',
                text: '&bar meter("4/4")',
                association: [{ point: { sync: 0.5 }, weight: 0.1 }],
              },
              meta: { source: 'composer', created: 'now' },
              prose: '',
            },
          ],
        },
      }),
      "the layer files bar, a seed fragment's id",
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

describe('a layer kept with its groove variations by reference (#553)', () => {
  const FOUR = { meter: METERS['4/4'], meterFragment: 'bar' };
  const v = RHYTHM_REPOSITORY.vary!('techno_drums', FOUR, 0.5)!;
  const VARIED = RHYTHM_REPOSITORY.file!(EMPTY_LAYER, {
    hits: v.hits,
    bench: FOUR,
    point: { sync: 0.5, harm: 0.5, bite: 0.5, mood: 0.5 },
    source: 'composer',
    created: 'song 1, bar 24',
    tags: ['groove'],
    varies: 'techno_drums',
    by: v.by,
  }).layer;

  it('keeps a variation’s text out of the record, and reads the record back to the same layer and the same text', () => {
    const text = layerText(VARIED);
    const record = JSON.parse(text) as { version: number; layer: LearnedLayer };
    expect(record.version).toBe(LAYER_VERSION);
    expect(record.layer.filed[0]!.fragment.text).toBe('');
    expect(text.length).toBeLessThan(JSON.stringify(VARIED).length);
    const read = readLayerText(text);
    expect(read).toEqual({ layer: VARIED, problem: null });
    expect(layerText(read.layer)).toBe(text);
  });

  it('loads a variation it can’t rebuild left out, with one warning that names it', async () => {
    const record = JSON.parse(layerText(VARIED)) as { layer: LearnedLayer };
    const file = record.layer.filed[0]!;
    record.layer = {
      ...record.layer,
      filed: [{ ...file, meta: { ...file.meta, by: 'drop &hat 99' } }],
    };
    const { store, warnings } = slot(JSON.stringify(record));
    expect((await store.load()).filed).toEqual([]);
    expect(warnings).toEqual([
      `1 groove the band varied could not be rebuilt from its source and is left out: ${file.fragment.id}.`,
    ]);
  });
});
