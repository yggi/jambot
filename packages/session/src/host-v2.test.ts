import { describe, expect, it } from 'vitest';
import hub from '../fixtures/contracts/session.json';
import {
  type FragmentLedger,
  type HostScore,
  conductOf,
  fragmentsLacked,
  hostScoreOf,
  ledgerOf,
  scoreFor,
} from './host-v2.ts';
import { scoresInForce } from './follow-v2.ts';
import type { SentBar } from './host.ts';
import { type FragmentText, readHostMessage } from './protocol.ts';

/** A vector's message of the contract, by its name. */
const vectorOf = (name: string) =>
  hub.vectors.find((v) => v.name === name)!.message as Record<string, unknown>;

/**
 * The bar the contract's run composed, with where it starts: the one its conduct vector is made from, which the
 * contract carries in a vector of a kind no client reads (`bar`).
 */
const RUN_BAR = vectorOf('bar, version 1’s, to a client of version 2').sent as SentBar;

const RIFF: FragmentText = { id: 'muse_riff_1', hash: 'e2:1', text: '&muse_riff_1 0 2 4 2' };
const MOTIF: FragmentText = { id: 'muse_motif_2', hash: 'e2:2', text: '&muse_motif_2 0 1' };

/** A score of `bars` bars from `bar`, its digests named by `tag`, filing what it is given. */
const score = (bar: number, bars: number, tag = 'a', filed: FragmentText[] = []): HostScore => ({
  bar,
  step: bar * 16,
  section: 'groove',
  text: '* from band',
  unstated: null,
  lock: filed.map(({ id, hash }) => ({ id, hash })),
  filed,
  energy: Array<number>(bars).fill(0.5),
  foreseen: Array.from({ length: bars }, (_, i) => `${tag}${bar + i}`),
  cut: [],
});

describe("a host's conduct (#553)", () => {
  it('is the contract’s, from the bar its run composed', () => {
    const { kind, ...conduct } = vectorOf('conduct');
    expect(kind).toBe('conduct');
    expect(conductOf(RUN_BAR, conduct.foreseen as string)).toEqual(conduct);
  });

  it('carries no start for a bar the head passed without laying', () => {
    const message = { kind: 'conduct', ...conductOf({ ...RUN_BAR, start: null }, 'd0') };
    expect(readHostMessage(message)).toEqual(message);
  });
});

describe("a host's score (#553)", () => {
  const bars = [0.4, 0.6].map((barEnergy) => ({
    plan: { section: { type: 'build' } },
    barEnergy,
  })) as never;

  it('takes its type from its first bar and an energy for each, and reads as a host’s message', () => {
    const stated = {
      text: '* from band',
      unstated: null,
      lock: [{ id: 'styles', hash: 'e2:s' }, RIFF].map(({ id, hash }) => ({ id, hash })),
      filed: [RIFF],
      foreseen: ['d8', 'd9'],
      cut: [1],
    };
    const hosted = hostScoreOf(8, 128, stated, bars);
    expect(hosted.section).toBe('build');
    expect(hosted.energy).toEqual([0.4, 0.6]);
    const message = { kind: 'score', ...scoreFor(hosted, [RIFF]) };
    expect(readHostMessage(message)).toEqual(message);
    expect(message).not.toHaveProperty('filed');
    expect(message.fragments).toEqual([RIFF]);
  });
});

describe("a host's ledger of fragments sent (#553)", () => {
  it('sends a client each fragment once by hash, and another client its own', () => {
    let ledger: FragmentLedger = {};
    const sent = (seat: string, filed: FragmentText[]) => {
      const lacked = fragmentsLacked(ledger, seat, filed);
      ledger = lacked.ledger;
      return lacked.fragments;
    };
    expect(sent('c0', [RIFF, RIFF])).toEqual([RIFF]);
    expect(sent('c0', [RIFF])).toEqual([]);
    expect(sent('c0', [MOTIF, RIFF])).toEqual([MOTIF]);
    // The same text under another id is one the client holds: the hash says.
    expect(sent('c0', [{ ...RIFF, id: 'muse_riff_9' }])).toEqual([]);
    expect(sent('c1', [RIFF])).toEqual([RIFF]);
    expect(ledger).toEqual({ c0: ['e2:1', 'e2:2'], c1: ['e2:1'] });
  });

  it('keeps the ledger of the seats held, and forgets a seat freed', () => {
    const ledger = { c0: ['e2:1'], c1: ['e2:2'] };
    expect(ledgerOf(ledger, ['c1', 'c2'])).toEqual({ c1: ['e2:2'] });
  });
});

describe('the scores in force, as a welcome carries them', () => {
  it('are those that are the latest to state a bar not yet played, in the order stated', () => {
    const first = score(0, 8);
    const ahead = score(8, 8);
    const again = score(12, 4, 'b');
    const runs = [score(16, 2, 'c'), score(18, 6, 'd')];
    const scores = [first, ahead, again, ...runs];
    expect(scoresInForce(scores, 5)).toEqual(scores);
    expect(scoresInForce(scores, 8)).toEqual([ahead, again, ...runs]);
    // Bars 12 to 15 are stated again: the score before them is in force for 8 to 11 alone.
    expect(scoresInForce(scores, 12)).toEqual([again, ...runs]);
    expect(scoresInForce(scores, 18)).toEqual([runs[1]]);
    expect(scoresInForce(scores, 24)).toEqual([]);
  });
});
