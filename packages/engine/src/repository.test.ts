import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type TimedEvent, type TransportEnv, transport } from './transport.ts';
import { LOOKAHEAD } from './transport.ts';
import { clockOfTransport, type TransportCarried } from './transport.ts';
import { type MeterRepository, QUERY_AXES, composedMeter, stylePoint } from './meter-query.ts';
import {
  METER_READINGS,
  METER_REPOSITORY,
  SEED_FRAGMENTS,
  meterRepository,
  presetMeter,
  presetSwing,
} from './repository.ts';
import type { RhythmRepository } from './rhythm-query.ts';
import { RHYTHM_BENCHES, RHYTHM_REPOSITORY, rhythmRepository } from './rhythms.ts';
import { BASS_FRAGMENTS } from '@yggi/cells/repository/bass';
import { HARMONY_FRAGMENTS } from '@yggi/cells/repository/harmony';
import { LIBRARY } from '@yggi/cells/repository/library';
import { METER_FRAGMENTS } from '@yggi/cells/repository/meters';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { PROTOTYPE_PRESETS, holding } from './style.ts';
import { type MeterSwing, STRAIGHT, holdingSwing } from './swing.ts';
import { presetMode } from './mode-repository.ts';

/** Each preset's swing as `PROTOTYPE_PRESETS` named it by hand before the repository found it (#360, #459), as a literal. */
const HAND_SWING: Readonly<Record<string, MeterSwing>> = {
  'Synth-pop': { level: '16n', share: 0.5 },
  Techno: { level: '16n', share: 0.5 },
  'Deep house': { level: '16n', share: 0.6 },
  Ambient: { level: '16n', share: 31 / 60 },
  'Lo-fi hip hop': { level: '16n', share: 0.65 },
  Funk: { level: '16n', share: 0.6 },
  'Bossa nova': { level: '16n', share: 0.5 },
  'Swing jazz': { level: '8n', share: 2 / 3 },
};

/** The transport over a preset held, 32 bars: every event's part, step, note, velocity, onset and duration. */
function events(env: TransportEnv): TimedEvent[] {
  let carried: TransportCarried | null = transport.initial;
  const out: TimedEvent[] = [];
  for (let now = env.start - 0.1; ; now += 0.1) {
    const next = transport.advance(env, carried, { now, until: now + LOOKAHEAD });
    carried = next.carried!;
    out.push(...next.output.events.filter((e) => e.bar < 32));
    if (carried.head.step > clockOfTransport(carried).barStart(32)) return out;
  }
}

describe("cells' seed, as a screen reads it", () => {
  it('holds every meter, then every rhythm, every bass line, then every harmony, each once and with its text', () => {
    expect(SEED_FRAGMENTS.map((f) => f.id)).toEqual([
      ...METER_READINGS.map((r) => r.id),
      ...RHYTHM_FRAGMENTS.map((f) => f.id),
      ...BASS_FRAGMENTS.map((f) => f.id),
      ...HARMONY_FRAGMENTS.map((f) => f.id),
    ]);
    expect(new Set(SEED_FRAGMENTS.map((f) => f.id)).size).toBe(SEED_FRAGMENTS.length);
    for (const f of SEED_FRAGMENTS) expect(f.text.length, f.id).toBeGreaterThan(0);
  });
});

describe("cells' repository of meters, as the composer asks it (#375)", () => {
  it('reads eleven of cells’ thirteen meters into the band’s, and says why it leaves out the other two', () => {
    const left = METER_READINGS.filter((r) => typeof r.read === 'string');
    expect(Object.fromEntries(left.map((r) => [r.id, r.read]))).toEqual({
      '4/4 alla breve': "its meter, 2 beats in 8 eighths at 0 4, is none of the band's",
      '2/4': "its meter, 2 beats in 4 eighths at 0 2, is none of the band's",
    });
    expect([...METER_REPOSITORY.fragments.keys()]).toHaveLength(11);
    expect(METER_REPOSITORY.fragments.get('10/8')!.meter).toEqual(METERS['10/8']);
    expect(METER_REPOSITORY.fragments.get('7/8')!.meter).toEqual(METERS['7/8']);
    expect(METER_REPOSITORY.fragments.get('12/8')!.meter).toEqual(METERS['12/8']);
    expect(METER_REPOSITORY.fragments.get('4/4 swung on 8n')!.swing).toEqual({
      level: '8n',
      share: 2 / 3,
    });
  });

  it('finds each preset’s swing at its point, at distance 0: 4/4, swinging exactly as the preset named it by hand (#459)', () => {
    expect(PROTOTYPE_PRESETS.map((p) => p.name)).toEqual(Object.keys(HAND_SWING));
    for (const preset of PROTOTYPE_PRESETS) {
      const found = composedMeter(METER_REPOSITORY, preset.style, null)!;
      expect(found.meter, preset.name).toEqual(METERS['4/4']);
      expect(presetSwing(preset), preset.name).toEqual(HAND_SWING[preset.name]);
      expect(presetSwing(preset), preset.name).toEqual(found.swing);
      expect(METER_REPOSITORY.query(stylePoint(preset.style))[0]!.distance, preset.name).toBe(0);
    }
  });

  it('reads each preset’s swing off the meter found at its own point, at distance 0 there, as the composer with nothing playing takes it (#459)', () => {
    for (const preset of PROTOTYPE_PRESETS) {
      const found = presetMeter(preset)!;
      expect(found.distance, preset.name).toBe(0);
      expect(found.fragment, preset.name).toEqual(
        composedMeter(METER_REPOSITORY, preset.style, null),
      );
      expect(presetSwing(preset), preset.name).toEqual(found.fragment.swing);
    }
  });

  it('finds no swing where the repository misses, so a preset there leaves the swing as it is', () => {
    const missing = { ...METER_REPOSITORY, margins: { miss: -1, hold: 0 } };
    for (const preset of PROTOTYPE_PRESETS) {
      expect(presetMeter(preset, missing), preset.name).toBeNull();
      expect(presetSwing(preset, missing), preset.name).toBeNull();
    }
  });

  it('plays every preset held, 2 seeds of 32 bars, as the meter and swing asked for do: 15,061 events, each to 1e-9 s', () => {
    let count = 0;
    for (const preset of PROTOTYPE_PRESETS)
      for (const seed of [0, 1]) {
        const env: TransportEnv = {
          seed,
          start: 1,
          track: holding({ ...preset.style, entropy: 0.3 }),
          wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
        };
        const asked = events({ ...env, swing: holdingSwing(HAND_SWING[preset.name]!) });
        // The repository's share wins over the swing track's, so a straight track changes nothing.
        const found = events({
          ...env,
          swing: holdingSwing(STRAIGHT),
          repository: METER_REPOSITORY,
        });
        expect(found.length, preset.name).toBe(asked.length);
        for (const [i, a] of asked.entries()) {
          const b = found[i]!;
          expect([b.bar, b.event.part, b.event.step, b.event.note, b.event.velocity]).toEqual([
            a.bar,
            a.event.part,
            a.event.step,
            a.event.note,
            a.event.velocity,
          ]);
          expect(Math.abs(b.seconds - a.seconds)).toBeLessThan(1e-9);
          expect(Math.abs(b.duration - a.duration)).toBeLessThan(1e-9);
        }
        count += asked.length;
      }
    expect(count).toBe(15061);
  });
});

