<!--
  The chords, a card: what is sounding. Folded, the chord heard and its
  numeral in its key ("Am7 · i7") over the chord that comes next and the beats
  until it ("next G · VII in 3", counting down 4, 3, 2, 1 to the bar after), and a glyph of the bar: a block for each of its chords, the one
  sounding lit, a playhead stepping across with the beat. Before anything is
  heard it is the chord the band opens on. Unfolded, the bars by chord (the
  chord grid): the bar heard and the next large, six more smaller, eight in
  all, a change of section or key labelled at its bar. The key and its notes
  are the key card's; the lead's status is the tracks'.
-->
<script lang="ts">
  import { SONG_METER } from '@jambot/engine';
  import { type Meter, meterOnSteps } from '@jambot/theory';
  import type { Hud } from '../hud.ts';
  import { beatsToNext, nextChord } from '../planView.ts';
  import Card from './Card.svelte';
  import ChordGrid from './ChordGrid.svelte';
  import ChordStrip from './glyphs/ChordStrip.svelte';

  interface Props {
    hud: Pick<Hud, 'bar' | 'beat' | 'chord' | 'next'>;
    /** The meter the bar is in: the song's (`SONG_METER`), which the view model counts its beats on. */
    meter?: Meter;
  }

  let { hud, meter = SONG_METER }: Props = $props();

  /** The bar's steps, two to an eighth, whose degrees are its beats: the song's clock for one bar. */
  const clock = $derived(meterOnSteps(meter));
  const heard = $derived(hud.beat !== null);
  const main = $derived(hud.chord ? `${hud.chord.symbol} · ${hud.chord.numeral}` : '—');
  const coming = $derived(nextChord(hud));
  const count = $derived(beatsToNext(hud, clock.heights, clock.cycle));
  const sub = $derived(
    coming
      ? `next ${coming.symbol} · ${coming.numeral}${count === null ? '' : ` in ${count}`}`
      : '',
  );
  const lit = $derived(
    heard && hud.chord
      ? (hud.bar?.chords.findIndex((c) => c.step === hud.chord?.step) ?? null)
      : null,
  );
</script>

{#snippet strip()}
  <ChordStrip
    steps={hud.bar?.chords.map((c) => c.step) ?? []}
    {lit}
    beat={hud.beat}
    span={clock.cycle}
    beats={meter.heights.length}
  />
{/snippet}

<Card title="Chords" {main} {sub} glyph={strip}>
  <ChordGrid heard={hud.bar} next={hud.next} beat={hud.beat} {meter} />
</Card>
