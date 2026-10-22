<!--
  Cells, a card (`fragmentsView.ts`): every cells fragment the band has met,
  as one table told apart by where each has been. Folded, how many over how
  many of each; unfolded, a filter (All, Filed, Retrieved, Muse) over the
  table, a row for each: its name, its part (meter, rhythm, clave, motif),
  a mark for each place it has been (filed, retrieved, the Muse's), who made
  it, how many sections heard took it and since when. A row picked opens
  under it: its cells text, the point it is found at on the style's axes,
  its tags, what it varies and what it was used together with. It logs the
  sections heard itself, a section at a time, so it stays mounted while
  another view shows.
-->
<script lang="ts">
  import type { LearnedLayer } from '@jambot/engine';
  import { untrack } from 'svelte';
  import {
    FRAGMENT_FILTERS,
    type FragmentFilter,
    type FragmentRow,
    type TakenSection,
    fragmentRows,
    fragmentsMain,
    fragmentsSub,
    logged,
    shownRows,
    takenOf,
  } from '../fragmentsView.ts';
  import type { BarView, MemoryView } from '../hud.ts';
  import Card from './Card.svelte';
  import Segmented from './Segmented.svelte';

  interface Props {
    /** The bar heard, or null before any: its section is logged once heard. */
    bar: BarView | null;
    /** What the band learned, where this device keeps it; null for a client. */
    layer: LearnedLayer | null;
    /** The Muse's memory. */
    memory: readonly MemoryView[];
    /** The session's players' names, by id. */
    players: Readonly<Record<string, string>>;
  }

  let { bar, layer, memory, players }: Props = $props();

  let log: readonly TakenSection[] = $state.raw([]);
  $effect.pre(() => {
    const section = takenOf(bar);
    untrack(() => (log = logged(log, section)));
  });

  let filter: FragmentFilter = $state('all');
  let picked: string | null = $state(null);

  const rows = $derived(fragmentRows({ layer, log, memory, players }));
  const shown = $derived(shownRows(rows, filter));
  const open = $derived(shown.find((r) => r.key === picked) ?? null);

  const options = $derived(
    FRAGMENT_FILTERS.map(({ id, label }) => ({
      value: id,
      text: `${label} ${shownRows(rows, id).length}`,
      name: label,
    })),
  );

  const MARKS = [
    ['filed', 'F', 'Filed'],
    ['retrieved', 'R', 'Retrieved'],
    ['muse', 'M', 'From the Muse'],
  ] as const;

  const dot = (row: FragmentRow) =>
    row.colour !== null
      ? `var(--source-${row.colour})`
      : row.source === 'seed'
        ? 'var(--muted)'
        : 'var(--amber)';
</script>

<Card title="Cells" main={fragmentsMain(rows)} sub={fragmentsSub(rows)}>
  <Segmented label="Show" {options} value={filter} onselect={(value) => (filter = value)} />
  {#if shown.length === 0}
    <p class="note">
      {rows.length === 0
        ? 'Nothing yet: the band takes a meter and a rhythm a section at a time, and files what it and its players invent.'
        : 'None of these yet.'}
    </p>
  {:else}
    <div class="box">
      <table aria-label="Fragments">
        <thead>
          <tr>
            <th scope="col">Fragment</th>
            <th scope="col">Part</th>
            <th scope="col"><span aria-hidden="true">F R M</span><span class="sr">Where</span></th>
            <th scope="col">Source</th>
            <th scope="col" class="n">Sections</th>
            <th scope="col" class="n">Since</th>
          </tr>
        </thead>
        <tbody>
          {#each shown as row (row.key)}
            <tr class:picked={row.key === picked} class:playing={row.playing}>
              <td>
                <button
                  type="button"
                  class="name"
                  aria-expanded={row.key === picked}
                  onclick={() => (picked = picked === row.key ? null : row.key)}
                >
                  {row.name}
                </button>
                {#if row.playing}<span class="now"
                    >{row.role === 'motif' ? 'on offer' : 'playing'}</span
                  >{/if}
              </td>
              <td><span class="part {row.role}">{row.role}</span></td>
              <td>
                <span class="marks">
                  {#each MARKS as [which, letter, title] (which)}
                    <span
                      class="mark"
                      class:on={row[which]}
                      {title}
                      aria-label={row[which] ? title : undefined}>{letter}</span
                    >
                  {/each}
                </span>
              </td>
              <td class="source"><i style:background={dot(row)}></i>{row.source}</td>
              <td class="n">{row.sections || '–'}</td>
              <td class="n">{row.since}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if open}
    <section class="detail" aria-label={open.name}>
      <h3>{open.name}</h3>
      {#if open.text !== null}<pre>{open.text}</pre>{/if}
      {#if open.point.length > 0}
        <div class="axes" aria-label="Found at">
          {#each open.point as { axis, value } (axis)}
            <div class="axis">
              <span>{axis} {value.toFixed(2)}</span>
              <span class="track"><i style:left="{value * 100}%"></i></span>
            </div>
          {/each}
        </div>
      {/if}
      {#if open.strength !== null}
        <p class="line">
          <span>In her memory</span><span>{Math.round(open.strength * 100)} %</span>
        </p>
      {/if}
      {#if open.varies !== null}
        <p class="line"><span>Varies</span><span>{open.varies}</span></p>
      {/if}
      {#if open.tags.length > 0}
        <ul class="tags" aria-label="Tags">
          {#each open.tags as tag (tag)}<li>{tag}</li>{/each}
        </ul>
      {/if}
      {#if open.together.length > 0}
        <ul class="together" aria-label="Used together with">
          {#each open.together as { id, count } (id)}
            <li><span>{id}</span><span>× {count}</span></li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</Card>

<style>
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .box {
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th {
    padding: 8px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font-size: 11px;
    font-weight: 500;
    text-align: left;
    white-space: nowrap;
  }
  td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }
  .n {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  tr.picked td {
    background: var(--teal-bg);
  }
  .name {
    min-height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }
  .now {
    margin-left: 6px;
    color: var(--amber);
    font-size: 11px;
  }
  .part {
    padding: 1px 7px;
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--muted);
    font-size: 11px;
  }
  .part.meter {
    border-color: var(--source-3);
    color: var(--source-3);
  }
  .part.rhythm {
    border-color: var(--amber);
    color: var(--amber);
  }
  .part.clave {
    border-color: var(--source-2);
    color: var(--source-2);
  }
  .part.bass {
    border-color: var(--source-4);
    color: var(--source-4);
  }
  .part.lead {
    border-color: var(--source-5);
    color: var(--source-5);
  }
  .part.motif {
    border-color: var(--teal);
    color: var(--teal);
  }
  .marks {
    display: inline-flex;
    gap: 3px;
  }
  .mark {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    background: var(--line);
    color: var(--muted);
    font-size: 10px;
    font-weight: 600;
  }
  .mark.on {
    background: var(--amber);
    color: var(--on-amber);
  }
  .source i {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .detail {
    display: grid;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
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
