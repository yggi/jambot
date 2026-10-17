<!--
  The Melody view (#327): where a person plays along on the lead. A roll
  over the keys, its columns the keys themselves, so a note the band means
  to play falls onto the key that plays it; and the keys, filling the width.
  Its header says the chord sounding and the scale the lead walks, and holds
  the scale lock (the keys of the scale alone, each wider, so no note struck
  is out of it) and the octave the keys and the roll are in. Both are this
  device's, and neither changes what the band plays.
-->
<script lang="ts">
  import type { BarView, ChordView } from '../hud.ts';
  import { keyboardLayout } from '@yggi/webmidi/core';
  import { KEYBOARD_HIGH, KEYBOARD_LOW, scaleLayout } from '../keyboard.ts';
  import { rollBars, rollNotes } from '../rollView.ts';
  import type { TracksView } from '../tracks.ts';
  import Keyboard from './Keyboard.svelte';
  import Roll from './Roll.svelte';

  interface Props {
    tracks: TracksView;
    /** The bar heard: its key and the melodic scale the lead walks over it. */
    bar: Pick<BarView, 'key' | 'melodic' | 'melodicName'> | null;
    chord: ChordView | null;
    /** Notes held on the keys now, from any source. */
    down: ReadonlySet<number>;
    /** The band's lead notes sounding now. */
    sounding: readonly number[];
    onnote: (note: number, velocity: number, on: boolean) => void;
  }

  let { tracks, bar, chord, down, sounding, onnote }: Props = $props();

  /** The furthest the keys move from C4 to E5, in octaves either way. */
  const OCTAVES = 2;

  let locked = $state(false);
  let octave = $state(0);

  const scale = $derived(bar?.melodic ?? []);
  const low = $derived(KEYBOARD_LOW + 12 * octave);
  const high = $derived(KEYBOARD_HIGH + 12 * octave);
  const keys = $derived(
    locked && scale.length > 0 ? scaleLayout(low, high, scale) : keyboardLayout(low, high),
  );
  const lead = $derived(tracks.performers.find((p) => p.performer === 'lead'));
  const notes = $derived(
    tracks.playhead === null
      ? []
      : rollNotes({
          keys,
          playhead: tracks.playhead,
          band: lead?.notes ?? [],
          players: tracks.players
            .filter((p) => p.part === 'lead' && !p.heardAs)
            .map((p) => ({ notes: p.notes, colour: p.colour, local: p.local })),
        }),
  );
  const bars = $derived(
    tracks.playhead === null
      ? []
      : rollBars(
          tracks.frame.map((f) => f.start),
          tracks.playhead,
        ),
  );
  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const nameOf = (note: number) => NAMES[note % 12]! + (Math.floor(note / 12) - 1);
  const heading = $derived(
    [chord?.symbol, bar?.key, bar && bar.melodicName !== 'plain' ? bar.melodicName : null]
      .filter((part) => part)
      .join(' · '),
  );
</script>

<div class="melody">
  <div class="top">
    <span class="what" title={heading}>{heading}</span>
    <span class="legend"><i class="band"></i>band</span>
    <span class="legend"><i class="you"></i>you</span>
    <button
      type="button"
      class="chip"
      aria-pressed={locked}
      title="The scale’s notes alone, each key wider"
      onclick={() => (locked = !locked)}>Scale</button
    >
    <button
      type="button"
      class="chip"
      aria-label="Octave down"
      disabled={octave <= -OCTAVES}
      onclick={() => (octave -= 1)}>‹</button
    >
    <span class="range">{nameOf(low)}–{nameOf(high)}</span>
    <button
      type="button"
      class="chip"
      aria-label="Octave up"
      disabled={octave >= OCTAVES}
      onclick={() => (octave += 1)}>›</button
    >
  </div>
  <div class="roll">
    <Roll {keys} {notes} {bars} {scale} label="The lead, falling onto the keys" />
  </div>
  <div class="keys">
    <Keyboard {keys} named={locked} {down} {scale} {sounding} {onnote} />
  </div>
</div>

<style>
  .melody {
    display: grid;
    grid-template-rows: auto minmax(120px, 1fr) auto;
    height: 100%;
    min-height: 0;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 8px;
    font-size: 12px;
    color: var(--muted);
  }
  .what {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .legend {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .legend i {
    width: 9px;
    height: 9px;
    border-radius: 3px;
  }
  .band {
    background: var(--amber);
  }
  .you {
    background: var(--source-0);
  }
  .chip {
    height: 34px;
    min-width: 34px;
    padding: 0 9px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--muted);
    font-size: 12px;
    font-weight: 700;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--teal);
    background: var(--teal-bg);
    color: var(--teal);
  }
  .chip:disabled {
    opacity: 0.4;
  }
  .range {
    min-width: 54px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .roll {
    min-height: 0;
  }
  .keys {
    --keys-height: 168px;
  }
  @media (max-height: 500px) and (orientation: landscape) {
    .keys {
      --keys-height: 130px;
    }
  }
</style>
