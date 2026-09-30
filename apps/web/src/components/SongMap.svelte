<!--
  The song map: the plan as sections, in two rows. The first row is the
  section playing and the one after it, large, every bar with its chord's
  name; the second is the three sections after those, smaller, with a chord
  named on their first and last bar only. A section is a block: its name
  (and its key, where that changes), its eight bars as tall as their energy,
  and under each bar the lead plays a motif in, a mark in its player's
  colour (`attribution.ts`): filled once heard, only outlined ahead, where it
  holds the offer standing now, which it plays unless another comes. The
  section playing is highlighted, its past bars filled and the bar heard
  ringed. The prototype's layout, in two rows.
-->
<script lang="ts">
  import type { SectionView } from '../hud.ts';
  import { blockName, planRows } from '../planView.ts';

  interface Props {
    sections: readonly SectionView[];
    /** The bar heard, or null before anything is. */
    bar: number | null;
  }

  let { sections, bar }: Props = $props();

  const rows = $derived(planRows(sections));
</script>

{#snippet block(section: SectionView, k: number, large: boolean)}
  <li class="sec {large ? 'large' : 'small'}" class:now={k === 0}>
    <span class="name" title={blockName(section)}>{blockName(section)}</span>
    <span class="bars">
      {#each section.bars as b, i (b.bar)}
        <span class="bar">
          <span class="col" aria-hidden="true">
            <i
              class:past={k === 0 && bar !== null && b.bar < bar}
              class:cur={k === 0 && b.bar === bar}
              style:height="{Math.round(8 + b.energy * 92)}%"
            ></i>
          </span>
          <span class="label">
            {#if large || i === 0 || i === section.bars.length - 1}
              <span class="stack">
                {#each b.chords as chord (chord.step)}<b>{chord.symbol}</b>{/each}
              </span>
            {/if}
          </span>
        </span>
      {/each}
    </span>
    <span class="credits" aria-hidden="true">
      {#each section.bars as b (b.bar)}
        {#if b.lead === 'motif' && b.motif}
          <i
            class="credited"
            class:ahead={bar === null || b.bar > bar}
            style:--colour="var(--source-{b.motif.colour})"
          ></i>
        {:else}
          <i></i>
        {/if}
      {/each}
    </span>
  </li>
{/snippet}

{#if rows.near.length > 0}
  <div class="songmap">
    <ol class="near" aria-label="The section playing and the next">
      {#each rows.near as section, k (section.index)}
        {@render block(section, k, true)}
      {/each}
    </ol>
    {#if rows.far.length > 0}
      <ol class="far" aria-label="The sections after">
        {#each rows.far as section (section.index)}
          {@render block(section, -1, false)}
        {/each}
      </ol>
    {/if}
  </div>
{/if}

<style>
  .songmap {
    display: grid;
    gap: 16px;
  }
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 14px 16px;
  }
  .near {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .far {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  @media (max-width: 520px) {
    .near {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  .sec {
    min-width: 0;
  }
  .name {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }
  .sec.now .name {
    color: var(--amber);
  }
  .bars {
    display: flex;
    gap: 2px;
  }
  .bar {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .col {
    display: flex;
    align-items: flex-end;
    height: 40px;
  }
  .small .col {
    height: 26px;
  }
  .col i {
    flex: 1;
    min-height: 3px;
    border-radius: 2px 2px 0 0;
    background: var(--muted);
    opacity: 0.3;
  }
  .sec.now .col i {
    background: var(--amber);
    opacity: 0.35;
  }
  .sec.now .col i.past {
    opacity: 0.85;
  }
  .sec.now .col i.cur {
    opacity: 1;
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 3px var(--amber);
  }
  .label {
    position: relative;
    display: block;
    height: 2.7em;
    margin-top: 3px;
    font-size: 12px;
    line-height: 1.3;
  }
  .stack {
    display: grid;
    min-width: 0;
  }
  .large .stack b {
    font-size: clamp(10px, 2.8vw, 12px);
    font-weight: 700;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .small .label {
    font-size: 11px;
  }
  .small .stack {
    position: absolute;
    top: 0;
  }
  .small .bar:first-child .stack {
    left: 0;
  }
  .small .bar:last-child .stack {
    right: 0;
    text-align: right;
  }
  .small .stack b {
    font-weight: 600;
    color: var(--muted);
    white-space: nowrap;
  }
  .credits {
    display: flex;
    gap: 2px;
    height: 4px;
    margin-top: 2px;
  }
  .credits i {
    flex: 1;
    border-radius: 2px;
  }
  .credits i.credited {
    background: var(--colour);
  }
  .credits i.credited.ahead {
    background: none;
    box-shadow: inset 0 0 0 1px var(--colour);
  }
</style>
