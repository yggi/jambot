<!--
  The plan, a card: what the band decided ahead. Folded, the section heard
  and its bar in it ("Groove · bar 3 of 8", of `SECTION_BARS`) and, under
  it, the key heard and the key the band is heading for where that differs.
  Before anything is heard it is ready, or waiting while the band starts,
  and says what the band opens on. Unfolded, the song map, its sections
  ahead with a new key named where it comes, and the bars ahead to the end
  of the next section. The bar in the section is said here alone on the
  page, since the song map names the sections before anything is heard.
-->
<script lang="ts">
  import { SECTION_BARS } from '@jambot/engine';
  import type { Hud } from '../hud.ts';
  import { keyName } from '../noteNames.ts';
  import Card from './Card.svelte';
  import NextBars from './NextBars.svelte';
  import SongMap from './SongMap.svelte';

  interface Props {
    hud: Pick<Hud, 'bar' | 'beat' | 'next' | 'sections' | 'heading'>;
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
  const ahead = $derived(hud.next.length);
</script>

<Card title="Plan" {main} {sub}>
  {#if hud.sections.length > 0}
    <SongMap sections={hud.sections} bar={heard ? (hud.bar?.bar ?? null) : null} />
  {/if}
  {#if hud.bar && ahead > 0}
    <div class="ahead">
      <span class="caption">Next {ahead} {ahead === 1 ? 'bar' : 'bars'}</span>
      <NextBars before={hud.bar} bars={hud.next} />
    </div>
  {/if}
</Card>

<style>
  .caption {
    font-size: 13px;
    color: var(--muted);
  }
</style>
