<!--
  The band's roll: every voice's notes over the bars shown, on one grid
  (`bandRoll.ts`). The fill is the pitch, the shape is the role (the lead's
  chevrons, the chords' pills, the bass's blocks, the drums' squares) and
  the outline is who plays it, kept off the fill by a halo of the ground.
  The drums lie in a strip of three rows at the foot, and the bar the Muse
  took a motif from is ringed, dashed, in its player's colour. What was played before
  the step heard is dimmed, and a voice that doesn't sound here is fainter
  still. It fills the room it is given, and draws in pixels of that room, so
  a chevron stays a chevron at any size.
-->
<script lang="ts">
  import { type RollMark, DRUM_ROWS, bandRoll } from '../bandRoll.ts';
  import { pitchColour } from '../pitch.ts';
  import type { TracksView } from '../tracks.ts';

  interface Props {
    tracks: TracksView;
    /** What names the roll to a screen reader. */
    label: string;
  }

  let { tracks, label }: Props = $props();

  let width = $state(0);
  let height = $state(0);
  const roll = $derived(bandRoll(tracks));
  /** The drum strip's height, at the foot. */
  const DRUM_STRIP = 34;
  const notesHeight = $derived(Math.max(0, height - DRUM_STRIP - 4));
  const rowHeight = $derived((DRUM_STRIP - 4) / DRUM_ROWS);
  /** The middle octave, C4 to B4, is full colour. */
  const octaveOf = (note: number) => Math.floor(note / 12) - 5;

  /** A mark's box in pixels, inset a little so neighbours stay apart. */
  function box(m: RollMark) {
    const x = m.x * width + 1;
    const w = Math.max(4, m.w * width - 2);
    if (m.pitch === null) {
      const side = Math.min(rowHeight - 2, Math.max(4, w));
      return { x, y: height - 2 - (m.row + 1) * rowHeight + 1, w: side, h: side };
    }
    return { x, y: m.y * notesHeight + 0.5, w, h: Math.max(3, m.h * notesHeight - 1) };
  }

  /** A mark's outline: the shape of its role. */
  function path(m: RollMark): string {
    const { x, y, w, h } = box(m);
    const r = (v: number) => v.toFixed(1);
    if (m.shape === 'chevron') {
      const tip = Math.min(h * 0.7, w * 0.5);
      return `M${r(x)} ${r(y)}H${r(x + w - tip)}L${r(x + w)} ${r(y + h / 2)}L${r(x + w - tip)} ${r(y + h)}H${r(x)}L${r(x + tip * 0.45)} ${r(y + h / 2)}Z`;
    }
    if (m.shape === 'pill') {
      const k = Math.min(h / 2, w / 2);
      return `M${r(x + k)} ${r(y)}H${r(x + w - k)}A${r(k)} ${r(k)} 0 0 1 ${r(x + w - k)} ${r(y + h)}H${r(x + k)}A${r(k)} ${r(k)} 0 0 1 ${r(x + k)} ${r(y)}Z`;
    }
    return `M${r(x)} ${r(y)}H${r(x + w)}V${r(y + h)}H${r(x)}Z`;
  }

  const fill = (m: RollMark) =>
    m.pitch === null ? 'var(--muted)' : pitchColour(m.pitch % 12, octaveOf(m.pitch));
  /** The chords lie under the rest, the players' notes over the band's. */
  const LAYER: Readonly<Record<RollMark['voice'], number>> = {
    comp: 0,
    bass: 1,
    drums: 2,
    lead: 3,
  };
  const ordered = $derived(
    [...roll.marks].sort(
      (a, b) =>
        LAYER[a.voice] - LAYER[b.voice] || Number(a.player !== null) - Number(b.player !== null),
    ),
  );
</script>

<div class="room" bind:clientWidth={width} bind:clientHeight={height}>
  <svg class="roll" {width} {height} role="img" aria-label={label}>
    <rect class="strip" x="0" y={height - DRUM_STRIP} {width} height={DRUM_STRIP} />
    {#each roll.taken as t, i (i)}
      <rect
        class="taken"
        x={t.x * width + 1}
        y="1"
        width={Math.max(0, t.w * width - 2)}
        height={Math.max(0, height - 2)}
        rx="8"
        style:stroke={t.who}
      />
    {/each}
    {#each roll.bars as at, i (i)}
      <line class="bar" x1={at * width} x2={at * width} y1="0" y2={height} />
    {/each}
    {#each ordered as m, i (i)}
      <path class="halo" class:past={m.past} class:quiet={!m.sounds} d={path(m)} />
      <path
        class="mark {m.shape}"
        class:past={m.past}
        class:quiet={!m.sounds}
        data-voice={m.voice}
        data-player={m.player}
        d={path(m)}
        style:fill={fill(m)}
        style:stroke={m.who}
      />
    {/each}
    {#if roll.playhead !== null}
      <line class="now" x1={roll.playhead * width} x2={roll.playhead * width} y1="0" y2={height} />
    {/if}
  </svg>
</div>

<style>
  .room {
    position: relative;
    min-height: 180px;
    height: 100%;
  }
  .roll {
    position: absolute;
    inset: 0;
    display: block;
    border-radius: 12px;
    background: var(--surface);
    border: 1px solid var(--line);
  }
  .strip {
    fill: var(--bg);
    opacity: 0.6;
  }
  .bar {
    stroke: var(--line);
    stroke-width: 1;
  }
  /* A ring of the ground under each outline, so it stands off its fill and its neighbours. */
  .halo {
    fill: none;
    stroke: var(--surface);
    stroke-width: 5;
    stroke-linejoin: round;
  }
  .mark {
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .mark.block {
    stroke-width: 2.5;
  }
  .mark.square {
    stroke-width: 1.5;
  }
  .past {
    opacity: 0.4;
  }
  .quiet {
    opacity: 0.18;
  }
  .taken {
    fill: none;
    stroke-width: 2;
    stroke-dasharray: 5 4;
  }
  .now {
    stroke: var(--amber);
    stroke-width: 2;
  }
</style>
