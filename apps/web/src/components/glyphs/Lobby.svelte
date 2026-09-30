<!--
  The lobby's small pictures, for the cards that have no state to draw: a
  person (the name), a source with its signal going out (hosting a session)
  and three dots (the extras). They are still figures in the glyph colour
  roles and never move. Joining and playing alone use the network and the
  equalizer glyphs the band's own cards use.
-->
<script lang="ts">
  import Glyph from '../Glyph.svelte';

  interface Props {
    kind: 'name' | 'host' | 'extras';
  }

  let { kind }: Props = $props();
</script>

<Glyph>
  {#if kind === 'name'}
    <circle class="accent" cx="20" cy="14" r="6" />
    <path class="dim" d="M8 33 C8 24 32 24 32 33" />
  {:else if kind === 'host'}
    <circle class="accent solid" cx="20" cy="20" r="4" />
    <circle class="dim" cx="20" cy="20" r="9" />
    <circle class="dim faint" cx="20" cy="20" r="15" />
  {:else}
    <circle class="dim solid" cx="9" cy="20" r="3" />
    <circle class="dim solid" cx="20" cy="20" r="3" />
    <circle class="dim solid" cx="31" cy="20" r="3" />
  {/if}
</Glyph>

<style>
  circle,
  path {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
  }
  .accent {
    stroke: var(--glyph-accent);
  }
  .dim {
    stroke: var(--glyph-dim);
  }
  .solid {
    fill: currentColor;
  }
  .accent.solid {
    fill: var(--glyph-accent);
  }
  .dim.solid {
    fill: var(--glyph-dim);
  }
  .faint {
    opacity: 0.5;
  }
</style>
