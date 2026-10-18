/**
 * E37: the composer asks the repository for its rhythm while the radio
 * walks (#397, step 2; E34's walk, E36's ruling).
 *
 * As E34: the radio tuned in at each preset's point at entropy 0.3 walks on
 * its own for `HOURS` hours of music, each section's style glided to over
 * `PRESET_GLIDE`, and the band decides every bar with no meter asked for,
 * now with cells' rhythms too (`RHYTHM_REPOSITORY`), so each section's plan
 * says the meter the composer found and the rhythm, and its clave, that fit
 * it (`composedRhythm`). Over every preset and `SEEDS` seeds it counts:
 *
 * - each change of the section's rhythm (its fragment or its clave): the bar
 *   it falls on, which must be a section's first, and how many go back, at
 *   the next section's start, to the rhythm just left;
 * - the sections where the composer finds no rhythm, and the drummer
 *   invents: the fit refusing every one (a meter other than a 4/4), or the
 *   nearest past `RHYTHM_MISS`;
 * - the share of sections each rhythm plays.
 *
 * It runs under vitest: `E37_REPORT=1 pnpm vitest run --silent=false
 * packages/engine/experiments/rhythm-radio.test.ts` prints the numbers.
 */

import { beatsOf } from '@jambot/theory';
import {
  type BandCarried,
  type BandEnv,
  type Plan,
  PRESETS,
  PRESET_GLIDE,
  RADIO,
  RHYTHM_REPOSITORY,
  type RhythmRepository,
  SECTION_BARS,
  STRAIGHT,
  type Style,
  type StyleTrack,
  band,
  clockOf,
  glideTo,
  holding,
  lookAhead,
  styleAt,
  walkRadio,
} from '../src/index.ts';
import { METER_REPOSITORY } from '../src/repository.ts';

export const HOURS = 1;
export const SEEDS = 5;
export const ENTROPY = 0.3;

const range = (n: number) => [...Array(n).keys()];

/** A section's rhythm as a change is counted: its fragment and its clave. */
const rhythmKey = (plan: Plan) => `${plan.rhythmFragment ?? '-'} + ${plan.claveFragment ?? '-'}`;

/** One change of rhythm: the bar it falls on, the section, from and to. */
export interface RhythmChange {
  readonly bar: number;
  readonly section: number;
  readonly from: string;
  readonly to: string;
}

/** One run: the radio tuned in at a preset, for `HOURS` hours of music. */
export interface RhythmRun {
  readonly preset: string;
  readonly seed: number;
  readonly sections: number;
  readonly changes: readonly RhythmChange[];
  /** The sections where no rhythm was found, by why: the fit refused every one, or the nearest lay past the distance. */
  readonly missed: { readonly fit: number; readonly distance: number };
  /** Sections each rhythm played. */
  readonly played: Readonly<Record<string, number>>;
}

/** The radio tuned in at a preset, the band deciding each bar with the composer asking for meter and rhythm. */
export function rhythmRun(
  preset: (typeof PRESETS)[number],
  seed: number,
  hours = HOURS,
  margins?: RhythmRepository['margins'],
): RhythmRun {
  const rhythms: RhythmRepository = { ...RHYTHM_REPOSITORY, ...(margins ? { margins } : {}) };
  let style: Style = { ...preset.style, entropy: ENTROPY };
  let track: StyleTrack = holding(style);
  let walked = 0;
  const bpms: number[] = [];
  const envAt = (bar: number, clock: ReturnType<typeof clockOf>): BandEnv => {
    const section = Math.floor(bar / SECTION_BARS);
    while (walked < section) {
      walked++;
      style = walkRadio(style, seed, walked, RADIO);
      track = glideTo(track, style, clock.barStart(walked * SECTION_BARS), PRESET_GLIDE);
    }
    const played = styleAt(track, clock.barStart(bar));
    bpms[bar] = played.bpm;
    return {
      seed,
      bar,
      style: played,
      wish: { tonic: null, mode: preset.mode, melodic: null },
      swing: STRAIGHT,
      repository: METER_REPOSITORY,
      rhythms,
      offer: null,
    };
  };
  const decided = lookAhead(band.initial as BandCarried, envAt, Math.ceil((hours * 60 * 180) / 2));
  const changes: RhythmChange[] = [];
  const played: Record<string, number> = {};
  const missed = { fit: 0, distance: 0 };
  let minute = 0;
  let sections = 0;
  for (const [i, d] of decided.entries()) {
    if (minute >= hours * 60) break;
    const before = decided[i - 1];
    if (before && rhythmKey(before.plan) !== rhythmKey(d.plan))
      changes.push({
        bar: d.bar,
        section: Math.floor(d.bar / SECTION_BARS),
        from: rhythmKey(before.plan),
        to: rhythmKey(d.plan),
      });
    if (d.bar % SECTION_BARS === 0) {
      sections++;
      const key = rhythmKey(d.plan);
      played[key] = (played[key] ?? 0) + 1;
      if (d.plan.rhythmFragment === undefined) {
        const bench = { meter: d.plan.meter, meterFragment: d.plan.meterFragment };
        // whatever the point, the query lists every rhythm that fits the bench: none is the fit refusing
        if (rhythms.query({ energy: 0 }, bench).length === 0) missed.fit++;
        else missed.distance++;
      }
    }
    minute += beatsOf(d.plan.meter) / bpms[d.bar]!;
  }
  return { preset: preset.name, seed, sections, changes, missed, played };
}

/** Every preset, `seeds` seeds each, each run its own seed as E34's are. */
export const rhythmRuns = (
  seeds = SEEDS,
  hours = HOURS,
  margins?: RhythmRepository['margins'],
): RhythmRun[] =>
  PRESETS.flatMap((preset, p) =>
    range(seeds).map((seed) => rhythmRun(preset, p * seeds + seed + 1, hours, margins)),
  );

/** The changes that go back, at the next section's start, to the rhythm just left. */
export const wentBack = (run: RhythmRun): RhythmChange[] =>
  run.changes.filter((c, i) => {
    const next = run.changes[i + 1];
    return next !== undefined && next.section === c.section + 1 && next.to === c.from;
  });
