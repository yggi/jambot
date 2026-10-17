<!--
  The metronome (#259): a bar of any meter, played over and over on this
  device's own synth, to hear a meter, its swing and its accents. A meter,
  a tempo in quarters, the swing of the eighths and the secondary swing of the
  sixteenths (each the share of its span the first half holds: 50 straight, 67
  triplet, below 50 early), the lean of a pulse of three eighths (which the
  band's own swing plays straight) and how far the accents are spread; a
  click on the pulses, and the eighths or sixteenths if asked, drums and a
  bass to play, and the hemiola, the bass regrouped onto the other meter's
  pulses. The bar is drawn where it is played, the eighth heard lit. It takes
  the player as a prop; the page runs it.
-->
<script lang="ts">
  import { METERS, type MeterName, accentLine, degreeBelow, gaps } from '@jambot/theory';
  import { marksPlayed } from '../bar.ts';
  import Bar from '../components/Bar.svelte';
  import Segmented from '../components/Segmented.svelte';
  import {
    BPM_RANGE,
    HEMIOLA,
    LAYERS,
    type Layer,
    SUBDIVISIONS,
    type Subdivision,
  } from '../meter/bar-plan.ts';
  import type { MeterPlayer } from '../meter/meter-player.svelte.ts';
  import { meterMap } from '../meter/ternary.ts';

  interface Props {
    player: MeterPlayer;
  }

  let { player }: Props = $props();

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
    marksPlayed(
      meter,
      meterMap(meter, { eighth: player.swing, sixteenth: player.secondary }, player.ternary).played,
      lit,
    ),
  );
  const chosen = $derived(METERS[player.name]);
  const line = $derived(accentLine(chosen, player.mirror));
  /** Whether the grouping can be read the other way round: only a run of five pulses or more has two. */
  const mirrorable = $derived(accentLine(chosen, true) !== accentLine(chosen, false));
  const hasTernary = $derived(gaps(chosen).includes(3));
  const partner = $derived(HEMIOLA[player.name]);
  const percent = (x: number) => `${Math.round(x * 100)} %`;
  /** A share as the slider says it: 50 % straight, over it late, under it early. */
  const SHARE_RANGE = { min: 25, max: 75 } as const;
  const SUBDIVISION_TEXT: Record<Subdivision, string> = {
    pulses: 'Pulses',
    eighths: 'Eighths',
    sixteenths: 'Sixteenths',
  };
  /** What the click leaves out that the swing would move. */
  const silent = $derived(
    player.layers.click &&
      !player.layers.drums &&
      ((player.subdivision === 'pulses' && (player.swing !== 0.5 || player.secondary !== 0.5)) ||
        (player.subdivision === 'eighths' && player.secondary !== 0.5)),
  );
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
    <p class="message">
      A bar of any meter, played over and over. The tempo counts quarters, so 6/8 and 3/4 at one
      tempo are one bar. What the composer writes and what the players may bend are kept apart: the
      signature, then the licence. A change takes hold at the next bar.
    </p>
  </section>

  <section class="card" aria-label="Signature">
    <h3>Signature <span class="whose">the composer's, written in the score</span></h3>
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
  </section>

  <section class="card" aria-label="The bar">
    <Bar
      {meter}
      {marks}
      under="at a swing of {percent(player.swing)}, secondary {percent(player.secondary)}"
    />
    <p class="doing" aria-live="off">{doing}</p>
  </section>

  <section class="card" aria-label="Licence">
    <h3>Licence <span class="whose">the players' to bend, within what is written</span></h3>
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
        min={SHARE_RANGE.min}
        max={SHARE_RANGE.max}
        value={Math.round(player.swing * 100)}
        oninput={(e) => (player.swing = +e.currentTarget.value / 100)}
      />
    </label>
    <label class="slider">
      <span>Secondary swing <output>{percent(player.secondary)}</output></span>
      <input
        type="range"
        aria-label="Secondary swing"
        min={SHARE_RANGE.min}
        max={SHARE_RANGE.max}
        value={Math.round(player.secondary * 100)}
        oninput={(e) => (player.secondary = +e.currentTarget.value / 100)}
      />
    </label>
    <p class="hint">
      50 % is straight, 67 % the triplet, 75 % the dotted figure; under 50 % the offbeat comes
      early. The swing moves the second eighth of a beat, the secondary swing the second sixteenth
      of each half-beat. A pulse itself never moves.
    </p>
    <label class="slider">
      <span>Ternary lean <output>{Math.round(player.ternary * 100)} %</output></span>
      <input
        type="range"
        aria-label="Ternary lean"
        min="-100"
        max="100"
        value={Math.round(player.ternary * 100)}
        oninput={(e) => (player.ternary = +e.currentTarget.value / 100)}
      />
    </label>
    {#if hasTernary}
      <p class="hint">
        The lean moves the second and third eighths of a pulse of three together: late, the pulse
        goes long, short, short; early, short, long, long.
      </p>
    {:else}
      <p class="hint">
        This meter has no pulse of three eighths: the ternary lean has nothing to move.
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
    <button
      type="button"
      class="toggle"
      aria-pressed={player.hemiola && partner !== undefined}
      disabled={partner === undefined}
      onclick={() => (player.hemiola = !player.hemiola)}
    >
      Hemiola
    </button>
    <p class="hint">
      {#if partner}
        The hemiola puts the bass on {partner}'s pulses, {gaps(METERS[partner]).join('+')}, over the
        same bar.
      {:else}
        The hemiola regroups a bar between 3/4 and 6/8.
      {/if}
    </p>
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
    </div>
    <Segmented
      label="Click between the pulses"
      value={player.subdivision}
      columns={3}
      options={SUBDIVISIONS.map((value) => ({ value, text: SUBDIVISION_TEXT[value] }))}
      onselect={(value: Subdivision) => (player.subdivision = value)}
    />
    {#if silent}
      <p class="hint">
        The swing moves what is between the pulses, and the click does not sound it: choose the
        eighths, or the sixteenths for the secondary swing, to hear it.
      </p>
    {/if}
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
    /* As wide as the view, whatever a plot in it would like. */
    grid-template-columns: minmax(0, 1fr);
    gap: 14px;
  }
  .card {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px 14px;
  }
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
  }
  h3 {
    font-size: 14px;
  }
  .whose {
    font-weight: 400;
    color: var(--muted);
    margin-left: 6px;
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
