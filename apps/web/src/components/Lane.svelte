<!--
  One lane of the tracks' grid: a track's notes over the bars shown, low at
  the bottom, each lane scaled to its own range, so a lane's shape reads at a
  glance whatever it plays. A bar can be credited to a player, tinted and
  its notes drawn in the player's colour, or marked as the bar the Muse took,
  outlined in it. The playhead is the band's amber, on the step heard.
  Generalizes the Muse panel's motif drawing to any track and any number of
  bars, each of the meter it is in: a bar is as long as its steps, with a line
  at each of its pulses and a stronger one at its start (#262).
-->
<script lang="ts">
  import type { BarFrame, LaneNote } from '../tracks.ts';

  /** A bar shown, from 0, in a player's colour. */
  interface Marked {
    readonly at: number;
    readonly colour: number;
  }

  interface Props {
    /** What names the lane to a screen reader. */
    label: string;
    notes: readonly LaneNote[];
    /** A backdrop of dim notes under its own, on the same scale: the band's under a player's. */
    under?: readonly LaneNote[];
    /** Taller: more room for the notes. */
    tall?: boolean;
    /** How many steps the lane spans. */
    span: number;
    /** The bars it spans, where each starts and how long it is, and where its pulses fall. */
    frame: readonly BarFrame[];
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
    under = [],
    tall = false,
    span,
    frame,
    colour = null,
    credited = [],
    taken = null,
    playhead = null,
    sounds = true,
  }: Props = $props();

  const W = 640;
  const H = $derived(tall ? 60 : 30);
  const x = (step: number) => (step / span) * W;
  const bars = $derived(frame.length);
  const low = $derived(Math.min(...[...notes, ...under].map((n) => n.note)));
  const high = $derived(Math.max(...[...notes, ...under].map((n) => n.note)));
  const row = $derived(Math.max(2, Math.min(tall ? 10 : 6, (H - 4) / (high - low + 1))));
  const y = (note: number) =>
    high === low ? (H - row) / 2 : 2 + ((high - note) / (high - low)) * (H - 4 - row);
  const creditOf = $derived(new Map(credited.map((c) => [c.at, c.colour])));
  /** The bar shown a step falls in, from 0. */
  const barOf = (step: number) =>
    Math.max(
      0,
      frame.findLastIndex((bar) => bar.start <= step),
    );
  const fill = (step: number) => {
    const credit = creditOf.get(barOf(step));
    const c = credit ?? colour;
    return c === null ? undefined : `var(--source-${c})`;
  };
</script>

<svg
  class="lane"
  class:faint={!sounds}
  class:tall
  viewBox="0 0 {W} {H}"
  preserveAspectRatio="none"
  role="img"
  aria-label={label}
>
  {#each credited as c (c.at)}
    {#if frame[c.at]}
      <rect
        class="credited"
        x={x(frame[c.at]!.start)}
        y="0"
        width={x(frame[c.at]!.steps)}
        height={H}
        style:fill="var(--source-{c.colour})"
      />
    {/if}
  {/each}
  {#each frame as bar (bar.start)}
    {#each bar.pulses as pulse (pulse)}
      <line class:bar={pulse === bar.start} x1={x(pulse)} x2={x(pulse)} y1="0" y2={H} />
    {/each}
  {/each}
  {#each under as note, i (i)}
    <rect
      class="note under"
      x={x(note.step) + 0.5}
      y={y(note.note)}
      width={Math.max(3, x(note.length) - 1)}
      height={row}
      rx="1"
    />
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
      x={x(frame[taken.at]!.start) + 1}
      y="1"
      width={x(frame[taken.at]!.steps) - 2}
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
  .lane.tall {
    height: 72px;
  }
  .faint .note {
    opacity: 0.3;
  }
  .note.under {
    fill: var(--muted);
    opacity: 0.35;
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
