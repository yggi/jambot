/**
 * The waterfall's numbers: the last few seconds of the spectrum, a row for
 * each look, and the colour a level is painted in. The canvas that shows it
 * (`Waterfall.svelte`) only puts the pixels on the page.
 */

export interface ShadeRange {
  /** The level painted as the darkest, in dB: −90 by default, the bands' floor. */
  floorDb?: number;
  /** The level painted as the brightest: 0, full scale. */
  topDb?: number;
}

/** The ramp, dark to bright: near-black blue, indigo, teal, amber, pale. One ramp, light in theme and dark alike, as a spectrogram is. */
const STOPS: readonly (readonly [number, number, number])[] = [
  [10, 14, 30],
  [42, 38, 110],
  [24, 130, 130],
  [242, 177, 52],
  [255, 244, 214],
];

/** The colour a level is painted in, red green blue from 0 to 255. */
export function shade(
  db: number,
  { floorDb = -90, topDb = 0 }: ShadeRange = {},
): [number, number, number] {
  const level = Number.isNaN(db) ? 0 : Math.min(1, Math.max(0, (db - floorDb) / (topDb - floorDb)));
  const at = level * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(at));
  const t = at - i;
  const [a, b] = [STOPS[i]!, STOPS[i + 1]!];
  return [0, 1, 2].map((c) => Math.round(a[c]! + t * (b[c]! - a[c]!))) as [number, number, number];
}

/** The newest `size` spectra, newest first. */
export class Waterfall {
  readonly size: number;
  /** The rows kept, the newest first; each a copy of the bands it was given. */
  rows: Float64Array[] = [];

  constructor(size: number) {
    this.size = size;
  }

  push(bands: Float64Array): void {
    this.rows = [bands.slice(), ...this.rows].slice(0, this.size);
  }

  clear(): void {
    this.rows = [];
  }

  /** The rows as RGBA pixels, `width` a line: a line for each row of the `size`, the newest at the top, and a line not yet seen at the floor. */
  pixels(width: number, range: ShadeRange = {}): Uint8ClampedArray<ArrayBuffer> {
    const out = new Uint8ClampedArray(width * this.size * 4);
    const empty = shade(-Infinity, range);
    for (let y = 0; y < this.size; y++) {
      const row = this.rows[y];
      for (let x = 0; x < width; x++) {
        const [r, g, b] = row ? shade(row[x]!, range) : empty;
        out.set([r, g, b, 255], (y * width + x) * 4);
      }
    }
    return out;
  }
}
