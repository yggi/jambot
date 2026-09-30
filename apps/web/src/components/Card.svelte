<!--
  A card: one thing on the page, a summary over details. The summary is a
  glyph (a small living picture of the thing) at the left, beside the card's
  title (what it is), the main element (what it is now, in large type) and a
  sub element (secondary and changing), with the chevron at the top right,
  in the same place on every card. The details open under it, free to arrange their
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
    /**
     * What the thing is now: in large type, or a snippet for a control that is
     * worked from the summary (a slider, a button), which never folds the card.
     */
    main: string | Snippet;
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

  /**
   * A click on a control in the summary is that control's, not a click to fold
   * or unfold the card. It is kept from folding it with `preventDefault`,
   * which is right for a slider or a button but would revert a checkbox's
   * state, so a checkbox does not belong in a summary.
   */
  function keepFolding(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('.control')) event.preventDefault();
  }
</script>

<details class="card" aria-label={title} bind:open={unfolded}>
  <summary class="chevron" class:with-glyph={glyph} onclick={keepFolding}>
    {#if glyph}<span class="glyph" aria-hidden="true">{@render glyph()}</span>{/if}
    <span class="title">{title}</span>
    {#if typeof main === 'string'}
      <span class="main">{main}</span>
    {:else}
      <span class="main control">{@render main()}</span>
    {/if}
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
    grid-template-areas:
      'title chevron'
      'main glyph'
      'sub glyph';
    align-items: center;
    column-gap: 10px;
  }
  summary.with-glyph {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      'glyph title chevron'
      'glyph main main'
      'glyph sub sub';
    column-gap: 14px;
  }
  summary::after {
    grid-area: chevron;
    justify-self: end;
  }
  .title {
    grid-area: title;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .glyph {
    grid-area: glyph;
    display: grid;
    place-items: center;
    width: var(--glyph-size);
    height: var(--glyph-size);
  }
  .main {
    grid-area: main;
    margin-top: 4px;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
  }
  .main.control {
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
    min-width: 0;
  }
  .sub {
    grid-area: sub;
    font-size: 13px;
    color: var(--muted);
  }
</style>
