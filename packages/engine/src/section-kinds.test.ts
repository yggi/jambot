import { describe, expect, it } from 'vitest';
import { SECTION_BARS, SECTION_TYPES, barEnergy } from './form.ts';
import { BAND_ORDER, kindOffset, kindPlays, sectionKind } from './section-kinds.ts';
import { leadRests } from './lead.ts';

// (Jambot's own, before #655 read them from cells: form.ts's ENERGY_OFFSET and its build ramp, the lead resting in an
// intro and a breakdown, lead.ts, and a breakdown's comp padding only, comp.ts)
const ENERGY_OFFSET = {
  intro: -0.3,
  groove: 0,
  bridge: -0.1,
  build: 0,
  drop: 0.3,
  breakdown: -0.45,
} as const;
const before = (type: (typeof SECTION_TYPES)[number], bar: number) =>
  type === 'build' ? -0.15 + (0.45 * bar) / (SECTION_BARS - 1) : ENERGY_OFFSET[type];

describe('the section kinds, from cells’ section fragments (#655)', () => {
  it('read each kind’s offset as Jambot had it, bit for bit, a build ramping by the bar', () => {
    for (const type of SECTION_TYPES)
      for (let bar = 0; bar < SECTION_BARS; bar++) {
        expect(kindOffset(type, bar), `${type} ${bar}`).toBe(before(type, bar));
        for (const energy of [0, 0.2, 0.55, 0.8, 1])
          expect(barEnergy(energy, type, bar)).toBe(
            Math.max(0, Math.min(1, energy + before(type, bar))),
          );
      }
    expect(sectionKind('build').ramp).toEqual({ weight: 0.45, bars: 8 });
    expect(sectionKind('drop').ramp).toBeNull();
  });

  it('read who plays: everyone, but the lead in an intro and a breakdown, and the stab in a breakdown', () => {
    expect(Object.fromEntries(SECTION_TYPES.map((t) => [t, sectionKind(t).plays]))).toEqual({
      intro: ['drums', 'bass', 'pad', 'stab'],
      groove: [...BAND_ORDER],
      bridge: [...BAND_ORDER],
      build: [...BAND_ORDER],
      drop: [...BAND_ORDER],
      breakdown: ['drums', 'bass', 'pad'],
    });
    // (the lead rests where its kind leaves it out, as it did, and below 0.4 whatever its kind)
    for (const t of SECTION_TYPES)
      for (const e of [0.39, 0.4, 0.9])
        expect(leadRests(t, e), `${t} ${e}`).toBe(e < 0.4 || t === 'intro' || t === 'breakdown');
    expect(kindPlays('breakdown', 'stab')).toBe(false);
    expect(kindPlays('intro', 'stab')).toBe(true);
  });
});
