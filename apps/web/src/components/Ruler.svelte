<!--
  A ruler: a span cut into equal steps, a tick on each, and marks laid on
  it at places that need not be ticks. The scale is one (12 semitones, a
  mark on each note of the key) and the bar is another (16 steps, a mark on
  each eighth where the swing plays it): where a mark sits off its tick is
  what the ruler shows. A mark may be accented, dimmed (a subdivision) or lit
  (heard now), and says a word under it.
-->
<script module lang="ts">
  export interface Mark {
    /** Its place on the span, in steps; a tick's place where it is a whole one. */
    at: number;
    /** A word under it. */
    text?: string | undefined;
    /** The one the ruler is anchored on: the tonic, the bar's downbeat. */
    accent?: boolean;
    /** Lesser than the others. */
    minor?: boolean;
    /** A step only, not a note: small and faint. */
    faint?: boolean;
    /** Sounding now. */
    lit?: boolean;
  }
</script>

<script lang="ts">
  interface Props {
    /** What the ruler says to a screen reader. */
    label: string;
    /** How many steps the span has, so it has a tick more. */
    span: number;
    marks: readonly Mark[];
  }

  let { label, span, marks }: Props = $props();

  const WIDTH = 264;
  const PAD = 14;
  const at = (place: number) => PAD + (place * WIDTH) / span;
</script>

<svg class="ruler" viewBox="0 0 {2 * PAD + WIDTH} 50" role="img" aria-label={label}>
  <line class="axis" x1={at(0)} x2={at(span)} y1="16" y2="16" />
  {#each { length: span + 1 }, step (step)}
    <line class="tick" x1={at(step)} x2={at(step)} y1="11" y2="21" />
  {/each}
  {#each marks as mark, i (i)}
    <circle
      class="mark"
      class:accent={mark.accent}
      class:minor={mark.minor}
      class:faint={mark.faint}
      class:lit={mark.lit}
      cx={at(mark.at)}
      cy="16"
      r={mark.faint ? 2.5 : mark.minor ? 4.5 : 7}
    />
    {#if mark.text}
      <text class="word" class:accent={mark.accent} x={at(mark.at)} y="44">{mark.text}</text>
    {/if}
  {/each}
</svg>

<style>
  .ruler {
    display: block;
    width: 100%;
    max-width: 420px;
    margin-inline: auto;
  }
  .axis,
  .tick {
    stroke: var(--line);
    stroke-width: 1;
  }
  .mark {
    fill: var(--amber);
  }
  .mark.minor {
    opacity: 0.6;
  }
  .mark.faint {
    opacity: 0.45;
  }
  .mark.accent {
    fill: var(--teal);
  }
  .mark.lit {
    stroke: var(--ink);
    stroke-width: 2;
    opacity: 1;
  }
  .word {
    text-anchor: middle;
    font-size: 12px;
    fill: var(--ink);
  }
  .word.accent {
    fill: var(--teal);
    font-weight: 700;
  }
</style>