describe('every query the composer asks names its facet (cells v0.9.0: the library holds instruments and modes too)', () => {
  // Each preset's point, and the 81 corners and midpoints of the four axes asked on: 89 points.
  const steps = [0, 0.5, 1];
  const grid = QUERY_AXES.reduce<Record<string, number>[]>(
    (points, axis) => points.flatMap((p) => steps.map((v) => ({ ...p, [axis]: v }))),
    [{}],
  );
  const POINTS = [...PROTOTYPE_PRESETS.map((p) => stylePoint(p.style)), ...grid];
  const ranked = (found: readonly { id: string; distance: number }[]) =>
    found.map((f) => `${f.id} ${f.distance.toFixed(9)}`).join(', ');
  /** FNV-1a over the lines, one a query. */
  const hashOf = (lines: readonly string[]) => {
    let h = 0x811c9dc5;
    for (const line of lines)
      for (let i = 0; i <= line.length; i++)
        h = Math.imul(h ^ (i < line.length ? line.charCodeAt(i) : 10), 0x01000193);
    return (h >>> 0).toString(16).padStart(8, '0');
  };
  // What the band takes of each answer: the nearest (`presetMeter`, the composer), not the ranking below it, so a
  // fragment cells adds that the band would never pick changes nothing here (yggi/music-commons#37).
  const nearest = (found: readonly { id: string; distance: number }[]) => ranked(found.slice(0, 1));
  const meterQueries = (repository: MeterRepository) =>
    POINTS.map((point) => nearest(repository.query(point)));
  // A section's rhythm on every bench, then what layers on the nearest (the clave beside a drum bar).
  const rhythmQueries = (repository: RhythmRepository) =>
    RHYTHM_BENCHES.flatMap((bench) =>
      POINTS.map((point) => {
        const found = repository.query(point, bench);
        const layered = found[0] ? repository.layered(point, bench, found[0].id) : [];
        return `${nearest(found)} | ${nearest(layered)}`;
      }),
    );
  // The rest of cells' library, beside the meters and rhythms each repository holds already: the bass lines, the
  // harmonies, the kits and the modes, the bell and scale (a rhythm too) left out.
  const OTHERS = LIBRARY.filter(
    (f) => !f.association.some((p) => p.facet === 'meter' || p.facet === 'rhythm'),
  );

  it('picks the meters it picked under cells v0.8.0 but near the new presets’ points, at each of 89 points, and as with every other facet of the library beside them', () => {
    const asked = meterQueries(METER_REPOSITORY);
    // (as under cells v0.8.0 but near Electro swing's and Spooky's points, whose meters cells v0.12.0 placed there)
    expect([asked.length, hashOf(asked)]).toEqual([89, '5fd35b0e']);
    // (what of cells' library is neither a meter nor a rhythm: bass lines, harmonies, kits, modes … whatever it holds)
    expect(OTHERS.length).toBeGreaterThan(0);
    expect(meterQueries(meterRepository([...METER_FRAGMENTS, ...OTHERS]))).toEqual(asked);
  });

  it('picks the rhythms, and the clave layered on the drum bar picked, as under cells v0.8.0 but where a newer seed is nearer, on each of 20 benches at each of 89 points, and as with every other facet of the library beside them', () => {
    const asked = rhythmQueries(RHYTHM_REPOSITORY);
    // (as under cells v0.8.0 but where Electro swing drums (held since #508) or Spooky drums (cells v0.12.0) is nearer)
    expect([asked.length, hashOf(asked)]).toEqual([1780, '9aaeb2c7']);
    // (a rhythm is found on the six benches in 4/4, 6 × 89, a clave layered on every one; and since cells v0.12.0 Spooky
    // drums, which fits every meter but 7/8, on ten benches more, 10 × 89, where no clave fits)
    const found = asked.filter((line) => !line.startsWith(' |'));
    expect([found.length, found.filter((line) => !line.endsWith('| ')).length]).toEqual([
      1424, 534,
    ]);
    expect(rhythmQueries(rhythmRepository([...RHYTHM_FRAGMENTS, ...OTHERS]))).toEqual(asked);
  });
});
