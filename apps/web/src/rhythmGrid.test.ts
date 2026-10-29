import { DRUM_NOTES } from '@jambot/engine';
import { describe, expect, it } from 'vitest';
import { KIT, barHits, hasHit, hitsAt, recorded, toggled } from './rhythmGrid.ts';

const { kick, snare, closedHat } = DRUM_NOTES;

describe('a pattern of one’s own', () => {
  it('takes a hit in with a tap, and out with a second', () => {
    const once = toggled([], kick, 4);
    expect(once).toEqual([{ note: kick, step: 4 }]);
    expect(toggled(once, kick, 4)).toEqual([]);
  });

  it('keeps its hits in order of step, then note, whatever order they come in', () => {
    const pattern = toggled(toggled(toggled([], snare, 4), kick, 0), kick, 4);
    expect(pattern).toEqual([
      { note: kick, step: 0 },
      { note: kick, step: 4 },
      { note: snare, step: 4 },
    ]);
  });

  it('records a hit where there is none, and never twice', () => {
    const once = recorded([], snare, 12);
    expect(recorded(once, snare, 12)).toBe(once);
    expect(hasHit(once, snare, 12)).toBe(true);
  });

  it('strikes its notes at their step of every bar, in a bar of any length', () => {
    const pattern = [
      { note: kick, step: 0 },
      { note: closedHat, step: 0 },
      { note: snare, step: 12 },
    ];
    expect(hitsAt(pattern, 0, 16)).toEqual([kick, closedHat]);
    expect(hitsAt(pattern, 16 + 12, 16)).toEqual([snare]);
    expect(hitsAt(pattern, 3, 16)).toEqual([]);
    // In a bar of 7/8, fourteen steps, the snare at 12 still falls; a bar of 6/8 has no step 12.
    expect(hitsAt(pattern, 14 + 12, 14)).toEqual([snare]);
    expect(hitsAt(pattern, 12, 12)).toEqual([kick, closedHat]);
  });
});

describe('the band’s bar', () => {
  it('is the hits that start in it, by their step in it', () => {
    const lane = [
      { step: 15, note: kick, length: 1 },
      { step: 16, note: kick, length: 1 },
      { step: 20, note: snare, length: 1 },
      { step: 32, note: kick, length: 1 },
    ];
    expect(barHits(lane, 16, 16)).toEqual([
      { note: kick, step: 0 },
      { note: snare, step: 4 },
    ]);
  });
});

describe('the kit', () => {
  it('is the pads’ eight sounds, each its own note', () => {
    expect(KIT.map((p) => p.label)).toEqual([
      'Kick',
      'Snare',
      'Clap',
      'Closed hat',
      'Open hat',
      'Pedal hat',
      'Rim',
      'Ride',
    ]);
    expect(new Set(KIT.map((p) => p.note)).size).toBe(KIT.length);
  });
});
