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

  // (192 intro, 448 groove, 256 bridge, 192 build, 256 drop and 192 breakdown before #655's song forms, from the six
  // kinds of the section chain)
  it('plays 1,536 bars: 312 intro, 552 groove, 48 bridge, 48 build, 48 drop, 120 breakdown, 48 verse, 168 chorus, 192 outro', () => {
    expect(kindCounts(BARS)).toEqual({
      intro: 312,
      groove: 552,
      bridge: 48,
      build: 48,
      drop: 48,
      breakdown: 120,
      verse: 48,
      chorus: 168,
      outro: 192,
    });
  });

  // (per component: the bars that read it, the share of its variance the kind explains (η²), the share it explains past
  // the bar's energy, and its correlation with the energy (r); before #655's song forms: density 0.558 0.037 0.909,
  // layers 0.532 0.132 0.651, velocity 0.678 0.164 0.804, register 0.293 0.126 0.469, filter 1,005 bars 0.396 0 1, sync
  // 0.307 0.066 0.602, bite 0.244 0.193 0.708; before the station's rotation, #547 rung 5: density 0.611 0.036 0.909,
  // velocity 0.681, register 0.376 0.187 0.347, sync 0.138 0.144 0.367)
  it('moves every component with the energy, and the kind moves layers, velocity, register and bite past it: more than one scalar', () => {
    expect(
      READ.map((c) => [c.component, c.n, fixed(c.eta2), fixed(c.eta2PastEnergy), fixed(c.r)]),
    ).toEqual([
      ['density', 1536, 0.612, 0.036, 0.91],
      ['layers', 1536, 0.563, 0.235, 0.499],
      ['velocity', 1536, 0.682, 0.188, 0.693],
      ['register', 1536, 0.38, 0.184, 0.353],
      ['filter', 912, 0.426, 0, 1],
      ['sync', 1536, 0.139, 0.144, 0.366],
      ['bite', 1536, 0.373, 0.226, 0.726],
    ]);
    // (the lead's filter is the energy's alone; the breakdown is where the kind says most: two parts in five rest, the
    // velocity falls 19 steps under the groove's, and the bite reads 0.04 where every other kind reads 0.31 to 0.69;
    // 2.344, 53.471, 0.042 and the groove's 4.067, 72.433, 0.363 before #655's song forms)
    const of = (c: string) => READ.find((r) => r.component === c)!.byKind;
    expect(
      [of('layers').breakdown, of('velocity').breakdown, of('bite').breakdown].map((x) =>
        fixed(x!),
      ),
    ).toEqual([2.425, 53.143, 0.041]);
    expect(
      [of('layers').groove, of('velocity').groove, of('bite').groove].map((x) => fixed(x!)),
    ).toEqual([4.152, 72.603, 0.326]);
  });

  // (0.305 before #655's song forms, most into a breakdown, 0.638, and out of one into a groove, 0.462; bridge 0.107,
  // build 0.099, drop 0.136; into a build 0.456 and a drop 0.102 before the station's rotation, #547 rung 5)
  it('steps between adjacent sections by 0.282 on sync, bite and density, most into a breakdown (0.685) and then into a build (0.461)', () => {
    expect([ADJACENT.n, fixed(ADJACENT.mean)]).toEqual([168, 0.282]);
    expect(
      Object.fromEntries(Object.entries(ADJACENT.byKind).map(([k, v]) => [k, fixed(v!)])),
    ).toEqual({
      intro: 0.097,
      groove: 0.227,
      bridge: 0.142,
      build: 0.461,
      drop: 0.093,
      breakdown: 0.685,
      verse: 0.293,
      chorus: 0.257,
      outro: 0.361,
    });
  });
});
