<!--
  Jambot's logo as a glyph: the four bars of the app's icon, in amber, one
  for each performer of the band. It is the About card's and the lobby banner's picture and does
  not move.
-->
<script lang="ts">
  import Glyph from '../Glyph.svelte';

  /** The heights of the four bars, as in `public/icon.svg`, on the glyph's 40 units. */
  const HEIGHTS = [12, 20, 16, 24] as const;
</script>

<Glyph>
  {#each HEIGHTS as height, i (i)}
    <rect x={6 + i * 7.5} y={32 - height} width="5" {height} rx="1.6" />
  {/each}
</Glyph>

<style>
  rect {
    fill: var(--glyph-lit);
  }
</style>
