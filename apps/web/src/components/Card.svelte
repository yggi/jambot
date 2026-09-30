<!--
  A card: one thing on the page, a summary over details. The summary is a
  glyph (a small living picture of the thing) at the left, beside the card's
  title (what it is), the main element (what it is now, in large type) and a
  sub element (secondary and changing), with the chevron at the top right,
  in the same place on every card. Each line of the summary is one line, never
  wrapped: the main element's type shrinks with the room there is, whatever it
  says, and any line that still doesn't fit is cut short (its full text is the
  tooltip), and the sub element keeps its line when it is empty, so a card is
  as tall when the band is stopped as when it plays and the layout never
  shifts under a person looking for the next chord. The details open under it, free to arrange their
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
      <span class="main" title={main}><span class="fit">{main}</span></span>
    {:else}
      <span class="main control">{@render main()}</span>
    {/if}
    {#if sub !== undefined}
      <span class="sub" title={sub} aria-live={live ? 'polite' : undefined}>{sub}</span>
    {/if}
  </summary>
  {@render children()}
</details>

<style>
  .card {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 14px;
    min-width: 0;
  }
  .card > :global(:not(summary)) {
    margin-top: 14px;
  }
  summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'title chevron'
      'main glyph'
      'sub glyph';
    align-items: center;
    column-gap: 10px;
  }
  summary.with-glyph {
    grid-template-columns: auto minmax(0, 1fr) auto;
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
  .title,
  .sub,
  .fit {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
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
    min-width: 0;
    container-type: inline-size;
  }
  /* The type shrinks with the room, so a long chord name fits in one line on a phone. */
  .fit {
    display: block;
    font-size: clamp(18px, 10cqw, 28px);
    font-weight: 700;
    line-height: 1.15;
  }
  .main.control {
    container-type: normal;
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
  }
  .sub {
    grid-area: sub;
    min-height: 1.35em;
    font-size: 13px;
    line-height: 1.3;
    color: var(--muted);
  }
  /*
    A phone on its side has little height and plenty of width, so the summary
    gives up its third line: the sub element sits beside the title, and the
    glyph shrinks to the two lines left. A closed card is then about 60 px, and
    a stack of them fits the screen with room to scroll less.
  */
  @media (max-height: 500px) {
    .card {
      padding: 8px 12px;
    }
    .card > :global(:not(summary)) {
      margin-top: 10px;
    }
    summary {
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas:
        'title sub chevron'
        'main main main';
      column-gap: 10px;
    }
    summary.with-glyph {
      grid-template-columns: auto auto minmax(0, 1fr) auto;
      grid-template-areas:
        'glyph title sub chevron'
        'glyph main main main';
      column-gap: 12px;
    }
    .glyph {
      width: var(--glyph-compact);
      height: var(--glyph-compact);
    }
    .sub {
      min-height: 0;
    }
    .fit {
      font-size: clamp(18px, 10cqw, 24px);
      line-height: 1.1;
    }
  }
</style>
