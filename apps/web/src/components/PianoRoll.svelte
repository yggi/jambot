<!--
  A track's piano roll: the notes of the last bar it finished, on the bar's
  sixteen steps, one row per pitch sounding, low at the bottom. Generalizes
  the Muse panel's motif drawing (rows of a scale degree) to rows of a raw
  note, so the same shape draws any track's pattern, melodic or percussive
  alike.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { PatternNote } from '../pattern.ts';

  interface Props {
    notes: readonly PatternNote[];
  }

  let { notes }: Props = $props();

  const W = 320;
  const H = 64;
  const step = W / BAR_STEPS;
  const pitches = $derived([...new Set(notes.map((n) => n.note))].sort((a, b) => a - b));
  const rowOf = $derived(new Map(pitches.map((note, row) => [note, row])));
  const rowHeight = $derived(pitches.length > 0 ? Math.min(12, (H - 4) / pitches.length) : 0);
</script>

{#if notes.length === 0}
  <p class="empty">Nothing played in the last bar yet.</p>
{:else}
  <svg
    viewBox="0 0 {W} {H}"
    preserveAspectRatio="none"
    role="img"
    aria-label="Pattern of {notes.length} notes"
  >
    {#each [4, 8, 12] as beat (beat)}
      <line x1={beat * step} x2={beat * step} y1="0" y2={H} />
    {/each}
    {#each notes as note, i (i)}
      <rect
        class="note"
        x={note.step * step + 1}
        y={H - 2 - (rowOf.get(note.note)! + 1) * rowHeight}
        width={Math.max(2, note.length * step - 2)}
        height={Math.max(2, rowHeight - 2)}
        rx="2"
      />
    {/each}
  </svg>
{/if}

<style>
  .empty {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
  svg {
    display: block;
    width: 100%;
    height: 64px;
    background: var(--bg);
    border-radius: 8px;
  }
  line {
    stroke: var(--line);
    stroke-width: 1;
  }
  .note {
    fill: var(--amber);
  }
</style>
