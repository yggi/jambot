<!--
  A fold: a level's view of one thing, folded to a header and unfolded to
  its details. The header is a headline in large type, what the thing is
  now, and a line under it saying what that is; the details open under it,
  spaced alike. The key and the metrum are folds, so the levels of the page
  read the same way (a `Drawer` folds settings that aren't the music).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** What names the fold to a screen reader, on the group it opens. */
    label: string;
    /** The headline: what the thing is now. */
    name: string;
    /** The line under it: what that is, or what it is doing. */
    sub?: string;
    children: Snippet;
  }

  let { label, name, sub, children }: Props = $props();
</script>

<details class="fold" aria-label={label}>
  <summary>
    <span class="name">{name}</span>
    {#if sub}<span class="sub">{sub}</span>{/if}
  </summary>
  {@render children()}
</details>

<style>
  .fold {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 0;
  }
  .fold > :global(:not(summary)) {
    margin-top: 14px;
  }
  summary {
    display: grid;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .name {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
  }
  .name::after {
    content: '▸';
    margin-left: 10px;
    font-size: 16px;
    color: var(--muted);
    display: inline-block;
    transition: transform 0.15s;
  }
  .fold[open] .name::after {
    transform: rotate(90deg);
  }
  .sub {
    font-size: 13px;
    color: var(--muted);
  }
</style>
