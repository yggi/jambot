/**
 * The metrum as the screen reads it: the song's meter by name, the swing in
 * words, and the bar's steps where the band plays them. The click is the
 * engine's own reading of the transport's steps (`clicksOf`), so the bar
 * drawn is the bar heard: a mark lands on the step the click sounds on,
 * through the same swing map, and nothing here decides a time of its own.
 */

import { BAR_STEPS, SONG_METER, clicksOf, soundsAt } from '@jambot/engine';
import { METERS } from '@jambot/theory';
import type { Mark } from './components/Ruler.svelte';

/** The song's meter, by name: "4/4". */
export const METER_NAME: string = Object.entries(METERS).find(
  ([, meter]) => meter === SONG_METER,
)![0];

/**
 * A mark on each step of the bar at the place it sounds under this swing.
 * The eighths are the click's, counted 1 & 2 & 3 & 4 &, the downbeat
 * accented and the eighths between the pulses lesser; the sixteenths
 * between them are faint, since they are the band's and not clicked, and
 * are where a light swing shows. `heard` is the eighth sounding now.
 */
export function barMarks(swing: number, heard: number | null): Mark[] {
  const bar = Array.from({ length: BAR_STEPS }, (_, step) => ({
    step,
    seconds: step,
    length: 1,
    swing,
  }));
  const clicks = new Map(clicksOf(bar).map((click) => [click.step, click]));
  return bar.map((laid) => {
    const click = clicks.get(laid.step);
    if (!click) return { at: soundsAt(laid), faint: true };
    return {
      at: click.seconds,
      text: click.weight === 'subdivision' ? '&' : String(click.pulse + 1),
      accent: click.weight === 'downbeat',
      minor: click.weight === 'subdivision',
      lit: click.eighth === heard,
    };
  });
}
