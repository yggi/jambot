<!--
  The band's glyph: a small piano roll of its performers, a row for each
  (drums, bass, chords, lead), the notes of the phrase shown as ticks on their
  steps, a row that does not sound on this device dimmed, and a playhead
  across the phrase with the step heard. It reads the same lanes as the
  card's details.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';
  import type { LaneNote } from '../../tracks.ts';

  interface Props {
    /** A row for each performer, in order. */
    rows: readonly { notes: readonly LaneNote[]; sounds: boolean }[];
    /** How many steps the phrase spans. */
    span: number;
    /** The step heard, counted from the phrase's start, or null before anything is heard. */
    playhead: number | null;
  }

  let { rows, span, playhead }: Props = $props();

  const PAD = 3;
  const wide = GLYPH_SIZE - 2 * PAD;
  const TOP = 7;
  const ROW = 6.5;
  const x = (step: number) => PAD + (step / span) * wide;
</script>

<Glyph>
  {#each rows as row, i (i)}
    <g class="row" class:faint={!row.sounds}>
      {#each row.notes as note, k (k)}
        <rect
          class="tick"
          x={Math.min(x(note.step), GLYPH_SIZE - PAD - 1)}
          y={TOP + i * ROW}
          width={Math.max(
            1,
            Math.min(wide * (note.length / span), GLYPH_SIZE - PAD - x(note.step)),
          )}
          height="3.2"
          rx="0.6"
        />
      {/each}
    </g>
  {/each}
  {#if playhead !== null}
    <line class="head" x1={x(playhead)} x2={x(playhead)} y1="4" y2="36" />
  {/if}
</Glyph>

<style>
  .tick {
    fill: var(--glyph-lit);
  }
  .faint .tick {
    fill: var(--glyph-dim);
    opacity: 0.4;
  }
  .head {
    stroke: var(--glyph-accent);
    stroke-width: 1.4;
    stroke-linecap: round;
  }
</style>
