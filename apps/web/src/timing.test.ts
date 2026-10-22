// @vitest-environment node
import { EMPTY_SPREAD, TRANSPORT_TIMING, hostClock, spreadWith } from '@jambot/session';
import { describe, expect, it } from 'vitest';
import { timingFile, timingReport } from './timing.ts';

const place = { taken: '2026-09-27T22:00:00.000Z', userAgent: 'a browser' };

describe('the timing report (#27)', () => {
  it('reads alone: the transport and the output pair in milliseconds, and no network', () => {
    const transport = {
      ...TRANSPORT_TIMING,
      ticks: [25, 25.4, 24.6, 300].reduce(spreadWith, EMPTY_SPREAD),
      margins: [96.25, 110, 120].reduce(spreadWith, EMPTY_SPREAD),
      laid: 64,
      missed: 2,
      lateEvents: 7,
    };
    const report = timingReport(
      {
        mode: 'solo',
        transport,
        output: { offset: 12.0345678, bound: 0.0005, jumps: 3 },
        network: null,
        lacked: 0,
      },
      place,
    );
    expect(report).toEqual({
      report: 'jambot timing',
      version: 1,
      ...place,
      mode: 'solo',
      transport: {
        ticks: { count: 4, least: 24.6, p50: 25.5, p99: 300, most: 300 },
        margins: { count: 3, least: 96.25, p50: 110.5, p99: 120, most: 120 },
        laid: 64,
        missed: 2,
        lateEvents: 7,
      },
      output: { offset: 12034.568, bound: 0.5, jumps: 3 },
      network: null,
      session: { lacked: 0, dropped: { late: 0, ahead: 0, inadmissible: 0 } },
    });
  });

  it("reads a client's clock: its round trips, the best, the jumps and the skew", () => {
    let clock = hostClock.initial;
    let reading = null;
    for (let i = 0; i < 4; i++) {
      const sent = i;
      const next = hostClock.advance(null, clock, {
        sent,
        received: sent + 0.004,
        host: sent + 5.002,
        heard: 0,
      });
      clock = next.carried;
      reading = next.output;
    }
    const report = timingReport(
      {
        mode: 'client',
        transport: TRANSPORT_TIMING,
        output: null,
        network: { trips: spreadWith(EMPTY_SPREAD, 4), reading, skew: 5.0001 },
        lacked: 2,
      },
      place,
    );
    expect(report.output).toBeNull();
    expect(report.network).toEqual({
      trips: { count: 1, least: 4, p50: 4, p99: 4, most: 4 },
      best: 4,
      jumps: 0,
      skew: 5000.1,
    });
    expect(report.session.lacked).toBe(2);
  });

  it('writes a file named by when it was taken, which reads back as the report', () => {
    const report = timingReport(
      { mode: 'host', transport: TRANSPORT_TIMING, output: null, network: null, lacked: 0 },
      place,
    );
    const { name, text } = timingFile(report);
    expect(name).toBe('jambot-timing-2026-09-27T22-00-00-000Z.json');
    expect(JSON.parse(text)).toEqual(report);
  });
});
