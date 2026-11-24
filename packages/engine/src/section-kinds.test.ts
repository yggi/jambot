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
const CHAIN = SECTION_TYPES.filter((t): t is keyof typeof ENERGY_OFFSET => t in ENERGY_OFFSET);
const before = (type: keyof typeof ENERGY_OFFSET, bar: number) =>
  type === 'build' ? -0.15 + (0.45 * bar) / (SECTION_BARS - 1) : ENERGY_OFFSET[type];

describe('the section kinds, from cells’ section fragments (#655)', () => {
  it('read each kind’s offset as Jambot had it, bit for bit, a build ramping by the bar', () => {
    for (const type of CHAIN)
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

  it('read who plays: everyone, but the lead in an intro, a breakdown and a mambo, the stab in a breakdown, and the pad in a solo and a mambo', () => {
    expect(Object.fromEntries(SECTION_TYPES.map((t) => [t, sectionKind(t).plays]))).toEqual({
      intro: ['drums', 'bass', 'pad', 'stab'],
      groove: [...BAND_ORDER],
      bridge: [...BAND_ORDER],
      build: [...BAND_ORDER],
      drop: [...BAND_ORDER],
      breakdown: ['drums', 'bass', 'pad'],
      // (a song form's own: yggi/cells#814's, cells' numbers)
      verse: ['drums', 'bass', 'pad', 'lead'],
      chorus: [...BAND_ORDER],
      outro: ['drums', 'bass', 'pad', 'stab'],
      // (cells v0.30.0's: a jazz chorus of solos, the pad out, and salsa's montuno and horns' sections)
      solo: ['drums', 'bass', 'stab', 'lead'],
      coro: [...BAND_ORDER],
      mambo: ['drums', 'bass', 'stab'],
    });
    expect([
      kindOffset('verse', 3),
      kindOffset('chorus', 3),
      kindOffset('outro', 0),
      kindOffset('outro', 7),
    ]).toEqual([-0.1, 0.15, 0, -0.45]);
    // (the lead rests where its kind leaves it out, as it did, and below 0.4 whatever its kind)
    for (const t of SECTION_TYPES)
      for (const e of [0.39, 0.4, 0.9])
        expect(leadRests({ type: t }, e), `${t} ${e}`).toBe(
          e < 0.4 || t === 'intro' || t === 'breakdown' || t === 'outro' || t === 'mambo',
        );
    // (in a song form's section the kind alone says it: a verse sings at any energy, #655)
    const song = { form: 'strophic', at: 1, of: 6 };
    expect([
      leadRests({ type: 'verse', song }, 0.1),
      leadRests({ type: 'outro', song }, 0.9),
    ]).toEqual([false, true]);
    expect(kindPlays('breakdown', 'stab')).toBe(false);
    expect(kindPlays('intro', 'stab')).toBe(true);
    expect([kindPlays('solo', 'pad'), kindPlays('mambo', 'pad'), kindPlays('coro', 'pad')]).toEqual(
      [false, false, true],
    );
  });
});
