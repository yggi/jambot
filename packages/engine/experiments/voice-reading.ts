/**
 * E26: one voice of the band read alone (#15, step 4).
 *
 * `readVoice` reads the drums, the bass, the comp (pad and stab) and the lead
 * each from its own notes. Three questions, over the presets held, 5 seeds of
 * 32 bars, against landmarks that are where each voice reads at each preset
 * (the mean over 5 other seeds, so no bar is read against itself):
 *
 * - `distance`: how far a voice's bar lies from its own preset's landmark;
 * - `recognised`: how often the nearest of the eight presets' landmarks,
 *   for that voice alone, is the preset that wrote the bar: what the voice
 *   says of the style by itself;
 * - the drums' fill: the bars in which the drummer fills (a `fill` hit
 *   written), against the others: how far the fill lies from the style of
 *   the drums, which is what licence feedback would read.
 *
 * node --experimental-strip-types --no-warnings packages/engine/experiments/voice-reading.ts
 */

import { fileURLToPath } from 'node:url';
import {
  PROTOTYPE_PRESETS,
  type VoiceLandmark,
  type VoiceReading,
  VOICES,
  type Voice,
  band,
  partDistance,
  readVoice,
  presetSwing,
} from '../src/index.ts';
import { SEEDS } from './style-readback.ts';

const range = (n: number) => [...Array(n).keys()];
const mean = (xs: readonly number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

const LANDMARK_SEEDS = [11, 12, 13, 14, 15];
const AXES = ['density', 'sync', 'artic', 'harm'] as const;

/** One composed bar: its voices read, and whether the drummer fills in it. */
export interface VoiceBar {
  readonly preset: string;
  readonly readings: Readonly<Record<Voice, VoiceReading>>;
  readonly fill: boolean;
}

export function voiceBars(
  preset: (typeof PROTOTYPE_PRESETS)[number],
  seeds: readonly number[],
  bars: number,
): VoiceBar[] {
  return seeds.flatMap((seed) => {
    let carried = band.initial;
    return range(bars).map((bar) => {
      const out = band.advance(
        {
          seed,
          bar,
          style: { ...preset.style, entropy: 0.3 },
          swing: presetSwing(preset)!,
          wish: { tonic: null, mode: 'aeolian', melodic: null },
          offer: null,
        },
        carried,
        null,
      );
      carried = out.carried;
      const dough = out.output.dough;
      return {
        preset: preset.name,
        readings: Object.fromEntries(VOICES.map((v) => [v, readVoice(v, dough)])) as Record<
          Voice,
          VoiceReading
        >,
        fill: dough.some((n) => n.role === 'fill'),
      };
    });
  });
}

/** Where each voice reads at each preset: the mean of every axis it has. */
export function voiceLandmarks(bars = 32): Record<string, Record<Voice, VoiceLandmark>> {
  return Object.fromEntries(
    PROTOTYPE_PRESETS.map((preset) => {
      const set = voiceBars(preset, LANDMARK_SEEDS, bars);
      return [
        preset.name,
        Object.fromEntries(
          VOICES.map((voice) => [
            voice,
            Object.fromEntries(
              AXES.flatMap((axis) => {
                const xs = set.flatMap((b) =>
                  b.readings[voice][axis] === undefined ? [] : [b.readings[voice][axis]!],
                );
                return xs.length ? [[axis, mean(xs)]] : [];
              }),
            ),
          ]),
        ),
      ];
    }),
  ) as Record<string, Record<Voice, VoiceLandmark>>;
}

export interface VoiceResult {
  readonly voice: Voice;
  /** The mean distance of the voice's bars from their preset's landmark. */
  readonly distance: number;
  /** The share of bars whose nearest landmark, for this voice alone, is their preset's. */
  readonly recognised: number;
}

export interface FillResult {
  readonly fills: number;
  readonly bars: number;
  /** The mean distance of the drums from their landmark in bars with a fill, and in bars without. */
  readonly withFill: number;
  readonly without: number;
  /** The chance that a bar with a fill lies farther from the drums' landmark than one without (0.5: no better than chance). */
  readonly farther: number;
}

export function voiceResults(bars = 32): { voices: VoiceResult[]; fill: FillResult } {
  const landmarks = voiceLandmarks(bars);
  const all = PROTOTYPE_PRESETS.flatMap((preset) => voiceBars(preset, SEEDS, bars));
  const nearest = (voice: Voice, reading: VoiceReading) =>
    PROTOTYPE_PRESETS.map((p) => p.name).reduce((a, b) =>
      partDistance(reading, landmarks[b]![voice]) < partDistance(reading, landmarks[a]![voice])
        ? b
        : a,
    );
  const voices = VOICES.map((voice) => ({
    voice,
    distance: mean(all.map((b) => partDistance(b.readings[voice], landmarks[b.preset]![voice]))),
    recognised: mean(all.map((b) => (nearest(voice, b.readings[voice]) === b.preset ? 1 : 0))),
  }));
  const drums = (filled: boolean) =>
    all
      .filter((b) => b.fill === filled)
      .map((b) => partDistance(b.readings.drums, landmarks[b.preset]!.drums));
  const [filled, plain] = [drums(true), drums(false)];
  let wins = 0;
  for (const a of filled) for (const b of plain) wins += a > b ? 1 : a === b ? 0.5 : 0;
  return {
    voices,
    fill: {
      farther: wins / (filled.length * plain.length),
      fills: all.filter((b) => b.fill).length,
      bars: all.length,
      withFill: mean(filled),
      without: mean(plain),
    },
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { voices, fill } = voiceResults();
  for (const v of voices)
    console.log(
      `  ${v.voice.padEnd(6)} distance=${v.distance.toFixed(3)} recognised=${v.recognised.toFixed(2)}`,
    );
  console.log(
    `  drums: ${fill.fills} of ${fill.bars} bars fill; distance ${fill.withFill.toFixed(3)} with, ${fill.without.toFixed(3)} without, farther ${fill.farther.toFixed(2)}`,
  );
}
