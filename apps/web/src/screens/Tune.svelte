<!--
  The tuner (#269): listen to a microphone or a line in, and see the sound
  as a spectrum on a logarithmic axis, with the note heard: its name, how
  many cents and Hz away, and a needle. A is 440 Hz unless the reference is
  set. It takes the tuner as a prop; the page runs it, and the screen only
  shows it.
-->
<script lang="ts">
  import Gauge from '../components/Gauge.svelte';
  import Waterfall from '../components/Waterfall.svelte';
  import { octaveMarks, spectrumPath, xOfHz } from '../tune/plot.ts';
  import type { Tuner } from '../tune/tuner.svelte.ts';

  interface Props {
    tuner: Tuner;
    /** Back to the lobby. */
    onback: () => void;
  }

  let { tuner, onback }: Props = $props();

  /** Within this many cents of a note the sound is called in tune. */
  const IN_TUNE_CENTS = 3;

  /** The references people tune to: baroque, the "verdi" A, and the usual. */
  const REFERENCES = [415, 432, 440];

  /** The plot is drawn at the width it is shown at, so its labels keep their size on a phone. */
  let shownWidth = $state(0);
  const plot = $derived({ width: shownWidth || 700, height: 140 });
  const marks = $derived(octaveMarks(plot.width));

  const reading = $derived(tuner.reading);
  const listening = $derived(tuner.status === 'listening');
  const db = $derived(tuner.analysis?.level.db ?? -Infinity);
  const path = $derived(tuner.analysis ? spectrumPath(tuner.analysis.bands, plot) : '');
  const sign = (x: number, digits: number) => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(digits);
  const frame = $derived(tuner.analysis?.frame ?? 0);
  const window = $derived(
    frame > 0 && tuner.analysis ? Math.round((frame / tuner.sampleRate) * 1000) : 0,
  );
</script>

<div class="page">
  <section class="card" aria-label="Tuner">
    <div class="head">
      <h2>Tuner</h2>
      <button type="button" class="quiet" onclick={onback}>Back to the lobby</button>
    </div>
    <p class="message">
      Hold a note in front of a microphone, or plug an instrument in, and read how far it is from
      the nearest note. A browser asks before it lets this page listen.
    </p>
    <button
      type="button"
      class="primary"
      disabled={tuner.status === 'starting'}
      onclick={() => (listening ? tuner.stop() : void tuner.start())}
    >
      {listening ? 'Stop' : tuner.status === 'starting' ? 'Starting…' : 'Start'}
    </button>
    {#if tuner.message}
      <p class="notice" role="status">{tuner.message}</p>
    {/if}
    {#if tuner.devices.length > 1}
      <label class="field">
        <span>Input</span>
        <select
          value={tuner.deviceId ?? ''}
          onchange={(e) => void tuner.choose(e.currentTarget.value || undefined)}
        >
          <option value="">Default</option>
          {#each tuner.devices as device (device.id)}
            <option value={device.id}>{device.label}</option>
          {/each}
        </select>
      </label>
    {/if}
    <div class="field">
      <label for="reference">A4 is</label>
      <input
        id="reference"
        type="number"
        min="400"
        max="480"
        step="0.1"
        value={tuner.reference}
        oninput={(e) => {
          const hz = e.currentTarget.valueAsNumber;
          if (hz >= 400 && hz <= 480) tuner.reference = hz;
        }}
      />
      <span class="unit">Hz</span>
      <span class="presets" role="group" aria-label="Reference pitch">
        {#each REFERENCES as hz (hz)}
          <button
            type="button"
            class="toggle"
            aria-pressed={tuner.reference === hz}
            onclick={() => (tuner.reference = hz)}>{hz}</button
          >
        {/each}
      </span>
    </div>
  </section>

  <section class="card" aria-label="Note">
    <div class="note" class:in-tune={reading !== null && Math.abs(reading.cents) <= IN_TUNE_CENTS}>
      <b class="name">{reading?.name ?? '–'}</b>
      <span class="cents">{reading ? `${sign(reading.cents, 1)} cents` : ''}</span>
    </div>
    <Gauge
      label="Distance from the note, in cents"
      from={-50}
      to={50}
      centre={0}
      value={reading?.cents ?? 0}
      fill
    />
    <div class="scale" aria-hidden="true">
      <span>flat</span><span>in tune</span><span>sharp</span>
    </div>
    <p class="detail" aria-live="off">
      {#if reading}
        {sign(reading.offsetHz, 2)} Hz from {reading.nearestHz.toFixed(2)} Hz · heard
        {reading.hz.toFixed(2)} Hz
        {#if Math.abs(reading.cents) <= IN_TUNE_CENTS}· in tune{/if}
      {:else if listening}
        Play a note.
      {:else}
        Not listening.
      {/if}
    </p>
  </section>

  <section class="card" aria-label="Spectrum">
    <svg
      viewBox="0 0 {plot.width} {plot.height + 16}"
      height={plot.height + 16}
      bind:clientWidth={shownWidth}
      role="img"
      aria-label="Spectrum by note"
    >
      {#each marks as mark (mark.name)}
        <line class="grid" x1={mark.x} x2={mark.x} y1="0" y2={plot.height} />
        <text class="tick" class:end={mark.x > plot.width - 12} x={mark.x} y={plot.height + 12}
          >{mark.name}</text
        >
      {/each}
      {#if path}
        <path class="area" d="{path} L{plot.width},{plot.height} L0,{plot.height} Z" />
        <path class="line" d={path} />
      {/if}
      {#if reading}
        <line
          class="pitch"
          x1={xOfHz(reading.hz, plot.width)}
          x2={xOfHz(reading.hz, plot.width)}
          y1="0"
          y2={plot.height}
        />
      {/if}
    </svg>
    <Waterfall bands={tuner.analysis?.bands ?? null} {listening} />
    <div class="level">
      <span>Level</span>
      <div
        class="meter"
        role="meter"
        aria-label="Input level"
        aria-valuemin="-90"
        aria-valuemax="0"
        aria-valuenow={Number.isFinite(db) ? Math.round(db) : -90}
      >
        <i class:hot={db > -6} style="width: {Math.min(100, Math.max(0, ((db + 90) / 90) * 100))}%"
        ></i>
      </div>
      <span class="readout">{Number.isFinite(db) ? `${Math.round(db)} dB` : '–'}</span>
    </div>
    {#if window > 0}
      <p class="hint">
        Pitch read over {window} ms of sound: a low note needs a longer stretch than a high one.
      </p>
    {/if}
    {#if tuner.inputName}
      <p class="hint">Input: {tuner.inputName}</p>
    {/if}
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
  .detail,
  .unit {
    font-size: 13px;
    color: var(--muted);
  }
  .notice {
    font-size: 14px;
    color: var(--ink);
    border-left: 3px solid var(--amber);
    padding-left: 8px;
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
  .field {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  .field input[type='number'],
  .field select {
    min-height: 34px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  .field input[type='number'] {
    width: 6em;
    font-variant-numeric: tabular-nums;
  }
  .presets {
    display: flex;
    gap: 6px;
  }
  .toggle {
    min-height: 34px;
    padding: 0 12px;
  }
  .toggle[aria-pressed='true'] {
    background: var(--amber);
    color: var(--on-amber);
    border-color: var(--amber);
  }
  .note {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .name {
    font-size: 48px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .cents {
    font-size: 20px;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .in-tune .name,
  .in-tune .cents {
    color: var(--teal);
  }
  svg {
    width: 100%;
    display: block;
  }
  .grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  .tick {
    fill: var(--muted);
    font-size: 11px;
    text-anchor: middle;
  }
  .tick.end {
    text-anchor: end;
  }
  .area {
    fill: var(--amber);
    fill-opacity: 0.15;
    stroke: none;
  }
  .line {
    fill: none;
    stroke: var(--amber);
    stroke-width: 1.5;
    stroke-linejoin: round;
  }
  .pitch {
    stroke: var(--teal);
    stroke-width: 2;
  }
  .level {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--muted);
  }
  .meter {
    flex: 1;
    height: 8px;
    border-radius: 4px;
    background: var(--line);
    overflow: hidden;
  }
  .meter i {
    display: block;
    height: 100%;
    background: var(--teal);
    transition: width 60ms linear;
  }
  .meter i.hot {
    background: var(--amber);
  }
  .scale {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--muted);
    margin-top: -4px;
  }
  .readout {
    min-width: 4.5em;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
