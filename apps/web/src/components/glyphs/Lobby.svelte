<!--
  The lobby's small pictures, for the cards that have no state to draw: a
  person (the name), a source with its signal going out (hosting a session)
  and a gear (the settings). They are still figures in the glyph colour
  roles and never move. Joining and playing alone use the network and the
  equalizer glyphs the band's own cards use.
-->
<script lang="ts">
  import Glyph from '../Glyph.svelte';

  interface Props {
    kind: 'name' | 'host' | 'gear';
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
    <circle class="dim" cx="20" cy="20" r="5" />
    {#each [0, 45, 90, 135, 180, 225, 270, 315] as turn (turn)}
      <line class="dim" x1="20" y1="8" x2="20" y2="12" transform="rotate({turn} 20 20)" />
    {/each}
    <circle class="dim" cx="20" cy="20" r="9" />
  {/if}
</Glyph>

<style>
  circle,
  line,
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
  .accent.solid {
    fill: var(--glyph-accent);
  }
  .faint {
    opacity: 0.5;
  }
</style>
