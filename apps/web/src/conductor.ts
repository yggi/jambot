/**
 * The conductor turns what people do into the style track.
 *
 * While the band plays, a change glides from the next step to be scheduled,
 * so what has been scheduled stays as it is and nothing jumps: a preset over
 * eight bars, a slider over one. Tempo follows it from the next step and
 * swing from the next beat. The drums hear it from the next bar composed,
 * which is on the last beat of the bar before: within the rest of the bar
 * and a beat, at most 20 steps. While the band is stopped, a change is set
 * at once, and the next start plays from it.
 */

import {
  type Axis,
  PRESET_GLIDE,
  type Preset,
  SLIDER_GLIDE,
  type StyleTrack,
  glideTo,
  holding,
  styleAt,
} from '@jambot/engine';

export type Intent =
  | { readonly kind: 'preset'; readonly preset: Preset }
  | { readonly kind: 'axis'; readonly axis: Axis; readonly value: number };

/** The track after an intent, gliding from step `at`, or set at once when stopped (`null`). */
export function conduct(track: StyleTrack, intent: Intent, at: number | null): StyleTrack {
  const targets = intent.kind === 'preset' ? intent.preset.style : { [intent.axis]: intent.value };
  if (at === null) return glideTo(track, targets, 0, 0);
  return glideTo(track, targets, at, intent.kind === 'preset' ? PRESET_GLIDE : SLIDER_GLIDE);
}

/** The track a stopped band keeps: the style where it stopped, held from step 0. */
export function stopAt(track: StyleTrack, position: number): StyleTrack {
  return holding(styleAt(track, position));
}
