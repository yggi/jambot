<!--
  The Muse, a card: the piece that answers the player. Folded, its state
  ("Listening", "Took a motif") over whose motif it holds and when ("from
  Ada's keys · bar 7"), or how to give it one; the glyph is a ring that pings
  for each note played, holding the motif's contour in its player's colour.
  Unfolded, the motif it offers the band drawn on the bar's sixteen steps, a
  row per degree, in its player's colour (`attribution.ts`), where it came
  from, its log with the latest first, and what to play to give it one. Forget
  asks it to let the motif go from the next bar the band composes. Its words
  are the prototype's.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { MuseView } from '../hud.ts';
  import Card from './Card.svelte';
  import Ring from './glyphs/Ring.svelte';

  interface Props {
    muse: MuseView;
    /** How many notes the player has played: the glyph pings for each. */
    pulse: number;
    onforget: () => void;
  }

  let { muse, pulse, onforget }: Props = $props();

  const W = 320;
  const H = 64;
  const step = W / BAR_STEPS;
  const rowHeight = $derived(muse.motif ? Math.min(12, (H - 4) / muse.motif.rows) : 0);
  const main = $derived(muse.motif ? 'Took a motif' : 'Listening');
  const sub = $derived(
    muse.motif
      ? `from ${muse.motif.name} · bar ${muse.motif.bar + 1}`
      : 'Play 3 to 12 notes in one bar',
  );
</script>

{#snippet ring()}
  <Ring motif={muse.motif} colour={muse.motif?.colour ?? 0} {pulse} />
{/snippet}

<Card title="Muse" {main} {sub} glyph={ring}>
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
          style:fill={note.altered ? undefined : `var(--source-${muse.motif.colour})`}
          x={note.step * step + 1}
          y={H - 2 - (note.row + 1) * rowHeight}
          width={Math.max(2, note.length * step - 2)}
          height={Math.max(2, rowHeight - 2)}
          rx="2"
        />
      {/each}
    </svg>
    <p class="status">
      Motif from {muse.motif.name}, heard in bar {muse.motif.bar + 1}.
    </p>
    <button type="button" class="forget" onclick={onforget}>Forget motif</button>
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
  <p class="help">
    Play a few notes within a bar on the keys or the pads, and the Muse takes them as a motif the
    lead plays back from the bar after next, in your colour. A dot on the keys marks the scale the
    lead plays over; amber shows what the band's own lead and drums are playing.
  </p>
</Card>

<style>
  .forget {
    justify-self: start;
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
  .help {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
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
