import { INITIAL_STYLE, type Style, walkRadio } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { type Station, onward, readStation, tuneIn } from './station.ts';

/** The styles of `sections` sections on from `style`, with the station after each. */
function stations(from: Style, station: Station, sections: number) {
  const out = [{ station, style: from }];
  for (let i = 0; i < sections; i++) out.push(onward(out.at(-1)!.station, out.at(-1)!.style));
  return out;
}

describe('a radio station in a session (#313)', () => {
  it('is tuned in at no section yet, and walks the engine’s walk a section at a time', () => {
    const tuned = tuneIn(7);
    expect(tuned).toEqual({ seed: 7, walked: 0 });
    const next = onward(tuned, INITIAL_STYLE);
    expect(next.style).toEqual(walkRadio(INITIAL_STYLE, 7, 0));
    expect(next.station).toEqual({ seed: 7, walked: 1 });
  });

  it('carries nothing but its seed and how many sections it has walked, so a station resumed from them walks the same', () => {
    const run = stations(INITIAL_STYLE, tuneIn(3), 40);
    for (const at of [1, 17, 39]) {
      const resumed = stations(run[at]!.style, run[at]!.station, 40 - at);
      expect(resumed.at(-1)).toEqual(run.at(-1));
    }
  });

  it('walks another way from another seed', () => {
    const a = stations(INITIAL_STYLE, tuneIn(1), 12).at(-1)!;
    const b = stations(INITIAL_STYLE, tuneIn(2), 12).at(-1)!;
    expect(a.style).not.toEqual(b.style);
  });

  it('reads a station back as it was kept, and refuses what is not one', () => {
    const kept = stations(INITIAL_STYLE, tuneIn(9), 5).at(-1)!.station;
    expect(readStation(JSON.parse(JSON.stringify(kept)))).toEqual(kept);
    for (const bad of [
      null,
      7,
      {},
      { seed: 1 },
      { walked: 1 },
      { seed: 1.5, walked: 0 },
      { seed: 1, walked: -1 },
      { seed: 1, walked: 0.5 },
      { seed: '1', walked: 0 },
      { seed: Number.NaN, walked: 0 },
    ])
      expect(readStation(bad)).toBeNull();
  });
});
