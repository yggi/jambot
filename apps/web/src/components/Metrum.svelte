<!--
  The metrum, folded to a header: the tempo the band plays and, under it,
  the meter and the swing in words. Unfolded, everything about time in one
  place: the tempo nudged within the style's licence, the bar drawn where the
  band plays it under the swing (a light mark on each step, the eighths the
  click's, counted), and the click itself, which is the band's own steps
  sounded on the song's meter, so it plays only while the band does. The
  swing is read here and set in the style, where it is one of its axes.
-->
<script lang="ts">
  import { BAR_STEPS } from '@jambot/engine';
  import type { Intent, TempoView } from '../conductor.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import { METER_NAME, barMarks, swingName } from '../metrum.ts';
  import Fold from './Fold.svelte';
  import Ruler from './Ruler.svelte';
  import TempoNudge from './TempoNudge.svelte';

  interface Props {
    tempo: TempoView;
    /** The swing the style is heading for, 0 to 1. */
    swing: number;
    metronome: Metronome;
    /** Whether the band plays: the click sounds with it. */
    playing: boolean;
    /** Whether a client follows its host's tempo, so it can't nudge. */
    following?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { tempo, swing, metronome, playing, following = false, onintent }: Props = $props();

  const marks = $derived(barMarks(swing, metronome.eighth));
  const word = $derived(swingName(swing));
  const doing = $derived(
    !metronome.on
      ? 'Off.'
      : !playing
        ? 'On: it clicks when the band plays.'
        : metronome.pulse === null
          ? 'On.'
          : `Pulse ${metronome.pulse + 1} of ${metronome.pulses}`,
  );
</script>

<Fold
  label="Metrum"
  name="{Math.round(tempo.bpm)} BPM"
  sub="{METER_NAME}, {word}{metronome.on ? ', clicking' : ''}"
>
  <TempoNudge {tempo} disabled={following} {onintent} />
  <Ruler
    label="The bar's {BAR_STEPS} steps where the band plays them, {word} ({Math.round(
      swing * 100,
    )} %)"
    span={BAR_STEPS}
    {marks}
  />
  <p class="caption">
    Swing {Math.round(swing * 100)} %, {word}: set with the style. A mark off its tick is the band
    playing that step late.
  </p>
  <div class="click" role="group" aria-label="Click">
    <button
      type="button"
      class="toggle"
      aria-pressed={metronome.on}
      onclick={() => (metronome.on = !metronome.on)}
    >
      Click
    </button>
    <label class="volume">
      Volume
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(metronome.volume * 100)}
        oninput={(e) => (metronome.volume = +e.currentTarget.value / 100)}
      />
    </label>
  </div>
  <p class="caption" aria-live="polite">{doing}</p>
</Fold>

<style>
  .caption {
    font-size: 13px;
    color: var(--muted);
  }
  .click {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 14px;
  }
  .toggle {
    min-height: 44px;
    padding: 0 20px;
    border-radius: 22px;
    background: var(--surface);
    border: 1px solid var(--line);
    font-weight: 600;
  }
  .toggle[aria-pressed='true'] {
    background: var(--amber);
    color: var(--on-amber);
    border-color: var(--amber);
  }
  .volume {
    display: grid;
    font-size: 14px;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--amber);
    min-height: 32px;
    margin: 0;
  }
</style>
