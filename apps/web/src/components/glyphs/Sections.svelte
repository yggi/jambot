<!--
  The plan's glyph: the song as a strip, one segment for each section shown,
  side by side. The section playing is filled as far as its bar, so it
  advances with the band and is empty before anything is heard, and a section
  where the key changes carries a teal mark above it.
-->
<script lang="ts">
  import Glyph, { GLYPH_SIZE } from '../Glyph.svelte';

  interface Props {
    /** The sections shown, from the one playing. */
    sections: readonly { newKey: boolean }[];
    /** How far through the section playing the band is, 0 to 1, or null before anything is heard. */
    progress: number | null;
  }

  let { sections, progress }: Props = $props();

  const PAD = 3;
  const GAP = 1.5;
  const HEIGHT = 12;
  const TOP = (GLYPH_SIZE - HEIGHT) / 2 + 2;
  const room = $derived(
    (GLYPH_SIZE - 2 * PAD - GAP * (Math.max(sections.length, 1) - 1)) /
      Math.max(sections.length, 1),
  );
  const x = (i: number) => PAD + i * (room + GAP);
</script>

<Glyph>
  {#each sections as section, i (i)}
    <rect class="seg" x={x(i)} y={TOP} width={room} height={HEIGHT} rx="1.5" />
    {#if i === 0 && progress !== null}
      <rect
        class="fill"
        x={x(i)}
        y={TOP}
        width={room * Math.min(1, Math.max(0, progress))}
        height={HEIGHT}
        rx="1.5"
      />
    {/if}
    {#if section.newKey}
      <circle class="key" cx={x(i) + room / 2} cy={TOP - 5} r="2" />
    {/if}
  {/each}
</Glyph>

<style>
  .seg {
    fill: var(--glyph-dim);
    opacity: 0.35;
  }
  .fill {
    fill: var(--glyph-lit);
    transition: width 0.15s;
  }
  .key {
    fill: var(--glyph-accent);
  }
</style>
