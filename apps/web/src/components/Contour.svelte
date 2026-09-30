<!--
  A motif drawn on the bar's sixteen steps, a row per degree, a mark per
  note, in its player's colour (`attribution.ts`); a note the key altered
  keeps the amber. The Muse card draws the motif on offer large and each one
  it remembers small, faded as its weight is.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { MotifView } from '../hud.ts';

  interface Props {
    motif: Pick<MotifView, 'rows' | 'notes' | 'colour'>;
    /** Its height in pixels; the width is the container's. */
    height?: number;
    /** With the beats marked as lines behind the notes. */
    beats?: boolean;
    /** How much of its colour it keeps, from 0 to 1. */
    opacity?: number;
    label?: string;
  }

  let { motif, height = 64, beats = true, opacity = 1, label }: Props = $props();

  const W = 320;
  const step = W / BAR_STEPS;
  const rowHeight = $derived(Math.min(12, (height - 4) / motif.rows));
</script>

<svg
  viewBox="0 0 {W} {height}"
  preserveAspectRatio="none"
  role="img"
  aria-label={label ?? `Motif of ${motif.notes.length} notes`}
  style:height="{height}px"
  style:opacity
>
  {#if beats}
    {#each [4, 8, 12] as beat (beat)}
      <line x1={beat * step} x2={beat * step} y1="0" y2={height} />
    {/each}
  {/if}
  {#each motif.notes as note (note.step)}
    <rect
      class="note"
      class:altered={note.altered}
      style:fill={note.altered ? undefined : `var(--source-${motif.colour})`}
      x={note.step * step + 1}
      y={height - 2 - (note.row + 1) * rowHeight}
      width={Math.max(2, note.length * step - 2)}
      height={Math.max(2, rowHeight - 2)}
      rx="2"
    />
  {/each}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    background: var(--teal-bg);
    border-radius: 8px;
  }
  line {
    stroke: var(--line);
    stroke-width: 1;
  }
  .note.altered {
    fill: var(--amber);
  }
</style>
