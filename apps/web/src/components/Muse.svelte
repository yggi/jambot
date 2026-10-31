<!--
  The Muse, a card: the piece that answers the player. Folded, its state
  ("Listening", "Took a motif") over whose motif it holds and when ("from
  Ada's keys · bar 7"), or, before it holds one, how many it remembers or
  what to play; the glyph is a ring that pings for each note played, holding
  the motif's contour in its player's colour. Unfolded, its inner state and
  no prose: the motif it offers the band (`Contour`) with Forget, which asks
  it to let the motif go from the next bar the band composes; its patience,
  a step for each bar since anyone played, filled to `MUSE.forgetAfter`,
  where it lets the offer go; and its log, the latest first. Its memory is
  the Cells view's Muse rows, under it: a row for each motif it took, the
  strongest first, with the bars it was heard in and its weight.
-->
<script lang="ts">
  import type { MuseView } from '../hud.ts';
  import Card from './Card.svelte';
  import Contour from './Contour.svelte';
  import Ring from './glyphs/Ring.svelte';

  interface Props {
    muse: MuseView;
    /** How many notes the player has played: the glyph pings for each. */
    pulse: number;
    onforget: () => void;
  }

  let { muse, pulse, onforget }: Props = $props();

  const main = $derived(muse.motif ? 'Took a motif' : 'Listening');
  const sub = $derived(
    muse.motif
      ? `from ${muse.motif.name} · bar ${muse.motif.bar + 1}`
      : muse.memory.length > 0
        ? `${muse.memory.length} remembered`
        : 'Play 3 to 12 notes in one bar',
  );
</script>

{#snippet ring()}
  <Ring motif={muse.motif} colour={muse.motif?.colour ?? 0} {pulse} />
{/snippet}

<Card title="Muse" {main} {sub} glyph={ring}>
  {#if muse.motif}
    <div class="offer">
      <Contour motif={muse.motif} />
      <button type="button" class="forget" onclick={onforget}>Forget motif</button>
    </div>
  {/if}
  {#if muse.quiet}
    <div
      class="patience"
      role="meter"
      aria-label="Quiet bars"
      aria-valuemin="0"
      aria-valuemax={muse.quiet.of}
      aria-valuenow={muse.quiet.bars}
      aria-valuetext="{muse.quiet.bars} of {muse.quiet.of}"
    >
      {#each { length: muse.quiet.of }, i (i)}
        <span class:spent={i < muse.quiet.bars}></span>
      {/each}
    </div>
  {/if}
  {#if muse.log.length > 0}
    <ul class="log" aria-label="Muse log" aria-live="polite">
      {#each muse.log as line, i (i)}
        <li class:taken={line.taken}>Bar {line.bar + 1}: {line.text}</li>
      {/each}
    </ul>
  {/if}
</Card>

<style>
  .offer {
    display: grid;
    gap: 8px;
  }
  .forget {
    justify-self: start;
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    min-height: 34px;
    padding: 0 10px;
  }
  .patience {
    display: grid;
    grid-template-columns: repeat(16, 1fr);
    gap: 3px;
  }
  .patience span {
    height: 8px;
    border-radius: 2px;
    background: var(--line);
  }
  .patience span.spent {
    background: var(--amber);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }
  .log {
    font-size: 13px;
    color: var(--muted);
  }
  .log li {
    padding-left: 12px;
    border-left: 3px solid var(--line);
  }
  .log li.taken {
    border-left-color: var(--teal);
    color: var(--ink);
  }
</style>
