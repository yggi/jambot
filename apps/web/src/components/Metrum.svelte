<!--
  The metrum, a card: the tempo the band plays under its heading and, under
  that, the meter and the swing. Unfolded, everything about time in one
  place: the tempo nudged within the style's licence, the swing as a gauge
  and as the shares it gives the eighths and the sixteenths (50 % straight, 67
  % the triplet), the bar drawn where the band plays it under the swing (a
  light mark on each step, the eighths counted), and the click itself, which
  is the band's own steps sounded on the song's clock, the pulses of the bar
  heard and the eighths or sixteenths between them if asked, so it plays only
  while the band does. The bar and the pulses are those of the meter the bar
  heard is in, whatever it is, and the drawing keeps its place when the meter
  changes. The swing is read here and set in the style, where it is one of
  its axes. The meter the next section takes is asked for here too (#262): the
  band takes it where the next section starts, as it does a key, and a
  client follows its host's, so its choice rests.
-->
<script lang="ts">
  import {
    SONG_CLOCK,
    SONG_METER,
    SUBDIVISIONS,
    type SongClock,
    type Subdivision,
    swingShares,
  } from '@jambot/engine';
  import { type Meter, stepsOf } from '@jambot/theory';
  import { barMarks, eighthHeard } from '../bar.ts';
  import type { Intent, TempoView } from '../conductor.ts';
  import { METER_CHOICES, meterLabel } from '../meter-choice.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import Bar from './Bar.svelte';
  import Card from './Card.svelte';
  import Gauge from './Gauge.svelte';
  import Blinker from './glyphs/Blinker.svelte';
  import Reading from './Reading.svelte';
  import Segmented from './Segmented.svelte';
  import TempoNudge from './TempoNudge.svelte';

  interface Props {
    tempo: TempoView;
    /** The swing the style is heading for, 0 to 1. */
    swing: number;
    metronome: Metronome;
    /** The step heard, or null before anything is: the bar's lamps light with it. */
    heard: number | null;
    /** The meter of the bar heard (or, before anything is, of the first), and the song's clock that says where its bar starts. */
    meter?: Meter | undefined;
    clock?: SongClock;
    /** Whether the band plays: the click sounds with it. */
    playing: boolean;
    /** Whether a client follows its host's tempo, so it can't nudge. */
    following?: boolean;
    onintent: (intent: Intent) => void;
    /** The meter asked for the next section, which the band takes where it starts. */
    asked?: Meter;
    onmeter?: (meter: Meter) => void;
  }

  let {
    tempo,
    swing,
    metronome,
    heard,
    meter = SONG_METER,
    clock = SONG_CLOCK,
    playing,
    following = false,
    onintent,
    asked = SONG_METER,
    onmeter = () => {},
  }: Props = $props();

  const marks = $derived(
    barMarks(meter, swing, eighthHeard(meter, heard === null ? null : clock.stepInBar(heard))),
  );
  const shares = $derived(swingShares(swing));
  /** What the first half of a beat holds, as a percentage: 50 straight, 67 the triplet. */
  const percent = $derived(Math.round(shares.eighth * 100));
  const secondary = $derived(Math.round(shares.sixteenth * 100));
  const SUBDIVISION_TEXT: Record<Subdivision, string> = {
    pulses: 'Pulses',
    eighths: 'Eighths',
    sixteenths: 'Sixteenths',
  };
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
  sub="{meterLabel(meter)} · swing {percent} %{secondary !== 50
    ? ` · 16ths ${secondary} %`
    : ''}{metronome.on ? ' · clicking' : ''}"
>
  {#snippet glyph()}<Blinker {marks} span={stepsOf(meter)} />{/snippet}
  <TempoNudge {tempo} disabled={following} {onintent} />
  <div class="swing">
    <Reading label="Swing" value="{percent} %" />
    <Reading label="Secondary swing" value="{secondary} %" />
    <Gauge label="Swing axis" from={0} to={1} centre={0} value={swing} fill />
  </div>
  <Bar {meter} {marks} under="at a swing of {percent} %" />
  <Segmented
    label="Meter for the next section"
    value={meterLabel(asked)}
    columns={4}
    disabled={following}
    options={METER_CHOICES.map((choice) => ({ value: choice.text, text: choice.text }))}
    onselect={(text) => onmeter(METER_CHOICES.find((choice) => choice.text === text)!.meter)}
  />
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
  <Segmented
    label="Click between the pulses"
    value={metronome.subdivision}
    columns={3}
    options={SUBDIVISIONS.map((value) => ({ value, text: SUBDIVISION_TEXT[value] }))}
    onselect={(value: Subdivision) => (metronome.subdivision = value)}
  />
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
