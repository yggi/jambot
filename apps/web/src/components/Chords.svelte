<!--
  The chords, a card: what is sounding. Folded, the chord heard and its
  numeral in its key and, under it, what the lead is doing, announced as it
  changes; before anything is heard, the chord the band opens on. Unfolded,
  the beats of the bar, one dot per beat of the song's meter, lit up to the
  one heard; the bar's chords on a `Ruler` of its steps, each where it
  starts, the one sounding lit; and the key heard with its notes, spelled in
  it, and the melodic scale the lead walks over it where it isn't plain
  ("A minor · pentatonic", #209). The card sits in the `Conductor` region, where the lead's line is read
  (`band.e2e.ts`, `session.e2e.ts`).
-->
<script lang="ts">
  import { SONG_METER } from '@jambot/engine';
  import { type Meter, meterOnSteps } from '@jambot/theory';
  import { type Hud, leadStatus } from '../hud.ts';
  import { scaleNoteNames } from '../noteNames.ts';
  import Fold from './Fold.svelte';
  import Ruler from './Ruler.svelte';

  interface Props {
    hud: Pick<Hud, 'bar' | 'beat' | 'chord'>;
    /** The meter the bar is in: the song's (`SONG_METER`), which the view model counts its beats on. */
    meter?: Meter;
  }

  let { hud, meter = SONG_METER }: Props = $props();

  /** The bar's steps, two to an eighth, whose degrees are its beats: the song's clock for one bar. */
  const clock = $derived(meterOnSteps(meter));
  const heard = $derived(hud.beat !== null);
  const name = $derived(hud.chord ? `${hud.chord.symbol} · ${hud.chord.numeral}` : '—');
  const chords = $derived(hud.bar?.chords ?? []);
  const marks = $derived(
    chords.map((chord) => ({
      at: chord.step,
      text: chord.symbol,
      lit: heard && chord.step === hud.chord?.step,
    })),
  );
  const notes = $derived(hud.bar ? scaleNoteNames(hud.bar.scale, hud.bar.tonic).join(' ') : '');
</script>

<section class="conductor" aria-label="Conductor">
  <Fold heading="Chords" {name} sub={leadStatus(hud)} live>
    <div class="beats" style:--beats={clock.heights.length} aria-hidden="true">
      {#each { length: clock.heights.length }, beat (beat)}
        <i class:on={hud.beat !== null && beat <= hud.beat}></i>
      {/each}
    </div>
    {#if chords.length > 0}
      <Ruler
        label="The bar's chords: {chords.map((chord) => chord.symbol).join(' ')}"
        span={clock.cycle}
        {marks}
      />
    {/if}
    {#if hud.bar}
      <div class="reading">
        <span
          >{hud.bar.key}{hud.bar.melodicName === 'plain' ? '' : ` · ${hud.bar.melodicName}`}</span
        ><b>{notes}</b>
      </div>
    {/if}
  </Fold>
</section>

<style>
  .conductor {
    min-width: 0;
  }
  .beats {
    display: grid;
    grid-template-columns: repeat(var(--beats), 1fr);
    gap: 5px;
  }
  .beats i {
    height: 8px;
    border-radius: 4px;
    background: var(--line);
  }
  .beats i.on {
    background: var(--amber);
  }
  .reading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
  }
</style>
