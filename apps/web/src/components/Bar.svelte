<!--
  A bar, drawn: a meter's steps on a ruler, each mark laid where the swing
  plays it, the eighths counted and the eighth heard lit. The metrum's bar
  and the meter screen's are this one, the song's 4/4 and any other meter.
-->
<script lang="ts">
  import { barStepsOf } from '../bar.ts';
  import Ruler, { type Mark } from './Ruler.svelte';
  import type { Meter } from '@jambot/theory';

  interface Props {
    meter: Meter;
    marks: readonly Mark[];
    /** What the bar says to a screen reader, after the steps: "at a swing of 62 %". */
    under: string;
  }

  let { meter, marks, under }: Props = $props();

  const span = $derived(barStepsOf(meter));
</script>

<Ruler label="The bar's {span} steps where the band plays them, {under}" {span} {marks} />
