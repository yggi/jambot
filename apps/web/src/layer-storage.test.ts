import { EMPTY_LAYER } from '@jambot/engine';
import { layerText } from '@jambot/session';
import { describe, expect, it, vi } from 'vitest';
import { LAYER_KEY, browserLayerStore, storageSlot } from './layer-storage.ts';

/** A storage in memory, as the browser's `localStorage` reads and writes. */
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  };
}

const LEARNED = {
  filed: [],
  points: [
    {
      id: '5/4',
      point: { sync: 0.3, harm: 0.4, artic: 0.6, energy: 0.45 },
      weight: 1.1,
      facet: 'meter',
    },
  ],
  together: [],
};

describe("the learned layer in this browser's storage (#398)", () => {
  it(`keeps it under ${LAYER_KEY}, and a reload reads it back byte for byte`, async () => {
    const storage = memoryStorage();
    await browserLayerStore(() => storage).save(LEARNED);
    const written = storage.getItem(LAYER_KEY);
    expect(written).toBe(layerText(LEARNED));
    const again = browserLayerStore(() => storage);
    await again.save(await again.load());
    expect(storage.getItem(LAYER_KEY)).toBe(written);
  });

  it('loads a corrupt entry as the empty layer, with one warning in the console', async () => {
    const storage = memoryStorage();
    storage.setItem(LAYER_KEY, 'not json');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await browserLayerStore(() => storage).load()).toBe(EMPTY_LAYER);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('plays on where storage is missing or refuses', async () => {
    const refusing = () => {
      throw new Error('denied');
    };
    const slot = storageSlot(refusing, LAYER_KEY);
    expect(slot.read()).toBeNull();
    expect(() => slot.write('x')).not.toThrow();
    expect(await browserLayerStore(refusing).load()).toBe(EMPTY_LAYER);
  });
});
