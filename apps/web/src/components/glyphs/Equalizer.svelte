<!--
  The sound card's glyph: an equalizer of four bars, one per performer in the
  tracks' order (drums, bass, chords, lead). A bar rises with what that
  performer is sounding and with the master volume (`equalizerLevels`), and
  falls back to a resting stub, so it moves with the band and is a flat row
  when the band is stopped or the volume is down.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';

  interface Props {
    /** One level per bar, 0 to 1: the share of the frame's height the bar fills. */
    levels: readonly number[];
  }

  let { levels }: Props = $props();

  const PAD = 6;
  const GAP = 3;
  const BASE = GLYPH_SIZE - PAD;
  const room = $derived((GLYPH_SIZE - 2 * PAD - GAP * (levels.length - 1)) / levels.length);
  const tall = GLYPH_SIZE - 2 * PAD;
  const clamped = (level: number) => Math.min(1, Math.max(0.05, level));
</script>

<Glyph>
  {#each levels as level, i (i)}
    {@const height = tall * clamped(level)}
    <rect class="bar" x={PAD + i * (room + GAP)} y={BASE - height} width={room} {height} rx="1.5" />
  {/each}
</Glyph>

<style>
  .bar {
    fill: var(--glyph-lit);
    transition:
      y 0.12s,
      height 0.12s;
  }
</style>
