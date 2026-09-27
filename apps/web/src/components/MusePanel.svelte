<!--
  The Muse: the motif it offers the band, drawn on the bar's sixteen steps
  a row per degree, where it came from, and its log, the latest first.
  Forget asks it to let the motif go from the next bar the band composes.
  Its words are the prototype's.
-->
<script lang="ts">
  import type { MuseView } from '../hud.ts';

  interface Props {
    muse: MuseView;
    onforget: () => void;
  }

  let { muse, onforget }: Props = $props();

  const W = 320;
  const H = 64;
  const step = W / 16;
  const rowHeight = $derived(muse.motif ? Math.min(12, (H - 4) / muse.motif.rows) : 0);
</script>

<section class="muse" aria-label="Muse">
  <div class="top">
    <h2>Muse</h2>
    {#if muse.motif}
      <button type="button" onclick={onforget}>Forget motif</button>
    {/if}
  </div>
  {#if muse.motif}
    <svg
      viewBox="0 0 {W} {H}"
      preserveAspectRatio="none"
      role="img"
      aria-label="Motif of {muse.motif.notes.length} notes"
    >
      {#each [4, 8, 12] as beat (beat)}
        <line x1={beat * step} x2={beat * step} y1="0" y2={H} />
      {/each}
      {#each muse.motif.notes as note (note.step)}
        <rect
          class="note"
          class:altered={note.altered}
          x={note.step * step + 1}
          y={H - 2 - (note.row + 1) * rowHeight}
          width={Math.max(2, note.length * step - 2)}
          height={Math.max(2, rowHeight - 2)}
          rx="2"
        />
      {/each}
    </svg>
    <p class="status">
      Motif from {muse.motif.source}, heard in bar {muse.motif.bar + 1}.
    </p>
  {:else}
    <p class="status">
      Play 3 to 12 notes within one bar. Jambot keeps the shape and plays it back in key from the
      bar after next.
    </p>
  {/if}
  {#if muse.log.length > 0}
    <ul aria-label="Muse log" aria-live="polite">
      {#each muse.log as line, i (i)}
        <li class:taken={line.taken}>Bar {line.bar + 1}: {line.text}</li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .muse {
    display: grid;
    gap: 6px;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    color: var(--teal);
  }
  button {
    font: inherit;
    font-size: 14px;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    min-height: 34px;
    padding: 0 10px;
  }
  svg {
    display: block;
    width: 100%;
    height: 64px;
    background: var(--teal-bg);
    border-radius: 8px;
  }
  line {
    stroke: var(--line);
    stroke-width: 1;
  }
  .note {
    fill: var(--teal);
  }
  .note.altered {
    fill: var(--amber);
  }
  .status {
    margin: 0;
    font-size: 14px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
    font-size: 13px;
    color: var(--muted);
  }
  li {
    padding-left: 12px;
    border-left: 3px solid var(--line);
  }
  li.taken {
    border-left-color: var(--teal);
    color: var(--ink);
  }
</style>
