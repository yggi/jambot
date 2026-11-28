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
  it('plays 1,536 bars, every kind among them but Salsa’s coro and mambo, which no prototype preset plays', () => {
    expect(BARS).toHaveLength(1536);
    // (every kind before cells v0.30.0, whose `solo`, `coro` and `mambo` the jazz and the salsa song forms take)
    expect(
      Object.entries(kindCounts(BARS))
        .filter(([, n]) => n === 0)
        .map(([kind]) => kind),
    ).toEqual(['coro', 'mambo']);
  });

  // (192 intro, 448 groove, 256 bridge, 192 build, 256 drop and 192 breakdown before #655's song forms, from the six
  // kinds of the section chain; 552 groove before cells v0.30.0, whose jazz song form plays its solos as `solo`)
  it('plays 1,536 bars: 312 intro, 408 groove, 48 bridge, 48 build, 48 drop, 120 breakdown, 48 verse, 168 chorus, 192 outro, 144 solo', () => {
    expect(kindCounts(BARS)).toEqual({
      intro: 312,
      groove: 408,
      bridge: 48,
      build: 48,
      drop: 48,
      breakdown: 120,
      verse: 48,
      chorus: 168,
      outro: 192,
      solo: 144,
      coro: 0,
      mambo: 0,
    });
  });

  // (per component: the bars that read it, the share of its variance the kind explains (η²), the share it explains past
  // the bar's energy, and its correlation with the energy (r); before #655's song forms: density 0.558 0.037 0.909,
  // layers 0.532 0.132 0.651, velocity 0.678 0.164 0.804, register 0.293 0.126 0.469, filter 1,005 bars 0.396 0 1, sync
  // 0.307 0.066 0.602, bite 0.244 0.193 0.708; before the station's rotation, #547 rung 5: density 0.611 0.036 0.909,
  // velocity 0.681, register 0.376 0.187 0.347, sync 0.138 0.144 0.367; velocity 0.682 and 0.693 before the drummer
  // wrote the rim's metric accent, #749; before cells v0.30.0, whose jazz solos play hotter and without the pad: density
  // 0.036 0.91, layers 0.563 0.235 0.499, velocity 0.681 0.188 0.692, register 0.38 0.184 0.353, filter 0.426, sync 0.139
  // 0.144 0.366, bite 0.373 0.226 0.726; before the found parts, #540, #643, #644, #646: velocity 0.719 0.214 0.695, sync
  // 0.142 0.146 0.372)
  it('moves every component with the energy, and the kind moves layers, velocity, register and bite past it: more than one scalar', () => {
    expect(
      READ.map((c) => [c.component, c.n, fixed(c.eta2), fixed(c.eta2PastEnergy), fixed(c.r)]),
    ).toEqual([
      ['density', 1536, 0.612, 0.032, 0.907],
      ['layers', 1536, 0.583, 0.277, 0.482],
      ['velocity', 1536, 0.718, 0.214, 0.694],
      ['register', 1536, 0.386, 0.192, 0.349],
      ['filter', 912, 0.414, 0, 1],
      ['sync', 1536, 0.143, 0.147, 0.37],
      ['bite', 1536, 0.384, 0.247, 0.716],
    ]);
    // (the lead's filter is the energy's alone; the breakdown is where the kind says most: two parts in five rest, the
    // velocity falls 19 steps under the groove's, and the bite reads 0.04 where every other kind reads 0.31 to 0.69;
    // 2.344, 53.471, 0.042 and the groove's 4.067, 72.433, 0.363 before #655's song forms; 53.143 and the groove's 4.152,
    // 72.601, 0.326 before cells v0.30.0, whose groove no longer holds the jazz solos)
    const of = (c: string) => READ.find((r) => r.component === c)!.byKind;
    expect(
      [of('layers').breakdown, of('velocity').breakdown, of('bite').breakdown].map((x) =>
        fixed(x!),
      ),
    ).toEqual([2.425, 53.16, 0.041]);
    expect(
      [of('layers').groove, of('velocity').groove, of('bite').groove].map((x) => fixed(x!)),
      // (72.603 before the drummer wrote the rim's metric accent, #749; 74.016 before the found parts)
    ).toEqual([4.159, 73.995, 0.348]);
  });

  // (0.305 before #655's song forms, most into a breakdown, 0.638, and out of one into a groove, 0.462; bridge 0.107,
  // build 0.099, drop 0.136; into a build 0.456 and a drop 0.102 before the station's rotation, #547 rung 5; 0.282, into
  // a groove 0.227 and a chorus 0.257, before cells v0.30.0, whose jazz solos play hotter and without the pad; 0.28, into
  // a breakdown 0.685 and an intro 0.097, before the found parts, #540, #643, #644, #646)
  it('steps between adjacent sections by 0.28 on sync, bite and density, most into a breakdown (0.686) and then into a build (0.461)', () => {
    expect([ADJACENT.n, fixed(ADJACENT.mean)]).toEqual([168, 0.281]);
    expect(
      Object.fromEntries(Object.entries(ADJACENT.byKind).map(([k, v]) => [k, fixed(v!)])),
    ).toEqual({
      intro: 0.098,
      groove: 0.276,
      bridge: 0.142,
      build: 0.461,
      drop: 0.093,
      breakdown: 0.686,
      verse: 0.293,
      chorus: 0.247,
      outro: 0.361,
      solo: 0.083,
    });
  });
});
