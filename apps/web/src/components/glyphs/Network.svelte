<!--
  The session card's glyph: the players as a small network. The first node,
  the host or the lone player, is in the middle, the others round it, evenly, on
  one circle, each joined to the middle by a link and coloured as its
  player is on every screen (`--source-0` to `--source-5`). It pings once for
  each bar heard, a ring going out from the middle, so it beats with the
  band and is still while it is stopped.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';

  interface Props {
    /** Each node's player colour, from 0: the middle one first. */
    colours: readonly number[];
    /** The bar heard, or null before any: a new one pings. */
    bar: number | null;
  }

  let { colours, bar }: Props = $props();

  const CENTRE = GLYPH_SIZE / 2;
  const RADIUS = 13;
  const nodes = $derived(
    colours.map((colour, i) => {
      if (i === 0) return { colour, x: CENTRE, y: CENTRE, r: colours.length > 1 ? 4.6 : 6 };
      // Spread as if there were at least three round it, so two make a V, not a line through the middle.
      const turn = (2 * Math.PI * (i - 1)) / Math.max(colours.length - 1, 3);
      return {
        colour,
        x: CENTRE + RADIUS * Math.sin(turn),
        y: CENTRE - RADIUS * Math.cos(turn),
        r: 3.4,
      };
    }),
  );
</script>

<Glyph>
  {#each nodes.slice(1) as node, i (i)}
    <line class="link" x1={CENTRE} y1={CENTRE} x2={node.x} y2={node.y} />
  {/each}
  {#if bar !== null}
    {#key bar}
      <circle
        class="ping"
        cx={CENTRE}
        cy={CENTRE}
        r="5"
        style:stroke="var(--source-{colours[0] ?? 0})"
      />
    {/key}
  {/if}
  {#each nodes as node, i (i)}
    <circle
      class="node"
      cx={node.x}
      cy={node.y}
      r={node.r}
      style:fill="var(--source-{node.colour})"
    />
  {/each}
</Glyph>

<style>
  .link {
    stroke: var(--glyph-dim);
    stroke-width: 1.2;
    opacity: 0.7;
  }
  .ping {
    fill: none;
    stroke-width: 1.4;
    transform-origin: 20px 20px;
    animation: ping 0.7s ease-out forwards;
  }
  @keyframes ping {
    from {
      transform: scale(1);
      opacity: 0.9;
    }
    to {
      transform: scale(3.4);
      opacity: 0;
    }
  }
</style>
