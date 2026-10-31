/**
 * What every part reads for one bar: the environment of the bar level.
 */

import type { Meter } from '@jambot/theory';
import type { BarChord } from './chords.ts';
import type { Offer } from './muse.ts';
import type { Plan } from './plan.ts';
import type { Style } from './style.ts';
import type { MeterSwing } from './swing.ts';

export interface BarEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /**
   * The meter the bar is in, whose steps it has (`stepsOf`): 16 in 4/4. The band
   * gives the song's, 4/4, so far: a part reads its bar's steps from here as it
   * is put on the meter (#260, decision (k)), and until it is, writes 16.
   */
  readonly meter: Meter;
  /** The plan of the section the bar is in: its section, key and theme, held for its eight bars. */
  readonly plan: Plan;
  /** 0 to 7. */
  readonly barInSection: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /**
   * The meter's swing where the bar starts (#360): the plan's level, and the
   * share the swing track glides to there. The transport plays each beat by
   * the share where the beat starts; the parts read it here, the jazz band
   * from a meter swung on `8n` (`eighthSwing`).
   */
  readonly swing: MeterSwing;
  /** The energy the bar plays at: the style's, shaped by its section (`barEnergy`). */
  readonly barEnergy: number;
  /** The bar's chords. */
  readonly chords: readonly BarChord[];
  /** The next bar's chords, decided with this bar's, so a part can lead into them. */
  readonly next: readonly BarChord[];
  /** The motif the Muse offers, which the lead settles on while it stands (#79). */
  readonly offer: Offer | null;
  /** How restless the held parts play, 0 to 1: the chance they vary an even bar as their odd ones (`heldDraw`), from the homeostat's lean past entropy 1 (#536, `restlessOf`); none where absent. */
  readonly restless?: number | undefined;
}
