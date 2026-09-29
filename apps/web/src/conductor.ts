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
 * A preset also wishes for its mode, unless the wish is in that mode
 * already, so a key picked stays when a preset in its mode follows, as in
 * the prototype. A key picked is wished for as it is, tonic and mode, and a
 * melodic scale picked beside it (#209): a key intent names what it changes
 * of the wish, and the rest stands. The band moves its key toward the wish,
 * and takes its melodic scale, at the next section it plans (`nextKey`,
 * `planner`), so neither cuts into a section.
 *
 * The players don't select the tempo or the key; they nudge a default the
 * layer above sets, within the licence it leaves (`licenceOf`). The licence
 * is read from where the style is going after the intent (`styleAfter`), so
 * a preset or a slider that narrows it takes the nudge and the key wish back
 * within it at once. The style sets the tempo, and a nudge is a ratio of it,
 * held within the reach the entropy gives: a preset brings its own tempo,
 * and the nudge carries over to it. The track holds the tempo played, the
 * style's times the nudge, so the transport, the score and a session's
 * clients read one tempo; `baseTempo` reads the style's own back out of it.
 * A key picked is held within the reach the harmony gives of the home key,
 * the centre of the band's harmonic history, a fifth at a time; a melodic
 * scale picked stands where the style reaches it, and gives way to the
 * style's own default where it doesn't (`melodicWithin`).
 */

import {
  type Axis,
  INITIAL_KEY,
  type Key,
  type KeyWish,
  PRESET_GLIDE,
  type Preset,
  SLIDER_GLIDE,
  type Style,
  type StyleTrack,
  glideTo,
  holding,
  intoReach,
  type MelodicScale,
  licenceOf,
  melodicWithin,
  nudgedTempo,
  tempoLicence,
  tempoNudgeWithin,
} from '@jambot/engine';

export type Intent =
  | { readonly kind: 'preset'; readonly preset: Preset }
  | { readonly kind: 'axis'; readonly axis: Axis; readonly value: number }
  /** What a key intent changes of the wish: a tonic and mode picked, or a melodic scale. */
  | { readonly kind: 'key'; readonly wish: Partial<KeyWish> }
  /** A nudge of the style's tempo, in octaves: 0 plays it as it is. */
  | { readonly kind: 'tempo'; readonly nudge: number };

/** Where each axis of a track is going. */
export const targetOf = (track: StyleTrack): Style =>
  Object.fromEntries(Object.entries(track).map(([axis, glide]) => [axis, glide.to])) as Style;

/**
 * A style as the layer above set it: the players' tempo nudge taken back out
 * of the tempo played, to a millionth of a beat per minute, so a preset's
 * tempo reads back exactly.
 */
export function unnudged(style: Style, nudge: number): Style {
  return { ...style, bpm: Math.round((style.bpm / 2 ** nudge) * 1e6) / 1e6 };
}

/** The style's own tempo under a track. */
export function baseTempo(track: StyleTrack, nudge: number): number {
  return unnudged(targetOf(track), nudge).bpm;
}

/**
 * The track after an intent, gliding from step `at`, or set at once when
 * stopped (`null`). `nudge` is the players' tempo nudge before the intent;
 * the tempo played is the style's times the nudge after it (`nudgeAfter`).
 */
export function conduct(
  track: StyleTrack,
  intent: Intent,
  at: number | null,
  nudge = 0,
): StyleTrack {
  if (intent.kind === 'key') return track;
  const style = styleAfter(track, intent, nudge);
  const targets = targetsOf(intent);
  const after = nudgeAfter(nudge, intent, style);
  // Only what moves the tempo glides it: a slider elsewhere leaves a tempo
  // glide under way as it is.
  const moved = 'bpm' in targets || intent.kind === 'tempo' || after !== nudge;
  const all = moved ? { ...targets, bpm: nudgedTempo(style, after) } : targets;
  if (at === null) return glideTo(track, all, 0, 0);
  return glideTo(track, all, at, intent.kind === 'preset' ? PRESET_GLIDE : SLIDER_GLIDE);
}

/** The axes an intent sets. */
function targetsOf(intent: Intent): Partial<Style> {
  if (intent.kind === 'preset') return { ...intent.preset.style };
  if (intent.kind === 'axis') return { [intent.axis]: intent.value };
  return {};
}

/**
 * Where the style is going after an intent, as the layer above sets it:
 * the track's targets with the intent's own, and the style's own tempo, a
 * preset's, one set on the tempo axis, or the one before, unnudged. Its
 * licence is the one the players nudge within.
 */
export function styleAfter(track: StyleTrack, intent: Intent, nudge: number): Style {
  return { ...unnudged(targetOf(track), nudge), ...targetsOf(intent) };
}

/** The players' tempo nudge after an intent, held within the licence of the style after it. */
export function nudgeAfter(nudge: number, intent: Intent, style: Style): number {
  return tempoNudgeWithin(intent.kind === 'tempo' ? intent.nudge : nudge, style);
}

/**
 * The key wished for after an intent: what a key intent picks, or a
 * preset's mode from any tonic, the rest of the wish as it was; a tonic held
 * within the reach that the style after the intent leaves (`licenceOf`) of
 * `home`: the band's harmonic history's centre (`centre`, #169), which is
 * the key the song opens in before anything is heard; and a melodic scale
 * where that style reaches it, else none, the style's default. A wish
 * nothing changes is the same.
 */
export function wishAfter(
  wish: KeyWish,
  intent: Intent,
  style: Style,
  home: Key = INITIAL_KEY,
): KeyWish {
  const next: KeyWish =
    intent.kind === 'key'
      ? { ...wish, ...intent.wish }
      : intent.kind === 'preset' && intent.preset.mode !== wish.mode
        ? { ...wish, tonic: null, mode: intent.preset.mode }
        : wish;
  const { keyReach } = licenceOf(style);
  const tonic =
    next.tonic === null
      ? null
      : intoReach({ tonic: next.tonic, mode: next.mode }, home, keyReach).tonic;
  const melodic = melodicWithin(next.melodic, style);
  return tonic === next.tonic && melodic === next.melodic ? next : { ...next, tonic, melodic };
}

/** The tempo as the players see it: played, the style's own, the nudge, and its licence. */
export interface TempoView {
  readonly bpm: number;
  readonly base: number;
  readonly nudge: number;
  /** How far the nudge may go, in octaves each way (`tempoLicence`). */
  readonly low: number;
  readonly high: number;
}

export function tempoView(track: StyleTrack, nudge: number): TempoView {
  const style = unnudged(targetOf(track), nudge);
  return { bpm: track.bpm.to, base: style.bpm, nudge, ...tempoLicence(style) };
}

/** How many fifths from the home key the players may take the key, where the style is going. */
export function keyReachOf(track: StyleTrack): number {
  return licenceOf(targetOf(track)).keyReach;
}

/** The melodic scales the players may pick, where the style is going (#209). */
export function melodicReachOf(track: StyleTrack): readonly MelodicScale[] {
  return licenceOf(targetOf(track)).melodic;
}

/**
 * The track a stopped band keeps: where every axis was going, held from
 * step 0. So a preset chosen just before a stop is what the next start
 * plays, and what the page shows as chosen.
 */
export function stopAt(track: StyleTrack): StyleTrack {
  return holding(targetOf(track));
}
