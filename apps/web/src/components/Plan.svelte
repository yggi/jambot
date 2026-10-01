<!--
  The plan, a card: what the band decided ahead. Folded, the section heard
  and its bar in it ("Groove 3/8", of `SECTION_BARS`) and, under
  it, the key heard and the key the band is heading for where that differs;
  the glyph is the song as a strip of its sections, the one playing filled as
  far as its bar. Before anything is heard it is ready, or waiting while the
  band starts, and says what the band opens on. Unfolded, the song map: the
  section playing and the next large, the three after smaller. The bar in the
  section is said here alone on the page, since the song map names the
  sections before anything is heard. The bars by chord are the chords card's.
  The meter is chosen here too (#262): the band takes the one asked for where
  the next section starts, as it does the key, and the song map says each
  section's meter where it changes. A client follows its host's, so its choice
  rests.
-->
<script lang="ts">
  import { SECTION_BARS, SONG_METER } from '@jambot/engine';
  import type { Meter } from '@jambot/theory';
  import type { Hud } from '../hud.ts';
  import { METER_CHOICES, meterLabel } from '../meter-choice.ts';
  import { keyName } from '../noteNames.ts';
  import Card from './Card.svelte';
  import Sections from './glyphs/Sections.svelte';
  import Segmented from './Segmented.svelte';
  import SongMap from './SongMap.svelte';

  interface Props {
    hud: Pick<Hud, 'bar' | 'beat' | 'sections' | 'heading'>;
    /** Whether the band is playing or about to. */
    playing: boolean;
    /** The meter asked for, which the band takes at the next section. */
    meter?: Meter;
    /** Whether a client follows its host's meter, so it can't choose. */
    following?: boolean;
    onmeter?: (meter: Meter) => void;
  }

  let { hud, playing, meter = SONG_METER, following = false, onmeter = () => {} }: Props = $props();

  const heard = $derived(hud.beat !== null);
  const main = $derived(
    heard && hud.bar
      ? `${hud.bar.section} ${hud.bar.barInSection + 1}/${SECTION_BARS}`
      : playing
        ? '…'
        : 'Ready',
  );
  const heading = $derived(hud.heading && keyName(hud.heading));
  const keys = $derived(
    hud.bar && (heading && heading !== hud.bar.key ? `${hud.bar.key} → ${heading}` : hud.bar.key),
  );
  const sub = $derived(
    hud.bar && keys
      ? `${heard ? keys : `Opens on ${hud.bar.section} · ${keys}`} · ${hud.bar.meterName}`
      : '',
  );
  const progress = $derived(heard && hud.bar ? (hud.bar.barInSection + 1) / SECTION_BARS : null);
</script>

{#snippet strip()}
  <Sections sections={hud.sections} {progress} />
{/snippet}

<Card title="Plan" {main} {sub} glyph={strip}>
  <Segmented
    label="Meter for the next section"
    value={meterLabel(meter)}
    columns={4}
    disabled={following}
    options={METER_CHOICES.map((choice) => ({ value: choice.text, text: choice.text }))}
    onselect={(text) => onmeter(METER_CHOICES.find((choice) => choice.text === text)!.meter)}
  />
  {#if hud.sections.length > 0}
    <SongMap sections={hud.sections} bar={heard ? (hud.bar?.bar ?? null) : null} />
  {/if}
</Card>
