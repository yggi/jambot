<!--
  The plan, a card: what the band decided ahead. Folded, the section heard
  and its bar in it ("Groove · bar 3 of 8", of `SECTION_BARS`) and, under
  it, the key heard and the key the band is heading for where that differs;
  the glyph is the song as a strip of its sections, the one playing filled as
  far as its bar. Before anything is heard it is ready, or waiting while the
  band starts, and says what the band opens on. Unfolded, the song map: the
  section playing and the next large, the three after smaller. The bar in the
  section is said here alone on the page, since the song map names the
  sections before anything is heard. The bars by chord are the chords card's.
-->
<script lang="ts">
  import { SECTION_BARS } from '@jambot/engine';
  import type { Hud } from '../hud.ts';
  import { keyName } from '../noteNames.ts';
  import Card from './Card.svelte';
  import Sections from './glyphs/Sections.svelte';
  import SongMap from './SongMap.svelte';

  interface Props {
    hud: Pick<Hud, 'bar' | 'beat' | 'sections' | 'heading'>;
    /** Whether the band is playing or about to. */
    playing: boolean;
  }

  let { hud, playing }: Props = $props();

  const heard = $derived(hud.beat !== null);
  const main = $derived(
    heard && hud.bar
      ? `${hud.bar.section} · bar ${hud.bar.barInSection + 1} of ${SECTION_BARS}`
      : playing
        ? '…'
        : 'Ready',
  );
  const heading = $derived(hud.heading && keyName(hud.heading));
  const keys = $derived(
    hud.bar && (heading && heading !== hud.bar.key ? `${hud.bar.key} → ${heading}` : hud.bar.key),
  );
  const sub = $derived(
    hud.bar && keys ? (heard ? keys : `Opens on ${hud.bar.section} · ${keys}`) : '',
  );
  const progress = $derived(heard && hud.bar ? (hud.bar.barInSection + 1) / SECTION_BARS : null);
</script>

{#snippet strip()}
  <Sections sections={hud.sections} {progress} />
{/snippet}

<Card title="Plan" {main} {sub} glyph={strip}>
  {#if hud.sections.length > 0}
    <SongMap sections={hud.sections} bar={heard ? (hud.bar?.bar ?? null) : null} />
  {/if}
</Card>
