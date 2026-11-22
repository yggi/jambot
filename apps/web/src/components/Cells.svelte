<!--
  Cells, a card in three tabs. Playing, the default (`playingView.ts`, #642):
  what the band plays in the section heard, as a tree read off its score with
  cells' outline, each part under what it is taken on, or, switched, under
  what plays it; a row a part, the fragment it is taken from or written, what
  plays it and its weight in the composer's mind.
  A row joins the Library's row of its fragment (#730): how it came and who made it; a written row says what it was derived from where the page knows (the drums' rhythm on every page, the bass's, lead's and harmony's line on a host's and solo's, `Player.derivations`), or that it is the band's own.
  A row picked opens to the score's lines it is, beside the Library's detail of its fragment (`FragmentDetail`).
  Folded, it counts the parts the section heard plays; on a phone a row's fragment, how it came and what plays it go beneath its part.
  Next §: the same tree for the section built ahead. Library (`fragmentsView.ts`): every cells fragment the band has met,
  as one table told apart by where each has been. Folded, how many over how
  many of each; unfolded, a filter (All, Filed, Retrieved, Muse, In mind)
  over the table, a row for each: its name, its part (meter, rhythm, clave,
  motif), a mark for each place it has been (filed, retrieved, the Muse's,
  in the composer's mind), who made it, how many sections heard took it and
  since when. A row picked opens under it: its cells text, the point it is
  found at on the style's axes, its weight in the composer's mind and, for a
  rhythm, the boredom of its lineage and its rung (#443), its tags, what it
  varies and how, and what it was used together with. It logs the
  sections heard itself, a section at a time, so it stays mounted while
  another view shows. Where this device keeps what the band learned (a
  host's, solo's), it carries it (#398): the layer exported as JSON, its
  filed fragments as fragment files, and a layer imported while the band is
  stopped.
-->
<script lang="ts">
  import type { LearnedLayer } from '@jambot/engine';
  import type { Workbench } from '../fragmentsView.ts';
  import {
    type Came,
    type Projection,
    type SectionDerivation,
    cameLine,
    cameOfRow,
    fragmentLine,
    playingRows,
    playingSummary,
  } from '../playingView.ts';
  import type { Score } from '../shadow.ts';
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
  import FragmentDetail from './FragmentDetail.svelte';
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
    /** How the learned layer is carried to and from files; null for a client. */
    carry?: Carry | null;
    /** The composer's workbench, where this device plans; null for a client. */
    workbench?: Workbench | null;
    /** The score of the section heard and its outline (`Player.heardScore`), a client's as its host's; none yet. */
    score?: Score | null;
    /** The score of the section after it, as built ahead (`Player.nextScore`); none yet. */
    next?: Score | null;
    /** What the sections planned lately derive their written parts from (`Player.derivations`); a client's is empty. */
    derivations?: readonly SectionDerivation[];
  }

  interface Carry {
    /** Whether the band plays: an import waits until it stops. */
    playing: boolean;
    /** Save the layer as a JSON file. */
    onexport: () => void;
    /** Save its filed fragments as fragment files. */
    onexportfiles: () => void;
    /** Take a layer from a file's text: null where it took, else why not. */
    onimport: (text: string) => string | null;
  }

  let {
    bar,
    layer,
    memory,
    players,
    carry = null,
    workbench = null,
    score = null,
    next = null,
    derivations = [],
  }: Props = $props();

  /** What the last import said: that it took, or why not. */
  let imported: string | null = $state(null);

  async function take(input: HTMLInputElement, by: Carry) {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    imported = by.onimport(await file.text()) ?? 'Imported: the next song starts from it.';
  }

  let log: readonly TakenSection[] = $state.raw([]);
  $effect.pre(() => {
    const section = takenOf(bar);
    untrack(() => (log = logged(log, section)));
  });

  let tab = $state<'playing' | 'next' | 'library'>('playing');
  let projection: Projection = $state('ground');
  let pickedRow: string | null = $state(null);
  const TABS = [
    { value: 'playing', text: 'Playing', name: 'Playing' },
    { value: 'next', text: 'Next §', name: 'Next section' },
    { value: 'library', text: 'Library', name: 'Library' },
  ] as const;
  const PROJECTIONS = [
    { value: 'ground', text: 'From the ground', name: 'From the ground' },
    { value: 'outputs', text: 'From the outputs', name: 'From the outputs' },
  ] as const;
  const rows = $derived(fragmentRows({ layer, log, memory, players, workbench }));
  const heard = $derived(score ? playingRows(score.text, score.outline, 'ground', workbench) : []);
  const shownScore = $derived(tab === 'next' ? next : score);
  // (what the section shown derives its written parts from: the drums' rhythm off the bar heard, on every page; the
  // rest as the band's carried plans logged it, a host's and solo's)
  const derivation = $derived.by((): SectionDerivation | null => {
    if (!bar) return null;
    const of = (section: number) => derivations.find((d) => d.section === section);
    if (tab === 'next') return of(bar.sectionIndex + 1) ?? null;
    return {
      ...of(bar.sectionIndex),
      section: bar.sectionIndex,
      drums: bar.fragments.rhythm,
    };
  });
  const tree = $derived(
    shownScore
      ? playingRows(shownScore.text, shownScore.outline, projection, workbench, {
          library: new Map(rows.map((r) => [r.key, r])),
          derived: derivation,
        })
      : [],
  );
  const scoreLines = $derived(shownScore ? shownScore.text.split('\n') : []);
  const summary = $derived(heard.length > 0 ? playingSummary(heard) : null);
  const openRow = $derived(tree.find((r) => r.key === pickedRow) ?? null);
  const openCame: Came | null = $derived(openRow ? cameOfRow(openRow) : null);

  let filter: FragmentFilter = $state('all');
  let picked: string | null = $state(null);

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
    ['mind', 'I', 'In mind'],
  ] as const;

  const dot = (row: FragmentRow) =>
    row.colour !== null
      ? `var(--source-${row.colour})`
      : row.source === 'seed'
        ? 'var(--muted)'
        : 'var(--amber)';
</script>

<Card
  title="Cells"
  main={summary?.main ?? fragmentsMain(rows)}
  sub={summary?.sub ?? fragmentsSub(rows)}
>
  <Segmented label="Tab" options={TABS} value={tab} onselect={(value) => (tab = value)} />
  {#if tab !== 'library'}
    <Segmented
      label="Tree"
      options={PROJECTIONS}
      value={projection}
      onselect={(value) => (projection = value)}
    />
    {#if tree.length === 0}
      <p class="note">
        {tab === 'next'
          ? 'Nothing yet: the tree shows the next section once the band has built it.'
          : 'Nothing yet: the tree shows the section heard once its score is written.'}
      </p>
    {:else}
      <div class="box">
        <table aria-label={tab === 'next' ? 'Next section' : 'Playing'}>
          <thead>
            <tr>
              <th scope="col">Part</th>
              <th scope="col" class="frag-head">Fragment</th>
              <th scope="col" class="came-head">How it came</th>
              <th scope="col" class="on-head">Plays on</th>
              <th scope="col" class="n">In mind</th>
            </tr>
          </thead>
          <tbody>
            {#each tree as row (row.key)}
              {@const came = cameOfRow(row)}
              <tr class:picked={row.key === pickedRow}>
                <td class="tree" style:padding-left="{8 + row.depth * 14}px">
                  <i class="chip" class:written={row.id === null}></i>
                  <button
                    type="button"
                    class="name"
                    aria-expanded={row.key === pickedRow}
                    onclick={() => (pickedRow = pickedRow === row.key ? null : row.key)}
                  >
                    {row.label}
                  </button>
                  <span class="sub"
                    >{#if came}<i class="dot" style:background={dot(came.row)}></i>{/if}{[
                      fragmentLine(row),
                      ...(came ? [cameLine(came)] : []),
                      ...row.on,
                    ].join(' · ')}</span
                  >
                </td>
                <td class="frag">
                  {#if row.id === null}<span class="written-word">{fragmentLine(row)}</span
                    >{:else}{row.id}{#if row.args}<span class="args">({row.args})</span>{/if}{/if}
                </td>
                <td class="came">
                  {#if came}<i class="dot" style:background={dot(came.row)}></i>{cameLine(
                      came,
                    )}{/if}
                </td>
                <td class="on">{row.on.join(' · ')}</td>
                <td class="n">{row.weight === null ? '' : `${Math.round(row.weight * 100)} %`}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if openRow}
        <section class="detail" aria-label={openRow.label}>
          <h3>{openRow.label}</h3>
          {#if openRow.derived}
            <p class="line">
              <span>Derived from</span><span
                >{openRow.derived.id ?? 'nothing found: the band’s own'}</span
              >
            </p>
            {#if openRow.derived.why}<p class="note">Written out: {openRow.derived.why}.</p>{/if}
          {/if}
          <pre>{openRow.lines.map((n) => scoreLines[n - 1]).join('\n')}</pre>
          {#if openCame}
            <h4>
              {openCame.row.name}
              <span class="came"
                ><i class="dot" style:background={dot(openCame.row)}></i>{cameLine(openCame)}</span
              >
            </h4>
            <FragmentDetail row={openCame.row} />
          {/if}
        </section>
      {/if}
    {/if}
  {:else}
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
              <th scope="col"
                ><span aria-hidden="true">F R M I</span><span class="sr">Where</span></th
              >
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
        <FragmentDetail row={open} />
      </section>
    {/if}
  {/if}
  {#if carry}
    <div class="actions">
      <button type="button" onclick={carry.onexport}>Export</button>
      {#if layer && layer.filed.length > 0}
        <button type="button" onclick={carry.onexportfiles}>
          Export fragments ({layer.filed.length})
        </button>
      {/if}
      <label class="file" class:disabled={carry.playing}>
        Import
        <input
          type="file"
          accept="application/json,.json"
          disabled={carry.playing}
          onchange={(e) => void take(e.currentTarget, carry!)}
        />
      </label>
      <p class="note">
        {imported ??
          (carry.playing
            ? 'This browser keeps what the band learns. Stop the band to import.'
            : 'This browser keeps what the band learns.')}
      </p>
    </div>
  {/if}
</Card>

<style>
  .tree {
    white-space: nowrap;
  }
  .chip {
    display: inline-block;
    width: 8px;
    height: 14px;
    margin-right: 6px;
    border-radius: 2px;
    background: var(--teal);
    vertical-align: -2px;
  }
  .chip.written {
    border: 1.5px dashed var(--muted);
    background: none;
  }
  .frag {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
  }
  .args,
  .written-word,
  .on,
  .came {
    color: var(--muted);
  }
  .came {
    font-size: 12px;
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
  }
  h4 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }
  h4 .came {
    margin-left: 6px;
    font-weight: 400;
  }
  .written-word {
    font-family: inherit;
    font-style: italic;
  }
  .on {
    font-size: 12px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .actions button,
  .file {
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
  .file {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }
  .file input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .file.disabled {
    opacity: 0.5;
    cursor: default;
  }
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  .box {
    container-type: inline-size;
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
  .part.harmony {
    border-color: var(--source-1);
    color: var(--source-1);
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
  .sub {
    display: none;
  }
  /* (on a phone a row takes two lines: the part, what it is taken from and on beneath it, its weight on the right) */
  @container (max-width: 480px) {
    :is(th, td):is(.frag, .came, .on, .frag-head, .came-head, .on-head) {
      display: none;
    }
    .sub {
      display: block;
      color: var(--muted);
      font-size: 11px;
    }
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
  .line {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin: 0;
    font-size: 13px;
  }
  .line span:first-child {
    color: var(--muted);
  }
</style>
