<!--
  The chords' glyph: the bar as a strip, a block for each chord as long as the
  chord lasts, the chord sounding lit, and a playhead that steps across the bar
  with the beat. A bar of one chord is one whole block. Before anything is
  heard nothing is lit and there is no playhead.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';

  interface Props {
    /** The step each chord of the bar starts on, in order. */
    steps: readonly number[];
    /** The index of the chord sounding, or null before anything is heard. */
    lit: number | null;
    /** The beat heard in the bar, from 0, or null before anything is. */
    beat: number | null;
    /** How many steps the bar has. */
    span?: number;
    /** How many beats the bar has: the playhead steps across them. */
    beats?: number;
  }

  let { steps, lit, beat, span = 16, beats = 4 }: Props = $props();

  const PAD = 3;
  const GAP = 1.5;
  const HEIGHT = 12;
  const TOP = (GLYPH_SIZE - HEIGHT) / 2;
  const wide = GLYPH_SIZE - 2 * PAD;
  const at = (step: number) => PAD + (step * wide) / span;
  const blocks = $derived(
    steps.map((step, i) => {
      const end = steps[i + 1] ?? span;
      // Each block gives up half a gap at both ends, so neighbours are a gap apart.
      return { x: at(step) + GAP / 2, width: Math.max(1, at(end) - at(step) - GAP) };
    }),
  );
</script>

<Glyph>
  {#each blocks as block, i (i)}
    <rect
      class="chord"
      class:lit={i === lit}
      x={block.x}
      y={TOP}
      width={block.width}
      height={HEIGHT}
      rx="1.5"
    />
  {/each}
  {#if beat !== null}
    <line
      class="head"
      x1={at((beat * span) / beats)}
      x2={at((beat * span) / beats)}
      y1={TOP - 5}
      y2={TOP + HEIGHT + 5}
    />
  {/if}
</Glyph>

<style>
  .chord {
    fill: var(--glyph-dim);
    opacity: 0.4;
    transition:
      fill 0.12s,
      opacity 0.12s;
  }
  .chord.lit {
    fill: var(--glyph-lit);
    opacity: 1;
  }
  .head {
    stroke: var(--glyph-accent);
    stroke-width: 1.6;
    stroke-linecap: round;
    transition:
      x1 0.1s,
      x2 0.1s;
  }
</style>
