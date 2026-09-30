<!--
  The Muse's glyph: a ring that pings for each note played, with the motif it
  holds drawn inside, one mark for each note, in its player's colour. It is
  an empty ring while the Muse holds no motif, and still when nothing is
  played.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';

  interface Props {
    /** The motif held: its notes on the bar's 16 steps, and how many rows it spans. */
    motif: { rows: number; notes: readonly { step: number; length: number; row: number }[] } | null;
    /** The player's colour, from 0. */
    colour: number;
    /** How many notes have been played: a new one pings. */
    pulse: number;
  }

  let { motif, colour, pulse }: Props = $props();

  const C = GLYPH_SIZE / 2;
  const LEFT = 11;
  const WIDE = 18;
  const TOP = 13;
  const HIGH = 14;
  const rowHeight = $derived(motif ? Math.min(3, HIGH / motif.rows) : 0);
</script>

<Glyph>
  {#if pulse > 0}
    {#key pulse}<circle class="ping" cx={C} cy={C} r="14" />{/key}
  {/if}
  <circle class="ring" cx={C} cy={C} r="14" />
  {#if motif}
    {#each motif.notes as note, i (i)}
      <rect
        class="note"
        x={LEFT + (note.step / 16) * WIDE}
        y={TOP + HIGH - (note.row + 1) * rowHeight}
        width={Math.max(1.4, (note.length / 16) * WIDE - 0.6)}
        height={Math.max(1.4, rowHeight - 0.6)}
        rx="0.7"
        style:fill="var(--source-{colour})"
      />
    {/each}
  {/if}
</Glyph>

<style>
  .ring {
    fill: none;
    stroke: var(--source-0);
    stroke-width: 1.8;
    opacity: 0.7;
  }
  .ping {
    fill: none;
    stroke: var(--source-0);
    stroke-width: 1.4;
    transform-origin: 20px 20px;
    animation: ping 0.6s ease-out forwards;
  }
  @keyframes ping {
    from {
      transform: scale(1);
      opacity: 0.9;
    }
    to {
      transform: scale(1.3);
      opacity: 0;
    }
  }
</style>
