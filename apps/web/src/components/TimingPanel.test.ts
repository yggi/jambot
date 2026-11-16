import { EMPTY_SPREAD, TRANSPORT_TIMING, spreadWith } from '@jambot/session';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import type { LinkReport } from '@yggi/webmidi/core';
import { describe, expect, it, vi } from 'vitest';
import { timingReport } from '../timing.ts';
import TimingPanel from './TimingPanel.svelte';

const place = { taken: '2026-09-27T22:00:00.000Z', userAgent: 'a browser' };

describe('the timing panel (#27)', () => {
  it('shows the counters in milliseconds, and exports on the button', async () => {
    const report = timingReport(
      {
        mode: 'solo',
        transport: {
          ...TRANSPORT_TIMING,
          ticks: [25, 26, 410].reduce(spreadWith, EMPTY_SPREAD),
          laid: 32,
          missed: 5,
          lateEvents: 3,
        },
        output: { offset: 1, bound: 0.0005, jumps: 2 },
        network: null,
        lacked: 0,
      },
      place,
    );
    const onexport = vi.fn();
    render(TimingPanel, { report, onexport });
    const value = (name: string) => screen.getByText(name).nextElementSibling?.textContent;
    expect(value('Ticks apart, least / p50 / p99 / most')).toBe('25.0 / 26.5 / 410.0 / 410.0 (3)');
    expect(value('Scheduled ahead, least / p50 / p99 / most')).toBe('none yet');
    expect(value('Steps laid, missed')).toBe('32, 5');
    expect(value('Events dropped late')).toBe('3');
    expect(value('Output: buffers dropped, bound')).toBe('2, 0.5');
    expect(screen.queryByText(/Round trips/)).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onexport).toHaveBeenCalledOnce();
  });

  it("shows a client's round trips, its clock and its bars too late", () => {
    const report = timingReport(
      {
        mode: 'client',
        transport: TRANSPORT_TIMING,
        output: null,
        network: { trips: spreadWith(EMPTY_SPREAD, 3.2), reading: null, skew: null },
        lacked: 4,
      },
      place,
    );
    render(TimingPanel, { report, onexport: () => {} });
    const value = (name: string) => screen.getByText(name).nextElementSibling?.textContent;
    expect(value('Round trips, least / p50 / p99 / most')).toBe('3.2 / 3.2 / 3.2 / 3.2 (1)');
    expect(value('Host clock: jumps, skew')).toBe('0, –');
    expect(value('Bars too late')).toBe('4');
    expect(value('Output: buffers dropped, bound')).toBe('not started');
  });

  it('shows each measured MIDI link’s two tiers and why, marked speculative, and nothing before one is measured', () => {
    const base = {
      mode: 'solo' as const,
      transport: TRANSPORT_TIMING,
      output: null,
      network: null,
      lacked: 0,
    };
    render(TimingPanel, { report: timingReport(base, place), onexport: () => {} });
    expect(screen.queryByText(/MIDI link/)).toBeNull();
    cleanup();
    const link = {
      report: 'webmidi link',
      output: 'Juno',
      tier: { scheduled: 'good', played: 'tight' },
      reasons: ['jitter 2 ms', 'loss 0%'],
    } as unknown as LinkReport;
    render(TimingPanel, {
      report: timingReport({ ...base, links: { o1: link } }, place),
      onexport: () => {},
    });
    expect(screen.getByText('MIDI link to Juno').nextElementSibling?.textContent).toBe(
      'scheduled good, played tight (speculative: jitter 2 ms; loss 0%)',
    );
  });
});
