<!--
  The conductor: where the music is, as heard. The section, the chord, the
  key and the bar, and the beats of the bar so far.
-->
<script lang="ts">
  import { type SectionType, keyName } from '@jambot/engine';
  import type { Position } from '../player.svelte.ts';

  interface Props {
    /** What is heard, or null before anything is. */
    position: Position | null;
    /** Whether the band is playing or about to. */
    playing: boolean;
  }

  let { position, playing }: Props = $props();

  const SECTION_NAMES: Record<SectionType, string> = {
    intro: 'Intro',
    groove: 'Groove',
    bridge: 'Bridge',
    build: 'Build',
    drop: 'Drop',
    breakdown: 'Breakdown',
  };
</script>

<section class="stage" aria-label="Conductor">
  <div class="stage-top">
    <span class="section">
      {position ? SECTION_NAMES[position.section] : playing ? '…' : 'Ready'}
    </span>
    {#if position}
      <span class="chord">{position.chord}</span>
      <span>{keyName(position.key)}</span>
      <span>Bar {position.bar + 1}</span>
    {/if}
  </div>
  <div class="beats" aria-hidden="true">
    {#each [0, 1, 2, 3] as beat (beat)}
      <i class:on={position !== null && beat <= position.beat}></i>
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
