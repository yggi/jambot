<!--
  The metronome (#259): a bar of any meter, played over and over on this
  device's own synth, to hear a meter, its swing and its accents. A meter,
  a tempo in quarters, the swing, the swing of a pulse of three eighths (which
  the band's own swing plays straight) and how far the accents are spread;
  a click, drums and a bass to play, and the hemiola, the bass regrouped onto
  the other meter's pulses. The bar is drawn where it is played, the eighth
  heard lit. It takes the player as a prop; the page runs it.
-->
<script lang="ts">
  import { METERS, type MeterName, degreeBelow, gaps } from '@jambot/theory';
  import { barMarks } from '../bar.ts';
  import Bar from '../components/Bar.svelte';
  import Segmented from '../components/Segmented.svelte';
  import { accentLine } from '../meter/grades.ts';
  import { BPM_RANGE, HEMIOLA, LAYERS, type Layer } from '../meter/bar-plan.ts';
  import type { MeterPlayer } from '../meter/meter-player.svelte.ts';
  import { meterMap } from '../meter/ternary.ts';

  interface Props {
    player: MeterPlayer;
    /** Back to the lobby. */
    onback: () => void;
  }

  let { player, onback }: Props = $props();

  // The eighth heard is redrawn with the screen.
  $effect(() => {
    if (!player.playing) return;
    let frame = 0;
    const step = () => {
      player.follow();
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  });

  const NAMES = Object.keys(METERS) as MeterName[];
  const LAYER_TEXT: Record<Layer, string> = { click: 'Click', drums: 'Drums', bass: 'Bass' };

  /** The bar drawn: the one heard while it plays, else the one chosen. */
  const shown = $derived(player.playing && player.heard ? player.heard.name : player.name);
  const meter = $derived(METERS[shown]);
  const lit = $derived(player.playing && player.heard?.name === shown ? player.heard.eighth : null);
  const marks = $derived(
    barMarks(meter, player.swing, lit, meterMap(meter, player.swing, player.ternary).played),
  );
  const chosen = $derived(METERS[player.name]);
  const line = $derived(accentLine(chosen, player.mirror));
  /** Whether the grouping can be read the other way round: only a run of five pulses or more has two. */
  const mirrorable = $derived(accentLine(chosen, true) !== accentLine(chosen, false));
  const hasTernary = $derived(gaps(chosen).includes(3));
  const partner = $derived(HEMIOLA[player.name]);
  const percent = (x: number) => `${Math.round(x * 100)} %`;
  const doing = $derived(
    !player.playing
      ? 'Stopped'
      : lit === null
        ? 'Starting'
        : `${shown} · pulse ${degreeBelow(meter, lit) + 1} of ${meter.heights.length}`,
  );
</script>

<div class="page">
  <section class="card" aria-label="Metronome">
    <div class="head">
      <h2>Metronome</h2>
      <button type="button" class="quiet" onclick={onback}>Back to the lobby</button>
    </div>
    <p class="message">
      A bar of any meter, played over and over. The tempo counts quarters, so 6/8 and 3/4 at one
      tempo are one bar. A meter, its swing and its accents change at the next bar.
    </p>

    <Segmented
      label="Meter"
      value={player.name}
      columns={5}
      options={NAMES.map((name) => ({ value: name, text: name }))}
      onselect={(name: MeterName) => (player.name = name)}
    />
    <p class="accents" aria-label="Accents">
      <span class="line">{line}</span>
      <span class="legend">* the bar · + its parts · - their parts · . eighths</span>
    </p>
    <button
      type="button"
      class="toggle"
      aria-pressed={player.mirror && mirrorable}
      disabled={!mirrorable}
      onclick={() => (player.mirror = !player.mirror)}
    >
      Mirror the grouping
    </button>

    <button
      type="button"
      class="primary"
      onclick={() => (player.playing ? player.stop() : void player.start())}
    >
      {player.playing ? 'Stop' : 'Play'}
    </button>
  </section>

  <section class="card" aria-label="The bar">
    <Bar {meter} {marks} under="at a swing of {percent(player.swing)}" />
    <p class="doing" aria-live="off">{doing}</p>
  </section>

  <section class="card" aria-label="Feel">
    <label class="slider">
      <span>Tempo <output>{Math.round(player.bpm)} BPM</output></span>
      <input
        type="range"
        aria-label="Tempo"
        min={BPM_RANGE.min}
        max={BPM_RANGE.max}
        step="1"
        value={player.bpm}
        oninput={(e) => (player.bpm = +e.currentTarget.value)}
      />
    </label>
    <label class="slider">
      <span>Swing <output>{percent(player.swing)}</output></span>
      <input
        type="range"
        aria-label="Swing"
        min="0"
        max="100"
        value={Math.round(player.swing * 100)}
        oninput={(e) => (player.swing = +e.currentTarget.value / 100)}
      />
    </label>
    <label class="slider">
      <span>Ternary swing <output>{percent(player.ternary)}</output></span>
      <input
        type="range"
        aria-label="Ternary swing"
        min="0"
        max="100"
        value={Math.round(player.ternary * 100)}
        oninput={(e) => (player.ternary = +e.currentTarget.value / 100)}
      />
    </label>
    {#if !hasTernary}
      <p class="hint">
        This meter has no pulse of three eighths: the ternary swing has nothing to move.
      </p>
    {/if}
    <label class="slider">
      <span>Accent grade <output>{percent(player.grade)}</output></span>
      <input
        type="range"
        aria-label="Accent grade"
        min="0"
        max="100"
        value={Math.round(player.grade * 100)}
        oninput={(e) => (player.grade = +e.currentTarget.value / 100)}
      />
    </label>
  </section>

  <section class="card" aria-label="Sound">
    <div class="layers" role="group" aria-label="Layers">
      {#each LAYERS as layer (layer)}
        <button
          type="button"
          class="toggle"
          aria-pressed={player.layers[layer]}
          onclick={() => (player.layers[layer] = !player.layers[layer])}
        >
          {LAYER_TEXT[layer]}
        </button>
      {/each}
      <button
        type="button"
        class="toggle"
        aria-pressed={player.hemiola && partner !== undefined}
        disabled={partner === undefined}
        onclick={() => (player.hemiola = !player.hemiola)}
      >
        Hemiola
      </button>
    </div>
    <p class="hint">
      {#if partner}
        The hemiola puts the bass on {partner}'s pulses, {gaps(METERS[partner]).join('+')}, over the
        same bar.
      {:else}
        The hemiola regroups a bar between 3/4 and 6/8.
      {/if}
    </p>
    <label class="slider">
      <span>Click volume <output>{percent(player.volume)}</output></span>
      <input
        type="range"
        aria-label="Click volume"
        min="0"
        max="100"
        value={Math.round(player.volume * 100)}
        oninput={(e) => (player.volume = +e.currentTarget.value / 100)}
      />
    </label>
  </section>
</div>

<style>
  .page {
    display: grid;
    gap: 14px;
  }
  .card {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }
  .message,
  .hint,
  .legend,
  .doing {
    font-size: 13px;
    color: var(--muted);
  }
  .accents {
    display: grid;
    gap: 2px;
  }
  .line {
    font-family: ui-monospace, monospace;
    font-size: 18px;
    letter-spacing: 0.08em;
    white-space: pre-wrap;
  }
  button {
    justify-self: start;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
  .primary {
    min-height: 48px;
    padding: 0 22px;
    border: 0;
    border-radius: 24px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 600;
    font-size: 16px;
  }
  .quiet {
    color: var(--muted);
  }
  .layers {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .toggle[aria-pressed='true'] {
    background: var(--amber);
    color: var(--on-amber);
    border-color: var(--amber);
  }
  .toggle:disabled {
    opacity: 0.5;
  }
  .slider {
    display: grid;
    gap: 2px;
    font-size: 14px;
  }
  .slider span {
    display: flex;
    justify-content: space-between;
  }
  output {
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--amber);
    min-height: 32px;
    margin: 0;
  }
</style>
