<!--
  One band performer, collapsed to its label and status, expandable to its
  last bar as a piano roll, what it is sounding now, and, while the lead
  plays a motif, whose it is. Reusable and read-only: it takes a
  `PerformerView` and reads nothing else, so the same row shows whether the
  player hosts, follows, or plays alone.
-->
<script lang="ts">
  import PianoRoll from './PianoRoll.svelte';
  import type { PerformerView } from '../performers.ts';

  interface Props {
    performer: PerformerView;
  }

  let { performer }: Props = $props();
</script>

<details class="performer">
  <summary>
    <span class="label">{performer.label}</span>
    <span class="status">{performer.status}</span>
  </summary>
  <div class="detail">
    {#if performer.source}
      <p class="source">From {performer.source}.</p>
    {/if}
    <p class="caption">Last bar</p>
    <PianoRoll notes={performer.pattern} />
    <p class="sounding" class:silent={performer.sounding.length === 0}>
      {performer.sounding.length === 0
        ? 'Silent.'
        : `${performer.sounding.length} note${performer.sounding.length === 1 ? '' : 's'} sounding.`}
    </p>
  </div>
</details>

<style>
  .performer {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 14px;
  }
  summary {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .label {
    font-weight: 600;
  }
  .status {
    font-size: 13px;
    color: var(--muted);
    text-align: right;
  }
  .detail {
    margin-top: 8px;
    display: grid;
    gap: 4px;
  }
  .source,
  .caption,
  .sounding {
    font-size: 13px;
    color: var(--muted);
  }
  .sounding:not(.silent) {
    color: var(--amber);
  }
</style>
