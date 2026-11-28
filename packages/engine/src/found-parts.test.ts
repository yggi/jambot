// The parts the band finds in cells beside its figures (#540, #643, #644, #646): the offer every member draws from, the
// lead's melodic scale, the drummer's fills, the ending and the count-in. Each finite set is tested whole: every
// melodic fragment over every mode, every fill and ending and count in every meter it reads in, every preset.
import { METERS, type MeterName } from '@jambot/theory';
import { describe, expect, it } from 'vitest';
import { BASSIST } from './muse-line.ts';
import { COUNT_FRAGMENTS, DEFAULT_COUNT, countAt, countHits } from './counts.ts';
import { DRUMMER } from './band.ts';
import { ENDING_FRAGMENTS, endingRead, sectionEnding } from './endings.ts';
import { BAND_SOURCES, COMPOSER, OFFER, OFFER_FLOOR, drawnOnOffer, onOffer } from './facet.ts';
import { FILL_FRAGMENTS, KIND_FILLS, fillHits, sectionFill } from './fills.ts';
import { COMPOSER_MODES, MELODIC_SCALES, melodicHelix } from './key.ts';
import {
  MELODIC_FRAGMENTS,
  foundMelodic,
  melodicNameOf,
  melodicOffsets,
  planScale,
} from './melodic.ts';
import { stylePoint } from './meter-query.ts';
import { presetMode } from './mode-repository.ts';
import { SOLOIST } from './muse-lead.ts';
import { NO_HISTORY } from './history.ts';
import { EMPTY_LAYER } from './layer.ts';
import { LEAD_REPOSITORY } from './lead-lines.ts';
import { BASS_REPOSITORY } from './bass-lines.ts';
import { type PlanCarried, type PlanEnv, planner } from './plan.ts';
import { HARMONY_REPOSITORY } from './progressions.ts';
import { RHYTHM_REPOSITORY } from './rhythms.ts';
import { METER_REPOSITORY, presetMeter } from './repository.ts';
import { PRESETS } from './style.ts';

const found = (...ranks: number[]) => ranks.map((distance, i) => ({ id: `f${i}`, distance }));
const meterOf = (preset: (typeof PRESETS)[number]) =>
  presetMeter(preset)?.fragment.meter ?? METERS['4/4'];
const named = (name: string) => PRESETS.find((p) => p.name === name)!;

describe('the offer (#540)', () => {
  it('is those as near as the nearest within OFFER, or OFFER_FLOOR past it', () => {
    expect([OFFER, OFFER_FLOOR]).toEqual([1.25, 0.1]);
    // (at a style's own point, the nearest at 0: those placed beside it within a tenth)
    expect(onOffer(found(0, 0.05, 0.1, 0.11)).map((f) => f.id)).toEqual(['f0', 'f1', 'f2']);
    // (between styles: a quarter farther, and a tenth)
    expect(onOffer(found(0.2, 0.34, 0.36)).map((f) => f.id)).toEqual(['f0', 'f1']);
    expect(onOffer([])).toEqual([]);
  });

  it('draws the nearer the likelier: each as likely as it lies inside the offer’s edge', () => {
    const offer = found(0, 0.05, 0.1);
    const taken = (pick: number) => drawnOnOffer(offer, pick)!.id;
    // (the edge at 0.1: weights 0.1, 0.05 and 0, so two thirds the nearest, a third the next, the edge never)
    expect(taken(0)).toBe('f0');
    expect(taken(0.66)).toBe('f0');
    expect(taken(0.67)).toBe('f1');
    expect(taken(0.9999)).toBe('f1');
    expect(drawnOnOffer([], 0.5)).toBeUndefined();
  });

  it('takes what a player gave the band first, among those on offer: the draw is among those alone', () => {
    const offer = found(0, 0.05, 0.08);
    expect(drawnOnOffer(offer, 0, (id) => id === 'f2')!.id).toBe('f2');
    // (it fires: one past the edge is no preferred one)
    expect(drawnOnOffer(found(0, 0.2), 0, (id) => id === 'f1')!.id).toBe('f0');
  });

  it('names the band’s own sources as the members’ modules do', () => {
    expect([...BAND_SOURCES].sort()).toEqual([BASSIST, COMPOSER, DRUMMER, SOLOIST].sort());
  });
});

