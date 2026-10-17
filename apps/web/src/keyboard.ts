/**
 * The on-screen keyboard's range, and the keys of a scale alone: Jambot's
 * own, beside webmidi's `keyboardLayout`, `KeyLayout` and `isBlackKey`
 * (`@yggi/webmidi/core`), which lay out every key of a range.
 */

import type { KeyLayout } from '@yggi/webmidi/core';

export const KEYBOARD_LOW = 60;
export const KEYBOARD_HIGH = 76;

/**
 * The keys of a scale alone, `low` to `high`, each as wide as the next: the
 * keyboard locked to the scale, where no note struck is out of it and each
 * key is wider to hit. `scale` is pitch classes, C = 0.
 */
export function scaleLayout(
  low: number,
  high: number,
  scale: readonly number[],
): readonly KeyLayout[] {
  const notes: number[] = [];
  for (let note = low; note <= high; note++)
    if (scale.includes(((note % 12) + 12) % 12)) notes.push(note);
  const width = 100 / notes.length;
  return notes.map((note, i) => ({ note, black: false, left: i * width, width }));
}
