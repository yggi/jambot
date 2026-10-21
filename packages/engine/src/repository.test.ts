import { METERS } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { type TimedEvent, type TransportEnv, transport } from './transport.ts';
import { LOOKAHEAD } from './transport.ts';
import { clockOfTransport, type TransportCarried } from './transport.ts';
import { composedMeter, stylePoint } from './meter-query.ts';
import { METER_READINGS, METER_REPOSITORY, SEED_FRAGMENTS, presetSwing } from './repository.ts';
import { RHYTHM_FRAGMENTS } from '@yggi/cells/repository/rhythms';
import { PRESETS, holding } from './style.ts';
import { type MeterSwing, STRAIGHT, holdingSwing } from './swing.ts';

/** Each preset's swing as `PRESETS` named it by hand before the repository found it (#360, #459), as a literal. */
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
  it('holds every meter, then every rhythm, each once and with its text', () => {
    expect(SEED_FRAGMENTS.map((f) => f.id)).toEqual([
      ...METER_READINGS.map((r) => r.id),
      ...RHYTHM_FRAGMENTS.map((f) => f.id),
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
    expect(PRESETS.map((p) => p.name)).toEqual(Object.keys(HAND_SWING));
    for (const preset of PRESETS) {
      const found = composedMeter(METER_REPOSITORY, preset.style, null)!;
      expect(found.meter, preset.name).toEqual(METERS['4/4']);
      expect(presetSwing(preset), preset.name).toEqual(HAND_SWING[preset.name]);
      expect(presetSwing(preset), preset.name).toEqual(found.swing);
      expect(METER_REPOSITORY.query(stylePoint(preset.style))[0]!.distance, preset.name).toBe(0);
    }
  });

  it('finds no swing where the repository misses, so a preset there leaves the swing as it is', () => {
    const missing = { ...METER_REPOSITORY, margins: { miss: -1, hold: 0 } };
    for (const preset of PRESETS) expect(presetSwing(preset, missing), preset.name).toBeNull();
  });

  it('plays every preset held, 2 seeds of 32 bars, as the meter and swing asked for do: 15,061 events, each to 1e-9 s', () => {
    let count = 0;
    for (const preset of PRESETS)
      for (const seed of [0, 1]) {
        const env: TransportEnv = {
          seed,
          start: 1,
          track: holding({ ...preset.style, entropy: 0.3 }),
          wish: { tonic: null, mode: preset.mode, melodic: null },
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
