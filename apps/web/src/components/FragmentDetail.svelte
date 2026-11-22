<!--
  FragmentDetail: what the Library knows of one fragment (`FragmentRow`), as
  a row picked opens it, in the Library and beside a Playing row's score
  lines (#730): its cells text, the point it is found at on the style's axes,
  its weight in the composer's mind and, for a rhythm, the boredom of its
  lineage and its rung (#443), a motif's strength in her memory, what it
  varies and how, its tags, and what it was used together with.
-->
<script lang="ts">
  import type { FragmentRow } from '../fragmentsView.ts';

  interface Props {
    /** The Library's row of the fragment. */
    row: FragmentRow;
  }

  let { row }: Props = $props();
</script>

{#if row.text !== null}<pre>{row.text}</pre>{/if}
{#if row.point.length > 0}
  <div class="axes" aria-label="Found at">
    {#each row.point as { axis, value } (axis)}
      <div class="axis">
        <span>{axis} {value.toFixed(2)}</span>
        <span class="track"><i style:left="{value * 100}%"></i></span>
      </div>
    {/each}
  </div>
{/if}
{#if row.weight !== null}
  <p class="line">
    <span>In mind</span><span>{Math.round(row.weight * 100)} %</span>
  </p>
{/if}
{#if row.lineage !== null}
  <p class="line">
    <span>Boredom</span><span>{row.lineage.boredom.toFixed(1)} · {row.lineage.rung}</span>
  </p>
{/if}
{#if row.strength !== null}
  <p class="line">
    <span>In her memory</span><span>{Math.round(row.strength * 100)} %</span>
  </p>
{/if}
{#if row.varies !== null}
  <p class="line">
    <span>Varies</span><span>{row.by === null ? row.varies : `${row.varies} by ${row.by}`}</span>
  </p>
{/if}
{#if row.tags.length > 0}
  <ul class="tags" aria-label="Tags">
    {#each row.tags as tag (tag)}<li>{tag}</li>{/each}
  </ul>
{/if}
{#if row.together.length > 0}
  <ul class="together" aria-label="Used together with">
    {#each row.together as { id, count } (id)}
      <li><span>{id}</span><span>× {count}</span></li>
    {/each}
  </ul>
{/if}

<style>
  pre {
    max-height: 160px;
    margin: 0;
    padding: 8px 10px;
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.5;
  }
  .axes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 14px;
    color: var(--muted);
    font-size: 11px;
  }
  .axis {
    display: grid;
    gap: 4px;
  }
  .track {
    position: relative;
    height: 4px;
    border-radius: 2px;
    background: var(--line);
  }
  .track i {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 10px;
    background: var(--teal);
  }
  .line,
  .together li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 0;
    font-size: 13px;
  }
  .line span:first-child {
    color: var(--muted);
  }
  ul {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tags li {
    padding: 1px 8px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--muted);
    font-size: 12px;
  }
</style>
