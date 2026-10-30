// The presets past the prototype's eight (#517): Electro swing and Spooky, each a name and a point and nothing else, its
// meter, swing, mode, drums and bass the ones cells' seeds hold at its point (yggi/cells#305, #349, #360), found there at
// distance 0, and played so by the band held there.
import { describe, expect, it } from 'vitest';
import { type BandCarried, band } from './band.ts';
import { BASS_REPOSITORY } from './bass-lines.ts';
import { stylePoint } from './meter-query.ts';
import { MODE_REPOSITORY, presetMode } from './mode-repository.ts';
import { METER_REPOSITORY, presetMeter, presetSwing } from './repository.ts';
import { RHYTHM_REPOSITORY } from './rhythms.ts';
import { PRESETS, PROTOTYPE_PRESETS } from './style.ts';

const NEW = PRESETS.slice(PROTOTYPE_PRESETS.length);

/** What each new preset finds at its point: the meter and its swing, the mode, the drum bar and the bass line. */
const FOUND: Readonly<
  Record<string, { meter: string; swing: string; mode: string; rhythm: string; bass: string }>
> = {
  'Electro swing': {
    meter: '4/4 swung on 8n',
    swing: '8n 0.667',
    mode: 'aeolian', // (cells' harmonic minor, read as aeolian: #516)
    rhythm: 'Electro swing drums',
    bass: 'walking bass',
  },
  Spooky: {
    meter: '5/4',
    swing: '16n 0.500',
    mode: 'aeolian',
    rhythm: 'Spooky drums',
    bass: 'creeping bass',
  },
};

describe('the presets (#517)', () => {
  it('are the prototype’s eight, then Electro swing and Spooky, each named once', () => {
    expect(PRESETS.slice(0, PROTOTYPE_PRESETS.length)).toEqual(PROTOTYPE_PRESETS);
    expect(NEW.map((p) => [p.name, ...Object.values(p.style)])).toEqual([
      ['Electro swing', 0.55, 0.75, 0.6, 0.75, 124],
      ['Spooky', 0.2, 0.9, 0.3, 0.35, 100],
    ]);
    expect(new Set(PRESETS.map((p) => p.name)).size).toBe(PRESETS.length);
  });

  it.each(NEW.map((p) => [p.name, p] as const))(
    '%s finds its meter, swing and mode at its point, at distance 0',
    (name, preset) => {
      const meter = presetMeter(preset)!;
      expect([meter.fragment.id, meter.distance]).toEqual([FOUND[name]!.meter, 0]);
      const swing = presetSwing(preset)!;
      expect(`${swing.level} ${swing.share.toFixed(3)}`).toBe(FOUND[name]!.swing);
      expect(presetMode(preset)).toBe(FOUND[name]!.mode);
      expect(MODE_REPOSITORY.query(stylePoint(preset.style))[0]!.distance).toBe(0);
    },
  );

  it.each(NEW.map((p) => [p.name, p] as const))(
    '%s held at entropy 0, seeds 1 and 2, 32 bars: every section plays its meter, its drum bar and its bass line, in its mode',
    (name, preset) => {
      for (const seed of [1, 2]) {
        let carried: BandCarried = band.initial;
        const sections = new Set<string>();
        for (let bar = 0; bar < 32; bar++) {
          const next = band.advance(
            {
              seed,
              bar,
              style: { ...preset.style, entropy: 0 },
              swing: presetSwing(preset)!,
              wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
              offer: null,
              repository: METER_REPOSITORY,
              rhythms: RHYTHM_REPOSITORY,
              bassLines: BASS_REPOSITORY,
            },
            carried,
            null,
          );
          carried = next.carried;
          const { plan } = next.output;
          sections.add(
            [
              plan.meterFragment,
              plan.rhythmFragment,
              carried.plans.bassFragment,
              plan.key.mode,
            ].join(' | '),
          );
        }
        const { meter, rhythm, bass, mode } = FOUND[name]!;
        expect([...sections], `seed ${seed}`).toEqual([[meter, rhythm, bass, mode].join(' | ')]);
      }
    },
  );
});
