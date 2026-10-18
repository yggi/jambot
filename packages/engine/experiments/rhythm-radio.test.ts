import { describe, expect, it } from 'vitest';
import { RHYTHM_HOLD, RHYTHM_MISS, LAYER_DISTANCE, SECTION_BARS } from '../src/index.ts';
import { rhythmRuns, wentBack } from './rhythm-radio.ts';

const RUNS = rhythmRuns();
const changes = RUNS.flatMap((r) => r.changes);
const sections = RUNS.reduce((n, r) => n + r.sections, 0);
if (process.env.E37_REPORT) {
  const played: Record<string, number> = {};
  for (const r of RUNS)
    for (const [k, v] of Object.entries(r.played)) played[k] = (played[k] ?? 0) + v;
  console.log({
    changes: changes.length,
    sections,
    back: RUNS.flatMap(wentBack).length,
    missed: RUNS.map((r) => r.missed),
    played,
  });
}

describe('the composer asks the repository for its rhythm while the radio walks (E37)', () => {
  it('changes the rhythm 112 times in 8,521 sections, only where a section starts, and never back at the next section (E37)', () => {
    expect(RUNS).toHaveLength(40);
    for (const c of changes) expect(c.bar % SECTION_BARS, `${c.from} to ${c.to}`).toBe(0);
    expect(RUNS.flatMap(wentBack)).toEqual([]);
    expect([changes.length, sections]).toEqual([112, 8521]);
  });

  it('goes back 99 times with no margin for the rhythm playing (E37)', () => {
    const back = rhythmRuns(undefined, undefined, {
      miss: RHYTHM_MISS,
      hold: 0,
      layer: LAYER_DISTANCE,
    }).flatMap(wentBack).length;
    expect([back, RHYTHM_HOLD]).toEqual([99, 0.02]);
  });

  it('misses in 390 sections, each where no rhythm fits the meter (a meter but the 4/4s), and none past the distance: the drummer invents there (E37)', () => {
    const missed = RUNS.reduce(
      (m, r) => ({ fit: m.fit + r.missed.fit, distance: m.distance + r.missed.distance }),
      { fit: 0, distance: 0 },
    );
    expect(missed).toEqual({ fit: 390, distance: 0 });
  });
});
