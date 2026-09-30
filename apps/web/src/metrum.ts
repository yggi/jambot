/**
 * The metrum as the screen reads it: the song's meter by name, the swing in
 * words, and the bar's steps where the band plays them. The bar is drawn as
 * every meter's is (`bar.ts`), on the song's, and is the bar heard: a mark
 * lands on the step the click sounds on (`clicksOf`, the engine's own
 * reading of the transport's steps, and `bar.test.ts` holds the two to each
 * other), through the same swing map, and nothing here decides a time of its
 * own.
 */

import { SONG_METER } from '@jambot/engine';
import { METERS } from '@jambot/theory';
import { barMarks as marksOf, eighthHeard as heardOf } from './bar.ts';
import type { Mark } from './components/Ruler.svelte';

/** The song's meter, by name: "4/4". */
export const METER_NAME: string = Object.entries(METERS).find(
  ([, meter]) => meter === SONG_METER,
)![0];

/** The song's bar, on a swing and the eighth heard now. */
export const barMarks = (swing: number, heard: number | null): Mark[] =>
  marksOf(SONG_METER, swing, heard);

/**
 * The eighth of the song's bar the step heard is in, from 0, or null before
 * anything is heard: what the bar's marks light, whether or not the click is
 * on, since it is the band that is heard.
 */
export const eighthHeard = (heard: number | null): number | null => heardOf(SONG_METER, heard);
