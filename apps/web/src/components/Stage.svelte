<!--
  The stage: where the music is, as heard. The section, the bar in it and
  the key; the chord sounding, large, with its numeral; the beats of the bar
  so far; the song map; the next four bars; and what the lead is doing. Before anything is heard it shows the bar
  the band opens on.
-->
<script lang="ts">
  import { type Hud, leadStatus } from '../hud.ts';
  import NextBars from './NextBars.svelte';
  import SongMap from './SongMap.svelte';

  interface Props {
    hud: Hud;
    /** Whether the band is playing or about to. */
    playing: boolean;
  }

  let { hud, playing }: Props = $props();

  const heard = $derived(hud.beat !== null);
  const lead = $derived(leadStatus(hud));
</script>

<section class="stage" aria-label="Conductor">
  <div class="stage-top">
    <span class="section">
      {heard && hud.bar ? hud.bar.section : playing ? '…' : 'Ready'}
    </span>
    {#if hud.bar}
      <span>{heard ? `Bar ${hud.bar.barInSection + 1} of 8` : 'Opens on'}</span>
      <span>{hud.bar.key}</span>
    {/if}
  </div>
  {#if hud.chord}
    <div class="chord" role="group" aria-label="Chord">
      <span class="symbol">{hud.chord.symbol}</span>
      <span class="numeral">{hud.chord.numeral}</span>
    </div>
  {/if}
  <div class="beats" aria-hidden="true">
    {#each [0, 1, 2, 3] as beat (beat)}
      <i class:on={hud.beat !== null && beat <= hud.beat}></i>
    {/each}
  </div>
  {#if hud.sections.length > 0}
    <SongMap sections={hud.sections} bar={heard ? (hud.bar?.bar ?? null) : null} />
  {/if}
  {#if hud.bar && hud.next.length > 0}
    <div>
      <p class="caption">Next four bars</p>
      <NextBars before={hud.bar} bars={hud.next} />
    </div>
  {/if}
  <p class="lead" aria-live="polite">{lead}</p>
</section>

<style>
  .stage {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 16px 18px 18px;
    display: grid;
    gap: 12px;
  }
  .stage-top {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    align-items: baseline;
    color: var(--muted);
    font-size: 14px;
  }
  .section {
    font-weight: 800;
    font-size: 20px;
    color: var(--amber);
  }
  .chord {
    display: flex;
    align-items: baseline;
    gap: 14px;
    flex-wrap: wrap;
  }
  .symbol {
    font-weight: 800;
    font-size: clamp(76px, 22vw, 156px);
    line-height: 0.9;
    letter-spacing: -0.035em;
  }
  .numeral {
    font-weight: 500;
    font-size: clamp(22px, 6vw, 34px);
    color: var(--muted);
  }
  .lead {
    font-size: 14px;
    color: var(--muted);
  }
  .caption {
    font-size: 13px;
    color: var(--muted);
  }
  .beats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
  }
  .beats i {
    height: 8px;
    border-radius: 4px;
    background: var(--line);
  }
  .beats i.on {
    background: var(--amber);
  }
</style>