describe('the lead’s melodic scale from cells (#644)', () => {
  it('reads every melodic fragment over every mode, and names each by its family', () => {
    expect(MELODIC_FRAGMENTS.map((f) => f.id)).toEqual([
      'plain',
      'pentatonic(phase=0)',
      'pentatonic(phase=3)',
      'blues',
      'major_blues',
    ]);
    for (const f of MELODIC_FRAGMENTS) {
      expect(MELODIC_SCALES, f.id).toContain(melodicNameOf(f.id));
      for (const mode of COMPOSER_MODES)
        expect(melodicOffsets(f.id, mode), `${f.id} ${mode}`).not.toBeNull();
    }
    expect(melodicNameOf('lydian_dominant')).toBeNull();
  });

  it('plays each fragment’s own notes: the key itself, the pentatonics as the key’s table writes them in their own keys, the blues the minor blues over any key', () => {
    for (const mode of COMPOSER_MODES)
      for (const tonic of [0, 7]) {
        const key = { tonic, mode };
        expect(planScale({ key, melodic: 'plain', melodicFragment: 'plain' }), `${mode}`).toEqual(
          melodicHelix(key, 'plain'),
        );
        expect(
          planScale({ key, melodic: 'blues', melodicFragment: 'blues' }).heights.map(
            (h) => h - tonic,
          ),
        ).toEqual([0, 3, 5, 6, 7, 10]);
      }
    expect(
      planScale({
        key: { tonic: 0, mode: 'ionian' },
        melodic: 'pentatonic',
        melodicFragment: 'pentatonic(phase=0)',
      }),
    ).toEqual(melodicHelix({ tonic: 0, mode: 'ionian' }, 'pentatonic'));
    expect(
      planScale({
        key: { tonic: 9, mode: 'aeolian' },
        melodic: 'pentatonic',
        melodicFragment: 'pentatonic(phase=3)',
      }),
    ).toEqual(melodicHelix({ tonic: 9, mode: 'aeolian' }, 'pentatonic'));
    // (no fragment: the key's table, the generator on a miss or a wish)
    expect(planScale({ key: { tonic: 0, mode: 'mixolydian' }, melodic: 'blues' })).toEqual(
      melodicHelix({ tonic: 0, mode: 'mixolydian' }, 'blues'),
    );
  });

  it('finds at every preset the scale cells places there: the blues at Blues shuffle, the pentatonic at Kinderlied, the key’s own at every other', () => {
    for (const p of PRESETS) {
      const scale = foundMelodic(stylePoint(p.style), presetMode(p)!, 0);
      const expected =
        p.name === 'Blues shuffle'
          ? 'blues'
          : p.name === 'Kinderlied'
            ? 'pentatonic(phase=0)'
            : 'plain';
      expect(scale, p.name).toBe(expected);
    }
  });

  it('holds the one playing while it is on offer', () => {
    const blues = stylePoint(named('Blues shuffle').style);
    expect(foundMelodic(blues, 'mixolydian', 0.99, 'blues')).toBe('blues');
    expect(foundMelodic(blues, 'mixolydian', 0, 'plain')).toBe('blues');
  });
});

describe('the drummer’s fills from cells (#643)', () => {
  it('reads the fill of every groove and every fill of its own, in 4/4, a bar of hits', () => {
    for (const f of FILL_FRAGMENTS.filter((f) => !['tom_run', 'landing'].includes(f.id))) {
      const hits = fillHits(f.id, METERS['4/4']);
      expect(hits?.length, f.id).toBeGreaterThan(0);
    }
  });

  it('ends a build and a breakdown on the fill their kind asks for, cells’ build_run, in every meter it reads in', () => {
    expect(KIND_FILLS).toEqual({ build: 'build_run', breakdown: 'build_run' });
    for (const name of ['4/4', '3/4', '6/8'] as MeterName[])
      for (const type of ['build', 'breakdown'] as const)
        expect(
          sectionFill(stylePoint(named('Funk').style), type, METERS[name], 0.5),
          `${type} ${name}`,
        ).toBe('build_run');
  });

  it('finds at every preset a fill that reads in its own meter: each style its own, the timbales at Salsa, the timpani at Baroque, the waltz’s and the march’s', () => {
    const OWN: Record<string, string> = {
      Salsa: 'abanico',
      Baroque: 'timpani_roll',
      Waltz: 'waltz_fill',
      March: 'march_roll',
      Spooky: 'tom_run',
    };
    for (const p of PRESETS) {
      const fill = sectionFill(stylePoint(p.style), 'groove', meterOf(p), 0);
      expect(fill, p.name).toBeDefined();
      expect(fillHits(fill!, meterOf(p)), p.name).not.toBeNull();
      if (OWN[p.name]) expect(fill, p.name).toBe(OWN[p.name]);
    }
  });
});

