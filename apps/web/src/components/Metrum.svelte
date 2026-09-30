<!--
  The metrum, a card: the tempo the band plays under its heading and, under
  that, the meter and the swing. Unfolded, everything about time in one
  place: the tempo nudged within the style's licence, the swing as a gauge,
  the bar drawn where the band plays it under the swing (a light mark on
  each step, the eighths the click's, counted), and the click itself, which
  is the band's own steps sounded on the song's meter, so it plays only
  while the band does. The swing is read here and set in the style, where it
  is one of its axes.
-->
<script lang="ts">
  import { BAR_STEPS, SONG_METER } from '@jambot/engine';
  import type { Intent, TempoView } from '../conductor.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import { METER_NAME, barMarks, eighthHeard } from '../metrum.ts';
  import Bar from './Bar.svelte';
  import Card from './Card.svelte';
  import Gauge from './Gauge.svelte';
  import Blinker from './glyphs/Blinker.svelte';
  import Reading from './Reading.svelte';
  import TempoNudge from './TempoNudge.svelte';

  interface Props {
    tempo: TempoView;
    /** The swing the style is heading for, 0 to 1. */
    swing: number;
    metronome: Metronome;
    /** The step heard, or null before anything is: the bar's lamps light with it. */
    heard: number | null;
    /** Whether the band plays: the click sounds with it. */
    playing: boolean;
    /** Whether a client follows its host's tempo, so it can't nudge. */
    following?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { tempo, swing, metronome, heard, playing, following = false, onintent }: Props = $props();

  const marks = $derived(barMarks(swing, eighthHeard(heard)));
  const percent = $derived(Math.round(swing * 100));
  const doing = $derived(
    !metronome.on
      ? 'Off'
      : !playing
        ? 'Waiting for the band'
        : metronome.pulse === null
          ? 'On'
          : `Pulse ${metronome.pulse + 1} of ${metronome.pulses}`,
  );
</script>

<Card
  title="Metrum"
  main="{Math.round(tempo.bpm)} BPM"
  sub="{METER_NAME} · swing {percent} %{metronome.on ? ' · clicking' : ''}"
>
  {#snippet glyph()}<Blinker {marks} span={BAR_STEPS} />{/snippet}
  <TempoNudge {tempo} disabled={following} {onintent} />
  <div class="swing">
    <Reading label="Swing" value="{percent} %" />
    <Gauge label="Swing {percent} %" from={0} to={1} centre={0} value={swing} fill />
  </div>
  <Bar meter={SONG_METER} {marks} under="at a swing of {percent} %" />
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
      Click volume
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(metronome.volume * 100)}
        oninput={(e) => (metronome.volume = +e.currentTarget.value / 100)}
      />
    </label>
  </div>
  <p class="doing" aria-live="polite">{doing}</p>
</Card>

<style>
  .swing {
    display: grid;
    gap: 8px;
  }
  .doing {
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
