import { describe, expect, it } from 'vitest';
import { LOG_KEPT, LOG_TAIL, said, tailOf } from './log.ts';
import { readHostMessage, type SessionEvent } from './protocol.ts';

const line = (n: number): SessionEvent => ({
  bar: n,
  who: 'conductor',
  what: 'moved',
  text: `The band leans at bar ${n}: energy 55 → 60 %, tempo 120 → 117 bpm.`,
});

describe("the session's log", () => {
  it(`keeps the last ${LOG_KEPT} lines, oldest first, and lets the oldest go`, () => {
    let log: SessionEvent[] = [];
    for (let n = 0; n < LOG_KEPT + 10; n++) log = said(log, line(n));
    expect(log).toHaveLength(LOG_KEPT);
    expect(log[0]!.bar).toBe(10);
    expect(log.at(-1)!.bar).toBe(LOG_KEPT + 9);
  });

  it(`gives a welcome the newest ${LOG_TAIL}, and every line it has where it has fewer`, () => {
    const full = Array.from({ length: LOG_KEPT }, (_, n) => line(n));
    expect(tailOf(full).map((l) => l.bar)).toEqual(
      Array.from({ length: LOG_TAIL }, (_, n) => LOG_KEPT - LOG_TAIL + n),
    );
    expect(tailOf(full.slice(0, 3))).toEqual(full.slice(0, 3));
  });

  it('keeps a welcome with its tail under 6 KB as JSON, so a lobby relays it in one message, and readable', () => {
    const tail = tailOf(Array.from({ length: LOG_KEPT }, (_, n) => line(n)));
    expect(JSON.stringify(tail).length).toBeLessThan(6 * 1024);
    for (const event of tail) expect(readHostMessage({ kind: 'event', ...event })).not.toBeNull();
  });
});
