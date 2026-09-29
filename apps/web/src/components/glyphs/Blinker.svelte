<!--
  The metrum's glyph: the bar as a beacon, its eighths as lamps round a
  circle, the downbeat at the top and the bar going clockwise, each lamp
  laid where the swing plays it (the same marks as the ruler in the card's
  details, less the faint sixteenths between). The downbeat is the largest
  lamp and teal, a pulse the next, an eighth between the smallest; each
  rests dim and the eighth heard is lit, so it blinks with the band and is
  still while it is stopped.
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
  const RADIUS = 14.5;
  /** A place on the span as a point on the circle: the span's start at the top, clockwise. */
  const onCircle = (place: number) => {
    const turn = (2 * Math.PI * place) / span;
    return { x: CENTRE + RADIUS * Math.sin(turn), y: CENTRE - RADIUS * Math.cos(turn) };
  };
  const lamps = $derived(marks.filter((mark) => !mark.faint));
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
      r={lamp.accent ? 4.2 : lamp.minor ? 2 : 3.2}
    />
  {/each}
</Glyph>

<style>
  .lamp {
    fill: var(--glyph-dim);
    transition:
      fill 0.12s,
      opacity 0.2s;
  }
  .lamp.accent {
    fill: var(--glyph-accent);
    opacity: 0.55;
  }
  .lamp.lit {
    fill: var(--glyph-lit);
    opacity: 1;
  }
  .lamp.accent.lit {
    fill: var(--glyph-accent);
  }
</style>
