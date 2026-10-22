/**
 * The conductor turns what people do into the style track, and into the
 * meter's swing (#360): the level and share of the meter the repository
 * finds at a preset's point (`presetSwing`, #459), and those the Meter card
 * sets. The share glides as an axis does, over 8 bars from a
 * preset and one from the card; the level is asked for at once and taken
 * where the next section starts, as a meter is.
 *
 * While the band plays, a change glides from the next step to be scheduled,
 * so what has been scheduled stays as it is and nothing jumps: a preset over
 * eight bars, a slider over one. Tempo follows it from the next step and
 * swing from the next beat. The drums hear it from the next bar composed,
 * which is on the last beat of the bar before: within the rest of the bar
 * and a beat, at most 20 steps. While the band is stopped, a change is set
 * at once, and the next start plays from it.
 *
 * A preset also wishes for its mode, the one the repository finds at its
 * point (`presetMode`, #420), unless the wish is in that mode already, so a
 * key picked stays when a preset in its mode follows, as in the prototype;
 * a preset where the repository finds none leaves the wish as it is.
 * A key picked is wished for as it is, tonic and mode, and a
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
 * scale picked, within the scales the harmony reaches (`melodicWithin`).
 */

import {
  type Axis,
  INITIAL_KEY,
  type Key,
  type KeyWish,
  PRESET_GLIDE,
  type Preset,
  SECTION_BARS,
  SLIDER_GLIDE,
  type Style,
  type StyleTrack,
  METER_REPOSITORY,
  type MeterRepository,
  type MeterSwing,
  type SwingTrack,
  barStart,
  glideTo,
  holdingSwing,
  swingTarget,
  swingTo,
  holding,
  intoReach,
  type MelodicScale,
  licenceOf,
  melodicWithin,
  nudgedTempo,
  type ModeRepository,
  MODE_REPOSITORY,
  presetMode,
  presetSwing,
  tempoLicence,
  tempoNudgeWithin,
} from '@jambot/engine';

export type Intent =
  | { readonly kind: 'preset'; readonly preset: Preset }
  | { readonly kind: 'axis'; readonly axis: Axis; readonly value: number }
  /** What a key intent changes of the wish: a tonic and mode picked, or a melodic scale. */
  | { readonly kind: 'key'; readonly wish: Partial<KeyWish> }
  /** A nudge of the style's tempo, in octaves: 0 plays it as it is. */
  | { readonly kind: 'tempo'; readonly nudge: number }
  /** The meter's swing, from the Meter card: a level, a share, or both (#360). */
  | { readonly kind: 'swing'; readonly swing: Partial<MeterSwing> };

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
  if (intent.kind === 'key' || intent.kind === 'swing') return track;
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

/**
 * The meter's swing after an intent, gliding from step `at`, or set at once
 * when stopped (`null`): a preset's, the swing of the meter `repository`
 * finds at its point, over `PRESET_GLIDE`, and the card's over
 * `SLIDER_GLIDE`. The level is the one asked for, which the band takes where
 * the next section starts. A preset where the repository finds nothing
 * leaves the swing as it is, as the composer keeps its meter on a miss.
 */
export function conductSwing(
  swing: SwingTrack,
  intent: Intent,
  at: number | null,
  repository: MeterRepository = METER_REPOSITORY,
): SwingTrack {
  const target =
    intent.kind === 'preset'
      ? presetSwing(intent.preset, repository)
      : intent.kind === 'swing'
        ? intent.swing
        : null;
  if (target === null) return swing;
  if (at === null) return swingTo(swing, target, 0, 0);
  return swingTo(swing, target, at, intent.kind === 'preset' ? PRESET_GLIDE : SLIDER_GLIDE);
}

/** The radio's glide: one section, so each walk's style is reached as the next section starts. */
export const RADIO_GLIDE = barStart(SECTION_BARS);

/**
 * Where the radio is: the style the track is going to, as the layer above
 * sets it, the players' tempo nudge taken back out. The radio carries no
 * style of its own (`station.ts`), so a slider a player moved has moved it.
 */
export const radioStyle = (track: StyleTrack, nudge: number): Style =>
  unnudged(targetOf(track), nudge);

/**
 * The track after one section of the radio's walk: every axis gliding from
 * step `at` over a section to `style`, the walk's next style, so nothing
 * jumps. The tempo played is the style's times the players' nudge, which
 * stays within the new style's licence: the nudge returned.
 */
export function conductRadio(
  track: StyleTrack,
  style: Style,
  at: number,
  nudge: number,
): { track: StyleTrack; nudge: number } {
  const held = tempoNudgeWithin(nudge, style);
  return {
    track: glideTo(track, { ...style, bpm: nudgedTempo(style, held) }, at, RADIO_GLIDE),
    nudge: held,
  };
}

/**
 * Whether an intent takes the track from the radio: a preset, or an axis the
 * walk moves. Energy and entropy are the dials the radio is run by (the
 * owner, #313), and the tempo, key and swing are nudges on top of it, so
 * they leave it on the air.
 */
export function takesFromRadio(intent: Intent): boolean {
  if (intent.kind === 'preset') return true;
  return intent.kind === 'axis' && intent.axis !== 'energy' && intent.axis !== 'entropy';
}

/** The meter's swing a stopped band keeps: where it was going, held. */
export const stopSwing = (swing: SwingTrack): SwingTrack => holdingSwing(swingTarget(swing));

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
 * preset's mode from any tonic, the one `repository` finds at its point,
 * the rest of the wish as it was; a tonic held
 * within the reach that the style after the intent leaves (`licenceOf`) of
 * `home`: the plan's key, the one the band is heading for, which is the key
 * the song opens in before anything is decided; and a melodic scale
 * within the scales that style reaches. A wish nothing changes is the same.
 */
export function wishAfter(
  wish: KeyWish,
  intent: Intent,
  style: Style,
  home: Key = INITIAL_KEY,
  repository: ModeRepository = MODE_REPOSITORY,
): KeyWish {
  const mode = intent.kind === 'preset' ? presetMode(intent.preset, repository) : null;
  const next: KeyWish =
    intent.kind === 'key'
      ? { ...wish, ...intent.wish }
      : mode !== null && mode !== wish.mode
        ? { ...wish, tonic: null, mode }
        : wish;
  const { keyReach } = licenceOf(style);
  const tonic =
    next.tonic === null
      ? null
      : intoReach({ tonic: next.tonic, mode: next.mode }, home, keyReach).tonic;
  const melodic = next.melodic === null ? null : melodicWithin(next.melodic, style);
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
