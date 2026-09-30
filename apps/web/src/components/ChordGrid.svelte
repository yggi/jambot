<!--
  The chord grid: the bars by chord, the bar heard and the bars after it,
  eight in all. The bar heard and the next are large, with each bar's chords
  as symbols over numerals (a bar of two chords is one line too, cut short where it doesn't fit), and the bar
  heard carries the beats of the bar, one dot per beat of the song's meter,
  lit up to the beat heard. The six after are smaller, in two rows of three.
  A bar where the section or the key changes carries the change as a label,
  in any tile. A bar the lead is to play a motif in is marked by a ring in its
  player's colour (`attribution.ts`): the offer standing now, which it plays
  unless another comes.
-->
<script lang="ts">
  import { SONG_METER } from '@jambot/engine';
  import type { Meter } from '@jambot/theory';
  import type { BarView } from '../hud.ts';
  import { type Tile, chordTiles } from '../planView.ts';

  interface Props {
    /** The bar heard, or before anything is, the bar first played; null past the forecast. */
    heard: BarView | null;
    /** The bars after it, as far as they are decided. */
    next: readonly BarView[];
    /** The beat heard in the bar heard, or null before anything is. */
    beat?: number | null;
    /** The meter the bar is in: the song's, which the view model counts its beats on. */
    meter?: Meter;
  }

  let { heard, next, beat = null, meter = SONG_METER }: Props = $props();

  const tiles = $derived(chordTiles(heard, next));
  const near = $derived(tiles.filter((t) => t.large));
  const far = $derived(tiles.filter((t) => !t.large));
  const beats = $derived(meter.heights.length);

  const symbols = (t: Tile) => t.bar.chords.map((c) => c.symbol).join(' ');
  const numerals = (t: Tile) => t.bar.chords.map((c) => c.numeral).join(' ');
</script>

{#snippet tile(t: Tile, first: boolean)}
  <li class:large={t.large} class:cue={t.cue !== ''}>
    <span class="cue-label" title={t.cue}>{t.cue}</span>
    {#if t.bar.lead === 'motif' && t.bar.motif}
      <i
        class="credited"
        role="img"
        aria-label="Motif from {t.bar.motif.name}, heard in bar {t.bar.motif.bar + 1}"
        title="Motif from {t.bar.motif.name}, heard in bar {t.bar.motif.bar + 1}"
        style:--colour="var(--source-{t.bar.motif.colour})"
      ></i>
    {/if}
    <b>{symbols(t)}</b>
    <small>{numerals(t)}</small>
    {#if first}
      <span class="beats" style:--beats={beats} aria-hidden="true">
        {#each { length: beats }, k (k)}
          <i class:on={beat !== null && k <= beat}></i>
        {/each}
      </span>
    {/if}
  </li>
{/snippet}

{#if near.length > 0}
  <div class="grid">
    <ol class="near" aria-label="The bar heard and the next">
      {#each near as t, i (t.bar.bar)}{@render tile(t, i === 0)}{/each}
    </ol>
    {#if far.length > 0}
      <ol class="far" aria-label="The bars after">
        {#each far as t (t.bar.bar)}{@render tile(t, false)}{/each}
      </ol>
    {/if}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    gap: 14px;
  }
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px 12px;
  }
  .near {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .far {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  li {
    position: relative;
    border-top: 3px solid var(--line);
    padding-top: 4px;
    min-width: 0;
  }
  li.cue {
    border-top-color: var(--amber);
  }
  .credited {
    position: absolute;
    top: 7px;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 2px var(--colour);
  }
  .cue-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--amber);
    min-height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  b {
    display: block;
    font-weight: 800;
    font-size: 17px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li.large b {
    font-size: clamp(22px, 6vw, 32px);
    line-height: 1.05;
  }
  small {
    display: block;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  li.large small {
    font-size: 13px;
  }
  .beats {
    display: grid;
    grid-template-columns: repeat(var(--beats), 1fr);
    gap: 4px;
    margin-top: 8px;
  }
  .beats i {
    height: 6px;
    border-radius: 3px;
    background: var(--line);
  }
  .beats i.on {
    background: var(--amber);
  }
</style>
