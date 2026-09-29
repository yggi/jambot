<!--
  A card: one thing on the page, folded to a header and unfolded to its
  details. The header is the card's own heading (what the thing is), a
  headline in large type (what it is now) and, only where there is
  something secondary that changes, a line under it, with the chevron at the right of the heading, in the same place on
  every card. The details open under it, spaced alike. The metrum, the key,
  the plan and the chords are cards, so a stack of them reads as one (a `Drawer` folds
  settings that aren't the music, with the same chevron).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The card's heading, and what names it to a screen reader. */
    heading: string;
    /** The headline: what the thing is now. */
    name: string;
    /** The line under it: secondary and changing, never a fixed explanation. */
    sub?: string;
    /** Whether a screen reader announces the line under it as it changes. */
    live?: boolean;
    children: Snippet;
  }

  let { heading, name, sub, live = false, children }: Props = $props();
</script>

<details class="card" aria-label={heading}>
  <summary class="chevron">
    <span class="heading">{heading}</span>
    <span class="name">{name}</span>
    {#if sub}<span class="sub" aria-live={live ? 'polite' : undefined}>{sub}</span>{/if}
  </summary>
  {@render children()}
</details>

<style>
  .card {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 0;
  }
  .card > :global(:not(summary)) {
    margin-top: 14px;
  }
  summary {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 10px;
  }
  summary::after {
    grid-column: 2;
    grid-row: 1;
  }
  .heading {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .name {
    grid-column: 1 / -1;
    margin-top: 4px;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
  }
  .sub {
    grid-column: 1 / -1;
    font-size: 13px;
    color: var(--muted);
  }
</style>
