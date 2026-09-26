/**
 * What every part reads for one bar: the environment of the bar level.
 */

import type { Section } from './form.ts';
import type { Style } from './style.ts';

export interface BarEnv {
  readonly seed: number;
  /** Counted from the song's start. */
  readonly bar: number;
  /** The section the bar is in, held for its eight bars. */
  readonly section: Section;
  /** 0 to 7. */
  readonly barInSection: number;
  /** The style where the bar starts. */
  readonly style: Style;
  /** The energy the bar plays at: the style's, shaped by its section (`barEnergy`). */
  readonly barEnergy: number;
}
