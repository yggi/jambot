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
 *
 * A preset also wishes for its mode. The band moves its key toward the wish
 * at the next section it plans (`nextKey`), so a new key never cuts into
 * a section.
 */

import {
  type Axis,
  type KeyWish,
  PRESET_GLIDE,
  type Preset,
  SLIDER_GLIDE,
  type Style,
  type StyleTrack,
  glideTo,
  holding,
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

/** The key wished for after an intent: a preset's mode, from any tonic. */
export function wishAfter(wish: KeyWish, intent: Intent): KeyWish {
  return intent.kind === 'preset' ? { tonic: null, mode: intent.preset.mode } : wish;
}

/**
 * The track a stopped band keeps: where every axis was going, held from
 * step 0. So a preset chosen just before a stop is what the next start
 * plays, and what the page shows as chosen.
 */
export function stopAt(track: StyleTrack): StyleTrack {
  return holding(
    Object.fromEntries(Object.entries(track).map(([axis, glide]) => [axis, glide.to])) as Style,
  );
}
