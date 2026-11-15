import { describe, expect, it } from 'vitest';
import { adjacent, components, kindCounts, measured } from './section-intensity.ts';

// E46: yggi/cells#571 step 1 (#547 rung 5's groundwork). Measured, recorded; nothing it reads moves what plays.
const BARS = measured();
const READ = components(BARS);
const ADJACENT = adjacent(BARS);
const fixed = (x: number) => Number(x.toFixed(3));

if (process.env.E46_REPORT)
  console.log(
    JSON.stringify(
      { kinds: kindCounts(BARS), components: READ, adjacent: ADJACENT },
      (_, v) => (typeof v === 'number' ? fixed(v) : v),
      1,
    ),
  );

describe('what tells a section’s kind apart, over the 8 presets × 3 seeds × 64 bars at entropy 0.3, yggi/cells#571’s step 1 (E46, #645)', () => {
  it('plays 1,536 bars, every kind among them', () => {
    expect(BARS).toHaveLength(1536);
    expect(Object.values(kindCounts(BARS)).every((n) => n > 0)).toBe(true);
  });

  it('plays 1,536 bars: 192 intro, 448 groove, 256 bridge, 192 build, 256 drop, 192 breakdown', () => {
    expect(kindCounts(BARS)).toEqual({
      intro: 192,
      groove: 448,
      bridge: 256,
      build: 192,
      drop: 256,
      breakdown: 192,
    });
  });

  // (per component: the bars that read it, the share of its variance the kind explains (η²), the share it explains past
  // the bar's energy, and its correlation with the energy (r))
  it('moves every component with the energy, and the kind moves layers, velocity, register and bite past it: more than one scalar', () => {
    expect(
      READ.map((c) => [c.component, c.n, fixed(c.eta2), fixed(c.eta2PastEnergy), fixed(c.r)]),
    ).toEqual([
      ['density', 1536, 0.558, 0.037, 0.909],
      ['layers', 1536, 0.532, 0.132, 0.651],
      ['velocity', 1536, 0.678, 0.164, 0.804],
      ['register', 1536, 0.293, 0.126, 0.469],
      ['filter', 1005, 0.396, 0, 1],
      ['sync', 1536, 0.307, 0.066, 0.602],
      ['bite', 1536, 0.244, 0.193, 0.708],
    ]);
    // (the lead's filter is the energy's alone; the breakdown is where the kind says most: a third of the parts rest,
    // the velocity falls 19 steps under the groove's, and the bite reads 0.04 where every other kind reads 0.36)
    const of = (c: string) => READ.find((r) => r.component === c)!.byKind;
    expect(
      [of('layers').breakdown, of('velocity').breakdown, of('bite').breakdown].map((x) =>
        fixed(x!),
      ),
    ).toEqual([2.344, 53.471, 0.042]);
    expect(
      [of('layers').groove, of('velocity').groove, of('bite').groove].map((x) => fixed(x!)),
    ).toEqual([4.067, 72.433, 0.363]);
  });

  it('steps between adjacent sections by 0.305 on sync, bite and density, most into a breakdown (0.638) and out of one into a groove (0.462)', () => {
    expect([ADJACENT.n, fixed(ADJACENT.mean)]).toEqual([168, 0.305]);
    expect(
      Object.fromEntries(Object.entries(ADJACENT.byKind).map(([k, v]) => [k, fixed(v!)])),
    ).toEqual({
      groove: 0.462,
      bridge: 0.107,
      build: 0.099,
      drop: 0.136,
      breakdown: 0.638,
    });
  });
});
