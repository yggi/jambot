<!--
  The roll: the lead's notes over the keys that play them (#327). Its
  columns are the keys under it; the steps ahead are above the line of the
  step heard, falling toward it, and those played below it. The band's notes
  ahead are faint (foreseen, as the band means to play them) and those played
  full; every note is filled in its pitch's colour (`pitch.ts`), shaped by its
  voice as the Mix view's roll shapes it (`SHAPES`: the lead's a chevron, here
  pointing down the way it falls, the chords' a pill, the bass's a block) and
  outlined in who played it, the band's voice's shade or a player's colour;
  the band's other voices lie faint behind the lead where the keys reach
  them; a faint column marks
  each note of the scale, and a dashed line each bar's start. A note above
  the keys is a thin mark at the right edge, one below them at the left, so
  a person sees which way to move the octave. Its places are
  fractions of the roll (`rollView.ts`), drawn on a square stretched to fill
  whatever room the view gives it.
-->
<script lang="ts">
  import type { KeyLayout } from '@yggi/webmidi/core';
  import { SHAPES } from '../bandRoll.ts';
  import { pitchColour } from '../pitch.ts';
  import { NOW_AT, type RollNote } from '../rollView.ts';

  interface Props {
    keys: readonly KeyLayout[];
    notes: readonly RollNote[];
    /** Where bars start, from the top. */
    bars: readonly number[];
    /** The scale's notes, as pitch classes: their columns are marked. */
    scale?: readonly number[];
    label: string;
  }

  let { keys, notes, bars, scale = [], label }: Props = $props();

  /** Who played a note: the band's voice's shade, a player in their colour. */
  const who = (n: RollNote) =>
    n.kind === 'own' || n.kind === 'other'
      ? `var(--source-${n.colour ?? 0})`
      : `var(--voice-${n.voice})`;

  /** A note's outline in the roll's units: its voice's shape, a chevron pointing down the way it falls. */
  function path(n: RollNote): string {
    const x = n.left * 100 + 0.6;
    const w = Math.max(0.4, n.width * 100 - 1.2);
    const y = n.top * 100;
    const h = Math.max(0.4, n.height * 100 - 0.4);
    const f = (v: number) => v.toFixed(2);
    const shape = SHAPES[n.voice];
    if (shape === 'chevron') {
      const tip = Math.min(h * 0.5, 2.2);
      const notch = Math.min(tip * 0.5, h / 3);
      return `M${f(x)} ${f(y)}L${f(x + w / 2)} ${f(y + notch)}L${f(x + w)} ${f(y)}V${f(y + h - tip)}L${f(x + w / 2)} ${f(y + h)}L${f(x)} ${f(y + h - tip)}Z`;
    }
    if (shape === 'pill') {
      const r = Math.min(w / 2, h / 2, 1.2);
      return `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
    }
    return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  }
  /** C4 to B4 is the middle octave. */
  const octaveOf = (note: number) => Math.floor(note / 12) - 5;
</script>

<svg class="roll" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}>
  {#each keys as key (key.note)}
    {#if key.black}
      <rect class="black" x={key.left} y="0" width={key.width} height="100" />
    {/if}
    {#if scale.includes(key.note % 12)}
      <line
        class="scale"
        x1={key.left + key.width / 2}
        x2={key.left + key.width / 2}
        y1="0"
        y2="100"
      />
    {/if}
  {/each}
  {#each bars as y, i (i)}
    <line class="bar" x1="0" x2="100" y1={y * 100} y2={y * 100} />
  {/each}
  <rect class="past" x="0" y={NOW_AT * 100} width="100" height={(1 - NOW_AT) * 100} />
  {#each notes as n, i (i)}
    <path
      class="note {n.kind} {SHAPES[n.voice]}"
      d={path(n)}
      style:fill={pitchColour(n.note % 12, octaveOf(n.note))}
      stroke={who(n)}
    />
  {/each}
  <line class="now" x1="0" x2="100" y1={NOW_AT * 100} y2={NOW_AT * 100} />
</svg>

<style>
  .roll {
    display: block;
    width: 100%;
    height: 100%;
    border: 1px solid var(--line);
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    background: var(--surface);
  }
  .black {
    fill: var(--line);
    opacity: 0.35;
  }
  .scale {
    stroke: var(--teal);
    stroke-opacity: 0.2;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .bar {
    stroke: var(--muted);
    stroke-opacity: 0.4;
    stroke-dasharray: 3 4;
    vector-effect: non-scaling-stroke;
  }
  .past {
    fill: var(--bg);
    opacity: 0.25;
  }
  .note {
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  .note.played {
    opacity: 0.6;
  }
  .note.foreseen {
    fill-opacity: 0.4;
  }
  .note.backing {
    opacity: 0.3;
  }
  .note.block {
    stroke-width: 2;
  }
  .now {
    stroke: var(--amber);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
</style>
