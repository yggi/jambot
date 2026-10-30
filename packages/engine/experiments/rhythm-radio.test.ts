import { describe, expect, it } from 'vitest';
import {
  PROTOTYPE_PRESETS,
  RHYTHM_HOLD,
  RHYTHM_MISS,
  LAYER_DISTANCE,
  SECTION_BARS,
} from '../src/index.ts';
import { aloneByPreset, rhythmRuns, wentBack } from './rhythm-radio.ts';

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
    alone: aloneByPreset(RUNS),
  });
}

describe('the composer asks the repository for its rhythm while the radio walks (E37)', () => {
  it('changes the rhythm 150 times in 8,570 sections, only where a section starts, and back at the next section only at a miss’s edge (E37)', () => {
    expect(RUNS).toHaveLength(40);
    for (const c of changes) expect(c.bar % SECTION_BARS, `${c.from} to ${c.to}`).toBe(0);
    // (but 4 times, since cells v0.12.0: Spooky drums at the edge of its reach, taken where the drummer invented and let
    // go at the next section, past the miss distance; the hold keeps a rhythm against a nearer one, not against a miss)
    const back = RUNS.flatMap(wentBack);
    expect(back).toHaveLength(4);
    for (const b of back)
      expect([b.from, b.to].sort(), JSON.stringify(b)).toEqual(['- + -', 'Spooky drums + -']);
    expect([changes.length, sections]).toEqual([150, 8570]);
  });

  it('goes back 106 times with no margin for the rhythm playing (E37)', () => {
    const back = rhythmRuns(undefined, undefined, {
      miss: RHYTHM_MISS,
      hold: 0,
      layer: LAYER_DISTANCE,
    }).flatMap(wentBack).length;
    expect([back, RHYTHM_HOLD]).toEqual([106, 0.02]);
  });

  it('plays no clave alone in any section, where 992 did before #428: a line of its own only layers on a drum bar', () => {
    expect(aloneByPreset(RUNS)).toEqual(
      Object.fromEntries(PROTOTYPE_PRESETS.map((p) => [p.name, 0])),
    );
  });

  it('misses in 139 sections, each past the distance of every rhythm that fits the meter, and none where none fits: Spooky drums fits every meter the walk reaches (cells v0.12.0), and the drummer invents past it (E37)', () => {
    const missed = RUNS.reduce(
      (m, r) => ({ fit: m.fit + r.missed.fit, distance: m.distance + r.missed.distance }),
      { fit: 0, distance: 0 },
    );
    expect(missed).toEqual({ fit: 0, distance: 139 });
  });
});
