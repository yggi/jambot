import { type BandBar, INITIAL_STYLE, band, playBar } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { writtenBar } from './host.ts';

/** A bar the band wrote and played: bar 3 of seed 4, at the opening style. */
function aBar(): BandBar {
  let carried = band.initial;
  let bar: BandBar | undefined;
  for (let i = 0; i <= 3; i++) {
    const result = band.advance(
      {
        seed: 4,
        bar: i,
        style: INITIAL_STYLE,
        wish: { tonic: null, mode: 'aeolian', melodic: null },
        offer: null,
      },
      carried,
      null,
    );
    carried = result.carried;
    bar = result.output;
  }
  return bar!;
}

describe('a bar as it travels', () => {
  it('leaves the bar’s own meter and the dough behind: the meter travels in the plan, and the client plays the dough itself', () => {
    const played = aBar();
    expect(played.meter).toBe(played.plan.meter);
    const sent = writtenBar(played);
    expect(Object.keys(sent)).not.toContain('meter');
    expect(Object.keys(sent)).not.toContain('dough');
    expect(Object.keys(JSON.parse(JSON.stringify(sent)) as object)).not.toContain('meter');
  });

  it('plays as the host played it once the client gives the plan’s meter back', () => {
    const played = aBar();
    const { written, ...rest } = writtenBar(played);
    const followed = playBar({ ...rest, meter: rest.plan.meter }, written);
    expect(followed).toEqual(played);
  });
});
