/**
 * What every part reads for one bar: the environment of the bar level.
 */

import type { BarChord } from './chords.ts';
import type { Offer } from './muse.ts';
import type { Plan } from './plan.ts';
import type { Style } from './style.ts';

export interface BarEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The plan of the section the bar is in: its section, key and theme, held for its eight bars. */
  readonly plan: Plan;
  /** 0 to 7. */
  readonly barInSection: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /** The energy the bar plays at: the style's, shaped by its section (`barEnergy`). */
  readonly barEnergy: number;
  /** The bar's chords. */
  readonly chords: readonly BarChord[];
  /** The next bar's chords, decided with this bar's, so a part can lead into them. */
  readonly next: readonly BarChord[];
  /** The motif the Muse offers, which the lead settles on while it stands (#79). */
  readonly offer: Offer | null;
}