describe('the ending from cells (#646)', () => {
  it('reads every ending over every mode in 4/4: its chords, the bass, the pad and the lead, and its drums', () => {
    expect(ENDING_FRAGMENTS.map((f) => f.id)).toEqual([
      'finale',
      'stop',
      'picardy',
      'plagal',
      'blues_ending',
      'drone_out',
    ]);
    for (const f of ENDING_FRAGMENTS)
      for (const mode of COMPOSER_MODES) {
        const read = endingRead(f.id, mode, METERS['4/4']);
        expect(read, `${f.id} ${mode}`).not.toBeNull();
        for (const part of ['bass', 'pad', 'lead'] as const)
          expect(read![part].length, `${f.id} ${mode} ${part}`).toBeGreaterThan(0);
        expect(read!.drums?.length, `${f.id} ${mode} drums`).toBeGreaterThan(0);
      }
  });

  it('finds at every preset the ending of its idiom: the amen where a song is sung together, the tierce de Picardie at Baroque, the blues’ seventh, the stop on the one, the held drone', () => {
    const IDIOM: Record<string, string> = {
      Kinderlied: 'plagal',
      Baroque: 'picardy',
      'Blues shuffle': 'blues_ending',
      Acid: 'stop',
      'Happy hardcore': 'stop',
      Elektro: 'stop',
      Chiptune: 'stop',
      Salsa: 'stop',
      'Dark ambient': 'drone_out',
      'Trip-hop': 'drone_out',
    };
    for (const p of PRESETS) {
      const ending = sectionEnding(stylePoint(p.style), presetMode(p)!, meterOf(p), 0);
      expect(ending, p.name).toBe(IDIOM[p.name] ?? (p.name === 'Sea shanty' ? 'plagal' : 'finale'));
    }
  });
});

describe('the count-in from cells (#646)', () => {
  it('reads every count in every named meter: a click on each beat, the downbeat the strongest', () => {
    expect(COUNT_FRAGMENTS.map((f) => f.id)).toEqual([
      'click',
      'stick_count',
      'hat_count',
      'clave_count',
    ]);
    for (const f of COUNT_FRAGMENTS)
      for (const name of Object.keys(METERS) as MeterName[]) {
        const hits = countHits(f.id, METERS[name]);
        expect(hits?.length, `${f.id} ${name}`).toBeGreaterThan(0);
        expect(hits![0]!.step, `${f.id} ${name}`).toBe(0);
        expect(Math.max(...hits!.map((h) => h.velocity)), `${f.id} ${name}`).toBe(
          hits![0]!.velocity,
        );
        expect(new Set(hits!.map((h) => h.note)).size, `${f.id} ${name}`).toBe(1);
      }
  });

  it('counts each preset in on its style’s count: the sticks, the hi-hat’s pedal, the claves, or the wood block where no drummer would count', () => {
    const NOTE: Record<string, number> = {
      click: 77,
      stick_count: 37,
      hat_count: 44,
      clave_count: 75,
    };
    for (const p of PRESETS) {
      const count = countAt(stylePoint(p.style), meterOf(p));
      expect(Object.keys(NOTE), p.name).toContain(count);
      expect(countHits(count, meterOf(p))![0]!.note, p.name).toBe(NOTE[count]);
    }
    expect(countAt(stylePoint(named('Salsa').style), METERS['4/4'])).toBe('clave_count');
    expect(countAt(stylePoint(named('Swing jazz').style), METERS['4/4'])).toBe('hat_count');
    expect(countAt(stylePoint(named('Ambient').style), METERS['4/4'])).toBe(DEFAULT_COUNT);
  });
});

describe('the offer held (#540)', () => {
  it('holds what plays while it is on offer: at entropy 0, where nothing tires, a preset held plays one drum bar, bass line and lead line through a song’s sections, at every seed', () => {
    // (held only within METER_HOLD of the nearest before, a neighbour drawn was drawn again each section: Kinderlied's
    // lead at seed 3 wonder, hinein, haenschen, heim; Spooky's musicBox, sway, toll, wail)
    for (const preset of PRESETS)
      for (const seed of [1, 2, 3, 4, 5]) {
        let carried: PlanCarried = planner.initial;
        const played = {
          rhythm: new Set<string>(),
          bass: new Set<string>(),
          lead: new Set<string>(),
        };
        for (let index = 0; index < 8; index++) {
          const env: PlanEnv = {
            seed,
            index,
            style: { ...preset.style, entropy: 0 },
            wish: { tonic: null, mode: presetMode(preset)!, melodic: null },
            history: NO_HISTORY,
            repository: METER_REPOSITORY,
            rhythms: RHYTHM_REPOSITORY,
            bassLines: BASS_REPOSITORY,
            leads: LEAD_REPOSITORY,
            harmonies: HARMONY_REPOSITORY,
            layer: EMPTY_LAYER,
          };
          const { output: plan, carried: next } = planner.advance(env, carried, null);
          carried = next;
          if (plan.section.song?.at === 0 && index > 0) break;
          if (plan.rhythmFragment !== undefined) played.rhythm.add(plan.rhythmFragment);
          if (carried.bassFragment !== null) played.bass.add(carried.bassFragment);
          if (carried.leadFragment !== null) played.lead.add(carried.leadFragment);
        }
        for (const [member, ids] of Object.entries(played))
          expect(ids.size, `${preset.name} ${seed} ${member}: ${[...ids]}`).toBeLessThanOrEqual(1);
      }
  });
});
