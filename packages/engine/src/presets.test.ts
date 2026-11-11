// The presets past the prototype's eight (#517): Electro swing, Spooky and those after them, each a name and a point, its
// meter, swing, mode, drums and bass the ones cells' seeds hold at its point (yggi/cells#305, #349, #360), found there at
// distance 0, and played so by the band held there.
import { STYLES } from '@yggi/cells/repository/styles';
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
  Record<
    string,
    { meter: string; swing: string; mode: string; rhythm: string; bass: string; meterAt?: number }
  >
> = {
  'Electro swing': {
    meter: 'meter(swing=8n:2/3)',
    swing: '8n 0.667',
    mode: 'aeolian', // (cells' harmonic minor, read as aeolian: #516)
    rhythm: 'electro_swing_drums',
    bass: 'walking_bass',
  },
  Spooky: {
    meter: 'meter(grouping=meter("5/4"))',
    swing: '16n 0.500',
    mode: 'aeolian',
    rhythm: 'spooky_drums',
    bass: 'creeping_bass',
  },
  // (cells' Kinderlied, a preset since #596: since cells v0.23.0 the plain 4/4 sits at its point too, yggi/cells#572)
  Kinderlied: {
    meter: 'meter',
    mode: 'ionian',
    rhythm: 'kinderlied_drums',
    bass: 'root_bass',
    swing: '16n 0.500',
  },
  // (the four styles cut from cells' examples at v0.23.0, yggi/cells#572: each its piece's parts, in A minor)
  Acid: {
    meter: 'meter',
    mode: 'aeolian',
    rhythm: 'acid_drums',
    bass: 'acid_bass',
    swing: '16n 0.500',
  },
  'Happy hardcore': {
    meter: 'meter',
    mode: 'aeolian',
    rhythm: 'happy_hardcore_drums',
    bass: 'pumping_bass',
    swing: '16n 0.500',
  },
  Elektro: {
    meter: 'meter',
    mode: 'aeolian',
    rhythm: 'elektro_drums',
    bass: 'octave_bass',
    swing: '16n 0.500',
  },
  'Dark ambient': {
    meter: 'meter',
    mode: 'aeolian',
    rhythm: 'industrial_drums',
    bass: 'drone_bass',
    swing: '16n 0.500',
  },
  // (the eight styles placed at cells v0.24.0, yggi/cells#675 and #679, each with its parts, where the band plays them)
  Baroque: {
    meter: 'meter',
    mode: 'ionian',
    rhythm: 'quiet_pulse',
    bass: 'continuo_bass',
    swing: '16n 0.500',
  },
  'Blues shuffle': {
    meter: 'meter(swing=8n:2/3)',
    swing: '8n 0.667',
    mode: 'mixolydian',
    rhythm: 'ride_shuffle',
    bass: 'blues_walk',
  },
  // (cells' quarter_bass, the root on every beat, is a walk to the band, which walks only under a swung meter
  // (`isWalk`): the root bass, the next nearest, plays)
  'Sea shanty': {
    meter: 'meter',
    mode: 'dorian',
    rhythm: 'shanty_drums',
    bass: 'root_bass',
    swing: '16n 0.500',
  },
  // (cells' harmonic minor, read as aeolian: #516)
  Chiptune: {
    meter: 'meter',
    mode: 'aeolian',
    rhythm: 'chip_drums',
    bass: 'octave_bass',
    swing: '16n 0.500',
  },
  // (cells' salsa_drums play the conga's tumbao on the toms, which the drummer plays as an ostinato, #651)
  Salsa: {
    meter: 'meter',
    mode: 'mixolydian',
    rhythm: 'salsa_drums',
    bass: 'tumbao_bass',
    swing: '16n 0.500',
  },
  Waltz: {
    meter: 'meter(grouping=meter("3/4"))',
    mode: 'ionian',
    rhythm: 'waltz_drums',
    bass: 'waltz_bass',
    swing: '16n 0.500',
  },
  // (cells' 2/4 is none of the band's meters (`METER_READINGS`): the plain 4/4, the next nearest, at .108; on it the
  // oom-pah, a note on every beat, is a walk to the band (`isWalk`), so the pumping bass plays)
  March: {
    meter: 'meter',
    meterAt: 0.108,
    mode: 'ionian',
    rhythm: 'march_drums',
    bass: 'pumping_bass',
    swing: '16n 0.500',
  },
  'Trip-hop': {
    meter: 'meter',
    mode: 'aeolian',
    rhythm: 'trip_hop_drums',
    bass: 'dub_bass',
    swing: '16n 0.500',
  },
};

describe('the presets (#517)', () => {
  it('are the prototype’s eight, then Electro swing, Spooky, Kinderlied, the four cut from cells’ examples at v0.23.0 and the eight of v0.24.0, each named once: cells’ library of styles (#596)', () => {
    expect(PRESETS.slice(0, PROTOTYPE_PRESETS.length)).toEqual(PROTOTYPE_PRESETS);
    expect(NEW.map((p) => p.name)).toEqual([
      'Electro swing',
      'Spooky',
      'Kinderlied',
      'Acid',
      'Happy hardcore',
      'Elektro',
      'Dark ambient',
      'Baroque',
      'Blues shuffle',
      'Sea shanty',
      'Chiptune',
      'Salsa',
      'Waltz',
      'March',
      'Trip-hop',
    ]);
    // (each its point, its bite Jambot's artic, and its tempo as cells' library writes them, to the last bit)
    for (const p of PRESETS) {
      const s = STYLES.find((x) => x.id === p.id)!;
      const { sync, harm, artic, mood, bpm } = p.style;
      expect({ sync, harm, bite: artic, mood, bpm }).toEqual({ ...s.point, bpm: s.tempo });
    }
    expect(new Set(PRESETS.map((p) => p.name)).size).toBe(PRESETS.length);
  });

  it.each(NEW.map((p) => [p.name, p] as const))(
    '%s finds its meter, swing and mode at its point, at distance 0 (March’s plain 4/4 as named, cells’ 2/4 none of the band’s)',
    (name, preset) => {
      const meter = presetMeter(preset)!;
      expect([meter.fragment.id, +meter.distance.toFixed(3)]).toEqual([
        FOUND[name]!.meter,
        FOUND[name]!.meterAt ?? 0,
      ]);
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
