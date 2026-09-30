<!--
  The style's glyph: a radar of its axes. One vertex to an axis, the first at
  the top and the rest clockwise, each as far from the centre as its axis is
  high, so a style is a shape and a preset a shape to recognise. The shape is
  a pure function of the values it is given, which the card draws from the
  style the band is at, so a glide moves it and nothing jumps. A ring at the
  top of the range and one at its middle stand behind it. An axis at nothing
  still leaves a small radius, so the shape never collapses.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';

  interface Props {
    /** One value per axis, 0 to 1. */
    values: readonly number[];
  }

  let { values }: Props = $props();

  const CENTRE = GLYPH_SIZE / 2;
  const INNER = 3;
  const OUTER = 18;

  /** The vertex of an axis at a value: `index` of `count` round from the top, clockwise. */
  const vertex = (index: number, count: number, value: number) => {
    const turn = (2 * Math.PI * index) / count;
    const r = INNER + (OUTER - INNER) * Math.min(1, Math.max(0, value));
    return { x: CENTRE + r * Math.sin(turn), y: CENTRE - r * Math.cos(turn) };
  };
  const corners = $derived(values.map((v, i) => vertex(i, values.length, v)));
  const ring = (at: number) =>
    values
      .map((_, i) => vertex(i, values.length, at))
      .map(({ x, y }) => `${x.toFixed(3)},${y.toFixed(3)}`)
      .join(' ');
  const shape = $derived(corners.map(({ x, y }) => `${x.toFixed(3)},${y.toFixed(3)}`).join(' '));
</script>

<Glyph>
  <polygon class="ring" points={ring(1)} />
  <polygon class="ring" points={ring(0.5)} />
  <polygon class="shape" points={shape} />
  {#each corners as corner, i (i)}
    <circle class="corner" cx={corner.x} cy={corner.y} r="1.6" />
  {/each}
</Glyph>

<style>
  .ring {
    fill: none;
    stroke: var(--glyph-dim);
    stroke-width: 0.6;
    opacity: 0.5;
  }
  .shape {
    fill: var(--glyph-lit);
    fill-opacity: 0.3;
    stroke: var(--glyph-lit);
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .corner {
    fill: var(--glyph-lit);
  }
</style>
