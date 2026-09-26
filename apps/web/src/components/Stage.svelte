<!--
  The stage: where the music is, as heard. The section, the chord, the
  key and the bar, and the beats of the bar so far.
-->
<script lang="ts">
  import type { Hud } from '../hud.ts';

  interface Props {
    hud: Hud;
    /** Whether the band is playing or about to. */
    playing: boolean;
  }

  let { hud, playing }: Props = $props();

  /** The bar heard, once something is. */
  const heard = $derived(hud.beat === null ? null : hud.bar);
</script>

<section class="stage" aria-label="Conductor">
  <div class="stage-top">
    <span class="section">
      {heard ? heard.section : playing ? '…' : 'Ready'}
    </span>
    {#if heard}
      <span class="chord">{hud.chord?.symbol}</span>
      <span>{heard.key}</span>
      <span>Bar {heard.bar + 1}</span>
    {/if}
  </div>
  <div class="beats" aria-hidden="true">
    {#each [0, 1, 2, 3] as beat (beat)}
      <i class:on={hud.beat !== null && beat <= hud.beat}></i>
    {/each}
  </div>
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
    font-weight: 700;
    color: var(--ink);
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
