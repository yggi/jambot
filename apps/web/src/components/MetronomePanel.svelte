<!--
  The metronome: on its own next to the band, not part of it. A two-state
  blinker and a steps-in-bar counter follow the pulse heard; the meter
  picked decides how many pulses a bar has and how they group, so 3/4, 6/8
  and 12/8 click differently even at the same tempo (`@jambot/theory`'s
  `meterWeights`). It runs at the tempo given it, live.
-->
<script lang="ts">
  import type { MeterName } from '@jambot/theory';
  import type { Metronome } from '../metronome.svelte.ts';

  interface Props {
    metronome: Metronome;
  }

  let { metronome }: Props = $props();

  const METER_NAMES: MeterName[] = ['3/4', '4/4', '6/8', '12/8'];

  /** Alternates every pulse, so the blinker shows exactly two states. */
  const blinkOn = $derived(metronome.pulse !== null && metronome.pulse % 2 === 0);
  const pulseIndexes = $derived([...Array(metronome.pulses).keys()]);
</script>

<section class="metronome" aria-label="Metronome">
  <button
    type="button"
    class="toggle"
    aria-pressed={metronome.on}
    onclick={() => (metronome.on ? metronome.stop() : metronome.start())}
  >
    {metronome.on ? 'Stop metronome' : 'Start metronome'}
  </button>

  <div class="meters" role="group" aria-label="Meter">
    {#each METER_NAMES as name (name)}
      <button
        type="button"
        aria-pressed={metronome.meter === name}
        onclick={() => (metronome.meter = name)}
      >
        {name}
      </button>
    {/each}
  </div>

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

  <div class="watch" aria-hidden="true">
    <span class="blinker" class:on={blinkOn} class:downbeat={metronome.downbeat}></span>
    <div class="pulses">
      {#each pulseIndexes as i (i)}
        <i class:on={metronome.pulse !== null && i <= metronome.pulse} class:downbeat={i === 0}></i>
      {/each}
    </div>
  </div>
  <p class="count" aria-live="polite">
    {metronome.pulse === null
      ? 'Not running.'
      : `Pulse ${metronome.pulse + 1} of ${metronome.pulses}`}
  </p>
</section>

<style>
  .metronome {
    display: grid;
    gap: 10px;
  }
  .toggle {
    justify-self: start;
    min-height: 44px;
    padding: 0 20px;
    border: 0;
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
  .meters {
    display: flex;
    gap: 8px;
  }
  .meters button {
    flex: none;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 18px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 14px;
    font-weight: 500;
  }
  .meters button[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
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
  .watch {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .blinker {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--line);
    flex: none;
  }
  .blinker.on {
    background: var(--muted);
  }
  .blinker.on.downbeat {
    background: var(--amber);
  }
  .pulses {
    display: flex;
    gap: 5px;
    flex: 1;
  }
  .pulses i {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--line);
  }
  .pulses i.downbeat {
    height: 12px;
    margin-top: -2px;
  }
  .pulses i.on {
    background: var(--amber);
  }
  .count {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
  }
</style>
