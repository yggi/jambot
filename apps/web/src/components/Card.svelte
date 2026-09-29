<!--
  A card: one thing on the page, a summary over details. The summary is one
  row: the card's title (what the thing is), a glyph (a small living picture
  of it), the main element (what it is now, in large type), a sub element
  (secondary and changing) and the chevron, at the top right, in the same
  place on every card. The details open under it, free to arrange their
  content, spaced alike. A card starts folded unless its details are what a
  person plays on, as the tracks' are, and only a person's click changes
  that: the card owns whether it is open, so what it shows changing (a new
  chord, a new bar) never folds or unfolds it.
-->
<script lang="ts">
  import { type Snippet, untrack } from 'svelte';

  interface Props {
    /** The card's title, and what names it to a screen reader. */
    title: string;
    /** What the thing is now, in large type. */
    main: string;
    /** The line under it: secondary and changing, never a fixed explanation. */
    sub?: string;
    /** Whether a screen reader announces the sub element as it changes. */
    live?: boolean;
    /** A small picture of the thing, drawn from what the card shows; decoration, so hidden from a screen reader. */
    glyph?: Snippet;
    /** Whether it starts unfolded: only where its details are what a person plays on. */
    open?: boolean;
    /** The details, free to arrange their content. */
    children: Snippet;
  }

  let {
    title,
    main,
    sub,
    live = false,
    glyph,
    open: startsOpen = false,
    children,
  }: Props = $props();

  /**
   * Whether it is unfolded: where it starts, then as a person leaves it. Read
   * from `open` once, since setting it with the summary's other attributes
   * would fold a card shut each time what it shows changes.
   */
  let unfolded = $state(untrack(() => startsOpen));
</script>

<details class="card" aria-label={title} bind:open={unfolded}>
  <summary class="chevron">
    <span class="title">{title}</span>
    {#if glyph}<span class="glyph" aria-hidden="true">{@render glyph()}</span>{/if}
    <span class="main">{main}</span>
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
  .title {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .glyph {
    grid-column: 2;
    grid-row: 2 / span 2;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
  }
  .main {
    grid-column: 1;
    margin-top: 4px;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
  }
  .sub {
    grid-column: 1;
    font-size: 13px;
    color: var(--muted);
  }
</style>
