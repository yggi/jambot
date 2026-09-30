<!--
  The play card's glyph: the instrument of the track selected, piano keys for
  the lead and a two by two of pads for the drums, lit while a note is held on
  it.
-->
<script lang="ts">
  import Glyph from '../Glyph.svelte';

  interface Props {
    part: 'lead' | 'drums';
    /** Whether a note is held on it now. */
    lit: boolean;
  }

  let { part, lit }: Props = $props();

  const WHITE = 5;
  const KEY = 6;
  const LEFT = 5;
</script>

<Glyph {lit}>
  {#if part === 'lead'}
    {#each { length: WHITE }, i (i)}
      <rect class="white" x={LEFT + i * KEY} y="9" width={KEY - 0.8} height="22" rx="1" />
    {/each}
    {#each [0, 1, 3] as k (k)}
      <rect class="black" x={LEFT + (k + 1) * KEY - 2} y="9" width="3.6" height="13" rx="0.8" />
    {/each}
  {:else}
    {#each [0, 1, 2, 3] as i (i)}
      <rect
        class="pad"
        x={7 + (i % 2) * 13}
        y={7 + Math.floor(i / 2) * 13}
        width="12"
        height="12"
        rx="2.5"
      />
    {/each}
  {/if}
</Glyph>

<style>
  .white,
  .pad {
    fill: var(--glyph-dim);
    opacity: 0.45;
    transition: fill 0.1s;
  }
  .black {
    fill: var(--glyph-dim);
  }
  :global(svg.glyph.lit) .white,
  :global(svg.glyph.lit) .pad {
    fill: var(--glyph-lit);
    opacity: 1;
  }
</style>
