<!--
  One lane of the tracks' grid: a track's notes over the bars shown, low at
  the bottom, each lane scaled to its own range, so a lane's shape reads at a
  glance whatever it plays. A bar can be credited to a player, tinted and
  its notes drawn in the player's colour, or marked as the bar the Muse took,
  outlined in it. The playhead is the band's amber, on the step heard.
  Generalizes the Muse panel's motif drawing to any track and any number of
  bars.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { LaneNote } from '../tracks.ts';

  /** A bar shown, from 0, in a player's colour. */
  interface Marked {
    readonly at: number;
    readonly colour: number;
  }

  interface Props {
    /** What names the lane to a screen reader. */
    label: string;
    notes: readonly LaneNote[];
    /** How many steps the lane spans. */
    span: number;
    /** The notes' colour, a player's, or null for the band's own. */
    colour?: number | null;
    /** Bars credited to a player: tinted, their notes in its colour. */
    credited?: readonly Marked[];
    /** The bar the Muse took, outlined. */
    taken?: Marked | null;
    playhead?: number | null;
    /** Whether it sounds here: a lane muted is drawn faint. */
    sounds?: boolean;
  }

  let {
    label,
    notes,
    span,
    colour = null,
    credited = [],
    taken = null,
    playhead = null,
    sounds = true,
  }: Props = $props();

  const W = 640;
  const H = 30;
  const x = (step: number) => (step / span) * W;
  const bars = $derived(span / BAR_STEPS);
  const low = $derived(Math.min(...notes.map((n) => n.note)));
  const high = $derived(Math.max(...notes.map((n) => n.note)));
  const row = $derived(Math.max(2, Math.min(6, (H - 4) / (high - low + 1))));
  const y = (note: number) =>
    high === low ? (H - row) / 2 : 2 + ((high - note) / (high - low)) * (H - 4 - row);
  const creditOf = $derived(new Map(credited.map((c) => [c.at, c.colour])));
  const fill = (step: number) => {
    const credit = creditOf.get(Math.floor(step / BAR_STEPS));
    const c = credit ?? colour;
    return c === null ? undefined : `var(--source-${c})`;
  };
</script>

<svg
  class="lane"
  class:faint={!sounds}
  viewBox="0 0 {W} {H}"
  preserveAspectRatio="none"
  role="img"
  aria-label={label}
>
  {#each credited as c (c.at)}
    <rect
      class="credited"
      x={x(c.at * BAR_STEPS)}
      y="0"
      width={x(BAR_STEPS)}
      height={H}
      style:fill="var(--source-{c.colour})"
    />
  {/each}
  {#each { length: span / 4 }, beat (beat)}
    <line class:bar={beat % 4 === 0} x1={x(beat * 4)} x2={x(beat * 4)} y1="0" y2={H} />
  {/each}
  {#each notes as note, i (i)}
    <rect
      class="note"
      x={x(note.step) + 0.5}
      y={y(note.note)}
      width={Math.max(3, x(note.length) - 1)}
      height={row}
      rx="1"
      style:fill={fill(note.step)}
    />
  {/each}
  {#if taken && taken.at < bars}
    <rect
      class="taken"
      x={x(taken.at * BAR_STEPS) + 1}
      y="1"
      width={x(BAR_STEPS) - 2}
      height={H - 2}
      rx="3"
      style:stroke="var(--source-{taken.colour})"
    />
  {/if}
  {#if playhead !== null}
    <line class="playhead" x1={x(playhead)} x2={x(playhead)} y1="0" y2={H} />
  {/if}
</svg>

<style>
  .lane {
    display: block;
    width: 100%;
    height: 30px;
    background: var(--surface);
    border-radius: 6px;
  }
  .faint .note {
    opacity: 0.3;
  }
  line {
    stroke: var(--line);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  line:not(.bar):not(.playhead) {
    opacity: 0.5;
  }
  .credited {
    opacity: 0.18;
  }
  .note {
    fill: var(--ink);
    opacity: 0.8;
  }
  .taken {
    fill: none;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .playhead {
    stroke: var(--amber);
    stroke-width: 2;
  }
</style>
