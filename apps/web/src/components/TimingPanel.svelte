<!--
  The timing panel (#27), shown with `?timing` in the address: the
  device's timing counters as they stand (`timingReport`), in milliseconds,
  and a button that saves them as a file to attach to an issue.
-->
<script lang="ts">
  import type { SpreadSummary } from '@jambot/session';
  import type { TimingReport } from '../timing.ts';

  interface Props {
    report: TimingReport;
    onexport: () => void;
  }

  let { report, onexport }: Props = $props();

  const figure = (value: number | null) => (value === null ? '–' : value.toFixed(1));
  const spread = (s: SpreadSummary) =>
    s.count === 0
      ? 'none yet'
      : `${figure(s.least)} / ${figure(s.p50)} / ${figure(s.p99)} / ${figure(s.most)} (${s.count})`;

  const rows = $derived.by(() => {
    const { transport, output, network, session } = report;
    const lines: [string, string][] = [
      ['Ticks apart, least / p50 / p99 / most', spread(transport.ticks)],
      ['Scheduled ahead, least / p50 / p99 / most', spread(transport.margins)],
      ['Steps laid, missed', `${transport.laid}, ${transport.missed}`],
      [
        'Output: buffers dropped, bound',
        output ? `${output.jumps}, ${figure(output.bound)}` : 'not started',
      ],
    ];
    if (network)
      lines.push(
        ['Round trips, least / p50 / p99 / most', spread(network.trips)],
        ['Host clock: jumps, skew', `${network.jumps}, ${figure(network.skew)}`],
        ['Bars too late', `${session.lacked}`],
      );
    const { late, ahead, inadmissible } = session.dropped;
    lines.push([
      'Judgements dropped: late, ahead, inadmissible',
      `${late}, ${ahead}, ${inadmissible}`,
    ]);
    return lines;
  });
</script>

<section class="timing" aria-label="Timing">
  <div class="top">
    <h2>Timing</h2>
    <button type="button" onclick={onexport}>Export</button>
  </div>
  <dl>
    {#each rows as [name, value] (name)}
      <dt>{name}</dt>
      <dd>{value}</dd>
    {/each}
  </dl>
  <p class="note">In milliseconds, since the song started; a session's since it was joined.</p>
</section>

<style>
  .timing {
    display: grid;
    gap: 6px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
  }
  button {
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    min-height: 34px;
    padding: 0 10px;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 12px;
    margin: 0;
    font-size: 13px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
