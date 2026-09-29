// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EVEN_MIX, type Mix, sounds, toggled } from './mix.ts';
import { PERFORMERS, type Performer } from './sounding.ts';

/** Every subset of the performers. */
const subsets: Performer[][] = Array.from({ length: 1 << PERFORMERS.length }, (_, bits) =>
  PERFORMERS.filter((_, i) => bits & (1 << i)),
);
const everyMix: Mix[] = subsets.flatMap((muted) => subsets.map((soloed) => ({ muted, soloed })));

describe('the local mix', () => {
  it('sounds every performer while nothing is muted or soloed', () => {
    for (const performer of PERFORMERS) expect(sounds(EVEN_MIX, performer)).toBe(true);
  });

  it('sounds only the soloed where any is soloed, and otherwise all but the muted, in every mix', () => {
    for (const mix of everyMix)
      for (const performer of PERFORMERS)
        expect(sounds(mix, performer), JSON.stringify({ mix, performer })).toBe(
          mix.soloed.length > 0 ? mix.soloed.includes(performer) : !mix.muted.includes(performer),
        );
  });

  it('toggles one performer’s mute or solo and leaves the rest, in every mix', () => {
    for (const mix of everyMix)
      for (const performer of PERFORMERS)
        for (const which of ['muted', 'soloed'] as const) {
          const after = toggled(mix, which, performer);
          const other = which === 'muted' ? 'soloed' : 'muted';
          expect(after[which].includes(performer)).toBe(!mix[which].includes(performer));
          expect(after[which].filter((p) => p !== performer)).toEqual(
            mix[which].filter((p) => p !== performer),
          );
          expect(after[other]).toEqual(mix[other]);
          expect(toggled(after, which, performer)[which].toSorted()).toEqual(mix[which].toSorted());
        }
  });

  it('keeps each list in the performers’ own order', () => {
    const mix = toggled(toggled(EVEN_MIX, 'muted', 'lead'), 'muted', 'drums');
    expect(mix.muted).toEqual(['drums', 'lead']);
  });
});
