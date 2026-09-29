<!--
  The tempo, nudged: the style sets it, and the players move it by a ratio
  within the style's licence, a step of about 3 % at a time. A bar shows the
  licence, the style's own tempo as a tick in it, and the tempo played.
-->
<script lang="ts">
  import { TEMPO_STEP } from '@jambot/engine';
  import type { Intent, TempoView } from '../conductor.ts';

  interface Props {
    tempo: TempoView;
    /** Whether a client follows its host's tempo, so it can't nudge. */
    disabled?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { tempo, disabled = false, onintent }: Props = $props();

  const steps = $derived(Math.round(tempo.nudge / TEMPO_STEP));
  const percent = $derived(Math.round((2 ** tempo.nudge - 1) * 100));
  /** Where a nudge sits on the licence's bar, 0 to 1, the style's own tempo in the middle. */
  const reach = $derived(Math.max(-tempo.low, tempo.high, TEMPO_STEP));
  const along = (nudge: number) => (nudge + reach) / (2 * reach);
  const nudge = (by: number) => onintent({ kind: 'tempo', nudge: (steps + by) * TEMPO_STEP });
</script>

<div class="tempo" role="group" aria-label="Tempo nudge">
  <div class="row">
    <button
      type="button"
      aria-label="Slower"
      disabled={disabled || tempo.nudge - TEMPO_STEP < tempo.low - 1e-9}
      onclick={() => nudge(-1)}>−</button
    >
    <output aria-label="Tempo">{Math.round(tempo.bpm)} BPM</output>
    <button
      type="button"
      aria-label="Faster"
      disabled={disabled || tempo.nudge + TEMPO_STEP > tempo.high + 1e-9}
      onclick={() => nudge(1)}>+</button
    >
  </div>
  <div class="licence" aria-hidden="true">
    <b style="left: {along(tempo.low) * 100}%; right: {(1 - along(tempo.high)) * 100}%"></b>
    <i class="base"></i>
    <i class="played" style="left: {along(tempo.nudge) * 100}%"></i>
  </div>
  <p class="caption">
    {steps === 0
      ? `The style's tempo, ${Math.round(tempo.base)} BPM.`
      : `The style's ${Math.round(tempo.base)} BPM, nudged ${percent > 0 ? '+' : ''}${percent} %.`}
    Reaches {Math.round(tempo.base * 2 ** tempo.low)}–{Math.round(tempo.base * 2 ** tempo.high)}.
  </p>
</div>

<style>
  .tempo {
    display: grid;
    gap: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  button {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 20px;
    line-height: 1;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  output {
    min-width: 84px;
    text-align: center;
    font-weight: 600;
  }
  .licence {
    position: relative;
    height: 8px;
  }
  .licence b {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 4px;
    background: var(--teal-bg);
    border: 1px solid var(--teal);
  }
  .licence i {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .base {
    left: 50%;
    width: 2px;
    height: 14px;
    background: var(--muted);
  }
  .played {
    width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--amber);
  }
  .caption {
    font-size: 13px;
    color: var(--muted);
  }
</style>
