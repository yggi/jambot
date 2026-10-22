<!--
  The metrum, a card: the tempo the band plays under its heading and, under
  that, the meter and its swing. Unfolded, everything about time in one
  place: the tempo nudged within the style's licence, the meter's swing (#360)
  as the level it leans, the 8ths or the 16ths, and the share of each span
  there its first half holds (50 % straight, 67 % the triplet), the bar drawn
  where the band plays it under the swing (a light mark on each step, the
  eighths counted), and the click itself, which is the band's own steps
  sounded on the song's clock, the pulses of the bar heard and the eighths or
  sixteenths between them if asked, so it plays only while the band does. The
  bar and the pulses are those of the meter the bar heard is in, whatever it
  is, and the drawing keeps its place when the meter changes. The swing is
  set here: a preset's is the one of the meter the repository finds at its
  point, the share glides over a bar from here,
  and a level asked for is taken where the next section starts, as the meter
  asked for here is (#262), and as a key is; a meter swung on the 8ths brings
  in the jazz kit and the walking bass. With no meter asked for ("By style",
  as at first), the composer asks cells' repository at each section's start
  for the meter nearest the style, with its swing (#375); a meter or a swing
  set here asks for one, and wins. A client follows its host's, so its
  choices rest.
-->
<script lang="ts">
  import {
    type MeterSwing,
    SHARE,
    SONG_CLOCK,
    SONG_METER,
    SUBDIVISIONS,
    SWING_LEVELS,
    type SongClock,
    type Subdivision,
    type SwingLevel,
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
    /** The meter's swing asked for: the level the next section takes, and the share it is heading for. */
    swing: MeterSwing;
    /** The level the bar heard swings on (or, before anything is, the one asked for). */
    level?: SwingLevel | undefined;
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
    /** The meter asked for the next section, which the band takes where it starts; null for none, the repository's. */
    asked?: Meter | null;
    onmeter?: (meter: Meter | null) => void;
  }

  let {
    tempo,
    swing,
    level = swing.level,
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

  /** The choice that asks for no meter: the composer's, from the repository (#375). */
  const BY_STYLE = 'By style';
  /** The swing as the bar heard plays it: its level, at the share asked for. */
  const heardSwing = $derived({ level, share: swing.share });
  const marks = $derived(
    barMarks(meter, heardSwing, eighthHeard(meter, heard === null ? null : clock.stepInBar(heard))),
  );
  /** What the first half of a span at its level holds, as a percentage: 50 straight, 67 the triplet. */
  const percent = $derived(Math.round(swing.share * 100));
  const LEVEL_TEXT: Record<SwingLevel, string> = { '8n': '8ths', '16n': '16ths' };
  /** The level as the header says it: the one heard, and the one asked for where the next section changes it. */
  const levelText = $derived(
    level === swing.level
      ? LEVEL_TEXT[level]
      : `${LEVEL_TEXT[level]}, ${LEVEL_TEXT[swing.level]} next section`,
  );
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
  sub="{meterLabel(meter)} · swing {percent} % on {levelText}{metronome.on ? ' · clicking' : ''}"
>
  {#snippet glyph()}<Blinker {marks} span={stepsOf(meter)} />{/snippet}
  <TempoNudge {tempo} disabled={following} {onintent} />
  <div class="swing">
    <Segmented
      label="Swing on"
      value={swing.level}
      columns={2}
      disabled={following}
      options={SWING_LEVELS.map((value) => ({ value, text: LEVEL_TEXT[value] }))}
      onselect={(value: SwingLevel) => onintent({ kind: 'swing', swing: { level: value } })}
    />
    <Reading label="Swing" value="{percent} %" />
    <div class="drag">
      <Gauge
        label="Swing {percent} %"
        from={SHARE.min}
        to={SHARE.max}
        centre={SHARE.min}
        value={swing.share}
        fill
      />
      <input
        type="range"
        min={SHARE.min * 100}
        max={SHARE.max * 100}
        aria-label="Swing"
        value={percent}
        disabled={following}
        oninput={(e) => onintent({ kind: 'swing', swing: { share: +e.currentTarget.value / 100 } })}
      />
    </div>
  </div>
  <Bar {meter} {marks} under="at a swing of {percent} %" />
  <Segmented
    label="Meter for the next section"
    value={asked === null ? BY_STYLE : meterLabel(asked)}
    columns={4}
    disabled={following}
    options={[BY_STYLE, ...METER_CHOICES.map((choice) => choice.text)].map((text) => ({
      value: text,
      text,
    }))}
    onselect={(text) =>
      onmeter(METER_CHOICES.find((choice) => choice.text === text)?.meter ?? null)}
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
  .drag {
    position: relative;
    display: grid;
    align-items: center;
    padding-block: 8px;
  }
  /* The range input lies over the gauge, unseen: it takes the finger and the keyboard. */
  .drag input[type='range'] {
    position: absolute;
    inset: 0;
    height: 100%;
    min-height: 0;
    opacity: 0;
    cursor: pointer;
  }
  .drag:has(input:focus-visible) {
    outline: 2px solid var(--amber);
    outline-offset: 2px;
    border-radius: 6px;
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
