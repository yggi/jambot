/**
 * Which screen the page shows: the door (the lobby, where a person picks
 * how to play), the band behind it, the timing test (#204, H7) and the
 * metronome (#259) that the door leads to, or the moment between, while a session kept from before is
 * taken up again.
 *
 * It follows what the domain says and holds no state of its own: a host is
 * in the band, and so is a client that has joined, or that lost its link
 * and is trying again, since it plays what it has. A client still joining
 * stays at the door, which shows that it is busy and, if the join fails,
 * why. Solo isn't a session, so the page holds a choice for it: it isn't
 * kept, and a page that reloads from solo lands on the door. The timing test
 * and the metronome are the same: a choice the page holds, for a person on
 * their own, and a session that starts takes its place.
 */

import type { Mode } from './player.svelte.ts';
import type { ClientStatus } from './session/client.svelte.ts';

export type Screen = 'door' | 'restoring' | 'band' | 'timing' | 'meter';

export interface ScreenState {
  readonly mode: Mode;
  readonly clientStatus: ClientStatus;
  /** A session kept from before is being taken up again. */
  readonly restoring: boolean;
  /** The person chose to play solo. */
  readonly soloChosen: boolean;
  /** The person chose the timing test. */
  readonly timingChosen: boolean;
  /** The person chose the metronome. */
  readonly meterChosen: boolean;
}

export function screenOf({
  mode,
  clientStatus,
  restoring,
  soloChosen,
  timingChosen,
  meterChosen,
}: ScreenState): Screen {
  if (restoring) return 'restoring';
  if (timingChosen && mode === 'solo') return 'timing';
  if (meterChosen && mode === 'solo') return 'meter';
  if (mode === 'host') return 'band';
  if (mode === 'client')
    return clientStatus === 'joined' || clientStatus === 'reconnecting' ? 'band' : 'door';
  return soloChosen ? 'band' : 'door';
}
