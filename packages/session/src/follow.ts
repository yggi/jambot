/**
 * A client's band: it plays the bars a host sent.
 *
 * The follower is a source of bars for the transport (`BarSource`). Bars
 * arrive as the host composes them, a beat before they start, and wait in
 * an inbox. The follower gives each as the transport lays its first step,
 * not a beat ahead as the band composes, which leaves the host's beat for
 * the bar to arrive. It plays the bar through `playBar`, as the host's band
 * does, so its notes are the host's: its instruments and its synth are its
 * own. It starts the bar where the host said it starts, so tempo glides
 * that reached it late don't leave it behind.
 *
 * A bar that has not arrived when its first step is laid is lacked, and the
 * transport passes it: the clock doesn't wait for the network.
 */

import { type BarSource, SONG_METER, playBar } from '@jambot/engine';
import type { SentBar } from './protocol.ts';

export interface FollowCarried {
  /** Bars sent and not played yet, in order. */
  readonly inbox: readonly SentBar[];
  /** How many bars had not arrived when they were due. */
  readonly lacked: number;
}

const after = (inbox: readonly SentBar[], bar: number) => inbox.filter((s) => s.bar.bar > bar);

export const followSource: BarSource<FollowCarried, SentBar> = {
  initial: { inbox: [], lacked: 0 },
  ahead: 0,
  receive(carried, arrived) {
    if (arrived.length === 0) return carried;
    const byBar = new Map(carried.inbox.map((s) => [s.bar.bar, s]));
    for (const s of arrived) byBar.set(s.bar.bar, s);
    return { ...carried, inbox: [...byBar.values()].sort((a, b) => a.bar.bar - b.bar.bar) };
  },
  compose(env, { inbox, lacked }) {
    const sent = inbox.find((s) => s.bar.bar === env.bar);
    const rest = after(inbox, env.bar);
    if (!sent) return { carried: { inbox: rest, lacked: lacked + 1 }, bar: null };
    const { written, ...bar } = sent.bar;
    const played = {
      carried: { inbox: rest, lacked },
      bar: playBar({ ...bar, meter: SONG_METER }, written),
    };
    return sent.start === null ? played : { ...played, start: sent.start };
  },
  pass: (env, carried) => ({ ...carried, inbox: after(carried.inbox, env.bar) }),
};
