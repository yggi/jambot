<!--
  One band member's track, collapsed to its label and status, expandable to
  what it is sounding now and, while the lead plays a motif, whose it is.
  Reusable and read-only: it takes a `TrackView` and reads nothing else, so
  the same row shows whether the player hosts, follows, or plays alone.
-->
<script lang="ts">
  import type { TrackView } from '../tracks.ts';

  interface Props {
    track: TrackView;
  }

  let { track }: Props = $props();
</script>

<details class="track">
  <summary>
    <span class="label">{track.label}</span>
    <span class="status">{track.status}</span>
  </summary>
  <div class="detail">
    {#if track.source}
      <p class="source">From {track.source}.</p>
    {/if}
    <p class="sounding" class:silent={track.sounding.length === 0}>
      {track.sounding.length === 0
        ? 'Silent.'
        : `${track.sounding.length} note${track.sounding.length === 1 ? '' : 's'} sounding.`}
    </p>
  </div>
</details>

<style>
  .track {
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
  .sounding {
    font-size: 13px;
    color: var(--muted);
  }
  .sounding:not(.silent) {
    color: var(--amber);
  }
</style>
