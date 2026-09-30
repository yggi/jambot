<!--
  The waterfall: the spectrum as it was over the last few seconds, a line
  for each look, the newest at the top, a band a column on the same
  logarithmic axis as the spectrum above it, louder lighter. The numbers are
  `tune/waterfall.ts`'s; this puts them on a canvas as one pixel a band, and
  the page scales it to the width it has.
-->
<script lang="ts">
  import { Waterfall } from '../tune/waterfall.ts';

  interface Props {
    /** The newest look's bands, in dB; each new array is one line. */
    bands: Float64Array | null;
    /** Whether the tuner listens: what was seen is cleared when it stops. */
    listening: boolean;
    /** How many looks are kept: 100 is five seconds at a look every 50 ms. */
    rows?: number;
  }

  let { bands, listening, rows = 100 }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let fall: Waterfall | undefined;
  let width = 0;

  $effect(() => {
    if (!canvas) return;
    if (!fall || fall.size !== rows) fall = new Waterfall(rows);
    if (!listening || !bands) {
      fall.clear();
      width = 0;
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (bands.length !== width) {
      width = bands.length;
      canvas.width = width;
      fall.clear();
    }
    fall.push(bands);
    const context = canvas.getContext('2d');
    if (!context) return;
    const pixels = fall.pixels(width);
    context.putImageData(new ImageData(pixels, width, rows), 0, 0);
  });
</script>

<div class="fall" role="img" aria-label="Spectrum over the last five seconds">
  <canvas bind:this={canvas} width="1" height={rows} aria-hidden="true"></canvas>
</div>

<style>
  .fall {
    border-radius: 6px;
    background: #0a0e1e;
    overflow: hidden;
  }
  canvas {
    display: block;
    width: 100%;
    height: 120px;
  }
</style>
