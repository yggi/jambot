/**
 * Where this browser keeps what its band learned (#398): the learned layer
 * in `localStorage`, under one versioned key, as its record's text
 * (`textLayerStore`, `layerText`). It is the host's, and a band playing
 * alone is a host nobody joined; a client keeps none. It has no age, unlike
 * a session's record: what a jam learned outlives the jam.
 *
 * Storage can be missing or refuse (a private window, a full quota): then
 * the band learns for as long as the page is open, and nothing else is
 * lost.
 */

import { type LayerStore, type TextSlot, textLayerStore } from '@jambot/session';

/** The key the layer is kept under: its record's version is in it, so a later shape takes a key of its own. */
export const LAYER_KEY = 'jambot:learned-layer:v1';

/** A key of a storage as a slot of text, which neither a missing storage nor a refusal stops. */
export function storageSlot(storage: () => Storage, key: string): TextSlot {
  return {
    read() {
      try {
        return storage().getItem(key);
      } catch {
        return null;
      }
    },
    write(text) {
      try {
        storage().setItem(key, text);
      } catch {
        // The band plays on; what it learned just won't come back from a reload.
      }
    },
  };
}

/** The browser's store of the learned layer, a warning in the console for a layer kept that can't be read. */
export const browserLayerStore = (storage: () => Storage = () => localStorage): LayerStore =>
  textLayerStore(storageSlot(storage, LAYER_KEY), (message) => console.warn(message));
