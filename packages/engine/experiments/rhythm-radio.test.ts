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
  it('changes the rhythm 258 times in 8,704 sections, only where a section starts, and back at the next section only at a miss’s edge (E37)', () => {
    expect(RUNS).toHaveLength(40);
    for (const c of changes) expect(c.bar % SECTION_BARS, `${c.from} to ${c.to}`).toBe(0);
    // (but 9 times: a drum bar at the edge of its reach, taken where the drummer invented and let go at the next section,
    // past the miss distance, or the other way round: Bossa nova drums once, since cells v0.24.0 the quiet pulse 5 times
    // and Waltz drums once, yggi/cells#675 and #679, and since v0.25.0 the twelve-eight drums twice, yggi/cells#707 (8
    // before v0.25.0, Happy hardcore drums once among them; 2 before v0.24.0; 5 before v0.23.0, Spooky drums 4 times and
    // Ghost drums once); the hold keeps a rhythm against a nearer one, not against a miss)
    const back = RUNS.flatMap(wentBack);
    expect(back).toHaveLength(9);
    for (const b of back)
      expect([b.from, b.to].sort(), JSON.stringify(b)).toEqual([
        '- + -',
        expect.stringMatching(
          /^(bossa_nova_drums|quiet_pulse|waltz_drums|twelve_eight_drums) \+ -$/,
        ),
      ]);
    // (209 and 8,584 before cells v0.24.0, whose seven new drum bars the drummer holds lie along the walk; 250 before
    // v0.25.0, whose aksak and twelve-eight drums lie along it too; 264 and 8,587 before 2/4 and 2/2 were among the band's
    // meters on top of v0.25.0, #652: 233 sections now play 2/4, each with March drums, and a section of 2/4 lasts half a
    // 4/4's, so the hours hold more; none plays 2/2; 266 before the ostinato on top of 2/4 and 2/2, #651, where Salsa
    // drums takes sections near Salsa's point that went to other rhythms)
    expect([changes.length, sections]).toEqual([258, 8704]);
  });

  // (112 before cells v0.24.0, 136 before v0.25.0, 137 before 2/4 and 2/2 were among the band's meters on top of it, #652,
  // 136 before the ostinato on top of 2/4 and 2/2, #651)
  it('goes back 134 times with no margin for the rhythm playing (E37)', () => {
    const back = rhythmRuns(undefined, undefined, {
      miss: RHYTHM_MISS,
      hold: 0,
      layer: LAYER_DISTANCE,
    }).flatMap(wentBack).length;
    expect([back, RHYTHM_HOLD]).toEqual([134, 0.02]);
  });

  it('plays no clave alone in any section, where 992 did before #428: a line of its own only layers on a drum bar', () => {
    expect(aloneByPreset(RUNS)).toEqual(
      Object.fromEntries(PROTOTYPE_PRESETS.map((p) => [p.name, 0])),
    );
  });

  // (349 before cells v0.24.0, whose seven new drum bars the drummer holds fill some of the space; 260 before v0.25.0,
  // whose aksak and twelve-eight drums fill more)
  it('misses in 190 sections, each past the distance of every rhythm that fits the meter, and none where none fits: Spooky drums fits every meter the walk reaches but 7/8 (cells v0.12.0), Ghost drums 7/8 (v0.15.0), and the Happy hardcore, Acid and Elektro drums every one (v0.23.0), and the drummer invents past them (E37)', () => {
    const missed = RUNS.reduce(
      (m, r) => ({ fit: m.fit + r.missed.fit, distance: m.distance + r.missed.distance }),
      { fit: 0, distance: 0 },
    );
    expect(missed).toEqual({ fit: 0, distance: 190 });
  });
});
