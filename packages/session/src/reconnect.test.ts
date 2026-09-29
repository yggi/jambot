import { describe, expect, it } from 'vitest';
import { RECONNECT, failed, outage, retry, stale, woken } from './reconnect.ts';

describe('reconnecting a client', () => {
  it('retries at once for the first try, then slower up to a cap', () => {
    let o = outage(100);
    const waits: number[] = [];
    for (let i = 0; i < 9; i++) {
      const r = retry(o, 100);
      if (r.kind !== 'wait') throw new Error('gave up early');
      waits.push(r.seconds);
      o = failed(o);
    }
    expect(waits).toEqual([0.25, 0.5, 1, 2, 4, 4, 4, 4, 4]);
  });

  it('gives up exactly when the window has passed, and never before', () => {
    const o = outage(10);
    expect(retry(o, 10 + RECONNECT.window - 0.001).kind).toBe('wait');
    expect(retry(o, 10 + RECONNECT.window).kind).toBe('give-up');
    expect(retry(failed(failed(o)), 10 + RECONNECT.window + 5).kind).toBe('give-up');
  });

  it('makes the last try at the window’s end, not after it', () => {
    let o = outage(0);
    for (let i = 0; i < 20; i++) o = failed(o);
    expect(retry(o, RECONNECT.window - 1)).toEqual({ kind: 'wait', seconds: 1 });
    expect(retry(o, RECONNECT.window - 10)).toEqual({ kind: 'wait', seconds: 4 });
  });

  it('starts again on a wake: the time a page slept through is no outage of the host’s', () => {
    const o = failed(failed(failed(outage(0))));
    expect(retry(o, 3600).kind).toBe('give-up');
    const awake = woken(3600);
    expect(awake).toEqual(outage(3600));
    expect(retry(awake, 3600)).toEqual({ kind: 'wait', seconds: RECONNECT.delays[0] });
  });

  it('takes a link for dead when nothing came back for longer than the limit', () => {
    expect(stale(null, 50)).toBe(false);
    expect(stale(50, 50 + RECONNECT.stale)).toBe(false);
    expect(stale(50, 50 + RECONNECT.stale + 0.001)).toBe(true);
    // A sleep is a silence like any other.
    expect(stale(50, 3650)).toBe(true);
  });
});
