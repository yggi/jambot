<!--
  The shell: a screen as an app, which owns the viewport so the page itself
  never scrolls (#327). Three regions, each of a fixed height, so nothing
  that plays can move anything else: a header on top (the transport of what
  the screen plays), a drawer hanging from it (a rider for each section, its
  sheet dropping over the views and never resizing them), and the views
  below, switched at the bottom, where the thumb is. Every sheet and view
  stays mounted and those not shown are hidden, so a card keeps what it
  shows and the band's state is drawn wherever one looks; cards under the
  shell are pinned open (`pinCards`). On a phone on its side the views move
  to a rail at the left and the riders sit beside the header.
-->
<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { IconName } from './glyphs/Icon.svelte';

  /** A section of the drawer, or a view: what its rider or tab says and shows. */
  export interface Place {
    readonly id: string;
    readonly title: string;
    readonly icon: IconName;
  }
</script>

<script lang="ts">
  import { pinCards } from './Card.svelte';
  import Icon from './glyphs/Icon.svelte';

  interface Props {
    /** What the screen plays, and how to start and stop it. */
    header: Snippet;
    /** The drawer's sections, in the order their riders stand. */
    drawer: readonly Place[];
    /** A section's sheet. */
    sheet: Snippet<[string]>;
    views: readonly Place[];
    /** A view's content. */
    stage: Snippet<[string]>;
    /** The view shown. */
    view?: string;
    /** The section whose sheet is down, or null. */
    drawn?: string | null;
  }

  let {
    header,
    drawer,
    sheet,
    views,
    stage,
    view = $bindable(views[0]?.id ?? ''),
    drawn = $bindable(null),
  }: Props = $props();

  pinCards();

  const pull = (id: string) => (drawn = drawn === id ? null : id);
  const show = (id: string) => {
    view = id;
    drawn = null;
  };
</script>

<div class="shell">
  <div class="top">
    <div class="header">{@render header()}</div>
    <nav class="riders" aria-label="Drawer" style:--places={drawer.length}>
      {#each drawer as place (place.id)}
        <button
          type="button"
          aria-expanded={drawn === place.id}
          aria-controls="sheet-{place.id}"
          onclick={() => pull(place.id)}
        >
          <span class="icon"><Icon name={place.icon} /></span>
          {place.title}
        </button>
      {/each}
    </nav>
  </div>

  <div class="body">
    {#each views as place (place.id)}
      <div
        class="view"
        id="view-{place.id}"
        role="tabpanel"
        aria-labelledby="tab-{place.id}"
        hidden={view !== place.id}
      >
        {@render stage(place.id)}
      </div>
    {/each}
    <button
      type="button"
      class="scrim"
      aria-label="Close the drawer"
      tabindex="-1"
      hidden={drawn === null}
      onclick={() => (drawn = null)}
    ></button>
    {#each drawer as place (place.id)}
      <div class="sheet" id="sheet-{place.id}" hidden={drawn !== place.id}>
        <div class="content">{@render sheet(place.id)}</div>
        <button
          type="button"
          class="grab"
          aria-label="Hide {place.title}"
          onclick={() => (drawn = null)}
        >
          <i></i>
        </button>
      </div>
    {/each}
  </div>

  <div class="views" role="tablist" aria-label="Views" style:--places={views.length}>
    {#each views as place (place.id)}
      <button
        type="button"
        role="tab"
        id="tab-{place.id}"
        aria-selected={view === place.id}
        aria-controls="view-{place.id}"
        onclick={() => show(place.id)}
      >
        <span class="icon"><Icon name={place.icon} /></span>
        {place.title}
      </button>
    {/each}
  </div>
</div>

<style>
  /* The side gutter: 10 px on a phone, and the content centred in 720 px where the screen is wider. */
  .shell {
    --gutter: max(10px, calc((100vw - 720px) / 2), env(safe-area-inset-left, 0px));
    position: fixed;
    inset: 0;
    display: grid;
    /* One column as wide as the screen, whatever a line in it would like. */
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
    background: var(--bg);
    overscroll-behavior: none;
  }
  .top {
    padding: max(8px, env(safe-area-inset-top, 0px)) var(--gutter) 0;
    position: relative;
    z-index: 4;
  }
  .header > :global(section) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .riders {
    display: grid;
    grid-template-columns: repeat(var(--places), minmax(0, 1fr));
    padding: 2px 2px 4px;
    border: 1px solid var(--line);
    border-top: 1px dashed var(--line);
    border-radius: 0 0 18px 18px;
    background: var(--surface);
  }
  .riders button,
  .views button {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    min-width: 0;
    border: 0;
    border-radius: 12px;
    background: none;
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
  }
  .riders button {
    height: 50px;
  }
  .riders button[aria-expanded='true'] {
    color: var(--amber);
    background: color-mix(in srgb, var(--amber) 14%, var(--surface));
  }
  .icon {
    width: 24px;
    height: 24px;
  }
  .body {
    position: relative;
    min-height: 0;
  }
  .view {
    position: absolute;
    inset: 0;
    overflow: auto;
    overscroll-behavior: contain;
    /* A scrollbar coming and going would narrow the view and move what is in it. */
    scrollbar-gutter: stable;
    padding: 10px var(--gutter);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 2;
    border: 0;
    background: rgb(5 7 13 / 0.45);
  }
  .sheet {
    position: absolute;
    top: 0;
    left: var(--gutter);
    right: var(--gutter);
    z-index: 3;
    max-height: calc(100% - 16px);
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    border: 1px solid var(--line);
    border-top: 0;
    border-radius: 0 0 22px 22px;
    background: var(--surface);
    box-shadow: 0 16px 34px rgb(0 0 0 / 0.25);
    overflow: hidden;
  }
  .content {
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: 6px 4px 0;
  }
  .content > :global(.card) {
    border: 0;
  }
  .grab {
    height: 24px;
    display: grid;
    place-items: center;
    border: 0;
    background: none;
  }
  .grab i {
    width: 40px;
    height: 5px;
    border-radius: 3px;
    background: var(--line);
  }
  .views {
    display: grid;
    grid-template-columns: repeat(var(--places), minmax(0, 1fr));
    padding: 0 var(--gutter) env(safe-area-inset-bottom, 0px);
    border-top: 1px solid var(--line);
    background: var(--surface);
  }
  .views button {
    height: 60px;
    font-size: 11.5px;
  }
  .views .icon {
    width: 26px;
    height: 26px;
  }
  .views button[aria-selected='true'] {
    color: var(--amber);
  }
  [hidden] {
    display: none !important;
  }

  /* A phone on its side: the views are a rail at the left, the riders beside the header. */
  @media (max-height: 500px) and (orientation: landscape) {
    .shell {
      --gutter: 8px;
      grid-template-columns: 76px minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    }
    .top {
      grid-column: 2;
      grid-row: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
      gap: 8px;
      padding: max(4px, env(safe-area-inset-top, 0px)) 8px 4px 0;
    }
    .header > :global(section) {
      height: 52px;
      border-radius: 16px;
    }
    .riders {
      border-top: 1px solid var(--line);
      border-radius: 16px;
      padding: 1px;
    }
    .riders button {
      height: 48px;
    }
    .body {
      grid-column: 2;
      grid-row: 2;
    }
    .views {
      grid-column: 1;
      grid-row: 1 / span 2;
      grid-template-columns: 1fr;
      grid-auto-rows: 64px;
      align-content: start;
      padding: 4px;
      border-top: 0;
      border-right: 1px solid var(--line);
    }
    .sheet {
      left: auto;
      width: min(480px, 100%);
    }
  }
</style>
