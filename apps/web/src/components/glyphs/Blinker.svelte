<!--
  The metrum's glyph: the bar as a beacon, its eighths as lamps round a
  circle, the downbeat at the top and the bar going clockwise, each lamp
  laid where the swing plays it (the same marks as the ruler in the card's
  details, less the faint sixteenths between). The downbeat is the largest
  lamp and teal, a pulse the next, an eighth between the smallest; each
  rests dim and the eighth heard is lit, so it blinks with the band and is
  still while it is stopped. The beat is strong: the lamp lit swells and a
  ring goes out from it (the downbeat's the widest and brightest), and it
  eases back over the next beat.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';
  import type { Mark } from '../Ruler.svelte';

  interface Props {
    marks: readonly Mark[];
    /** How many steps the marks are laid on. */
    span: number;
  }

  let { marks, span }: Props = $props();

  const CENTRE = GLYPH_SIZE / 2;
  const RADIUS = 12.5;
  /** A place on the span as a point on the circle: the span's start at the top, clockwise. */
  const onCircle = (place: number) => {
    const turn = (2 * Math.PI * place) / span;
    return { x: CENTRE + RADIUS * Math.sin(turn), y: CENTRE - RADIUS * Math.cos(turn) };
  };
  const lamps = $derived(marks.filter((mark) => !mark.faint));
  const radiusOf = (lamp: Mark) => (lamp.accent ? 4.2 : lamp.minor ? 2 : 3.2);
</script>

<Glyph>
  {#each lamps as lamp, i (i)}
    <circle
      class="lamp"
      class:accent={lamp.accent}
      class:minor={lamp.minor}
      class:lit={lamp.lit}
      cx={onCircle(lamp.at).x}
      cy={onCircle(lamp.at).y}
      r={radiusOf(lamp)}
    />
    {#if lamp.lit}
      <circle
        class="halo"
        class:accent={lamp.accent}
        cx={onCircle(lamp.at).x}
        cy={onCircle(lamp.at).y}
        r={radiusOf(lamp)}
      />
    {/if}
  {/each}
</Glyph>

<style>
  .lamp {
    fill: var(--glyph-dim);
    opacity: 0.5;
    transform-box: fill-box;
    transform-origin: center;
    transition:
      fill 0.4s,
      opacity 0.4s,
      transform 0.4s ease-out;
  }
  .lamp.accent {
    fill: var(--glyph-accent);
    opacity: 0.7;
  }
  .lamp.lit {
    fill: var(--glyph-lit);
    opacity: 1;
    transform: scale(1.5);
    transition-duration: 0.04s;
  }
  .lamp.accent.lit {
    fill: var(--glyph-accent);
    transform: scale(1.6);
  }
  /* A ring goes out from the lamp as it lights. */
  .halo {
    fill: none;
    stroke: var(--glyph-lit);
    stroke-width: 1.6;
    transform-box: fill-box;
    transform-origin: center;
    pointer-events: none;
    animation: halo 0.5s ease-out forwards;
  }
  .halo.accent {
    stroke: var(--glyph-accent);
    stroke-width: 2.2;
    animation-duration: 0.7s;
  }
  @keyframes halo {
    from {
      transform: scale(1.3);
      opacity: 0.9;
    }
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
</style>
