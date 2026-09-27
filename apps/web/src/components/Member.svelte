<!--
  One band member, collapsed to its label and status, expandable to its last
  bar as a piano roll, what it is sounding now, and, while the lead plays a
  motif, whose it is. Reusable and read-only: it takes a `MemberView` and
  reads nothing else, so the same row shows whether the player hosts,
  follows, or plays alone.
-->
<script lang="ts">
  import PianoRoll from './PianoRoll.svelte';
  import type { MemberView } from '../members.ts';

  interface Props {
    member: MemberView;
  }

  let { member }: Props = $props();
</script>

<details class="member">
  <summary>
    <span class="label">{member.label}</span>
    <span class="status">{member.status}</span>
  </summary>
  <div class="detail">
    {#if member.source}
      <p class="source">From {member.source}.</p>
    {/if}
    <p class="caption">Last bar</p>
    <PianoRoll notes={member.pattern} />
    <p class="sounding" class:silent={member.sounding.length === 0}>
      {member.sounding.length === 0
        ? 'Silent.'
        : `${member.sounding.length} note${member.sounding.length === 1 ? '' : 's'} sounding.`}
    </p>
  </div>
</details>

<style>
  .member {
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
