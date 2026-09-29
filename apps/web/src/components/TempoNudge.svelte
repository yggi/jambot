<!--
  The tempo, nudged: the style sets it, and the players move it by a ratio
  within the style's licence, a step of about 3 % at a time. The nudge says
  how far the tempo reaches, and a gauge under it shows the licence, the
  style's own tempo at its centre and the tempo played as the marker.
-->
<script lang="ts">
  import { TEMPO_STEP } from '@jambot/engine';
  import type { Intent, TempoView } from '../conductor.ts';
  import Gauge from './Gauge.svelte';
  import Nudge from './Nudge.svelte';

  interface Props {
    tempo: TempoView;
    /** Whether a client follows its host's tempo, so it can't nudge. */
    disabled?: boolean;
    onintent: (intent: Intent) => void;
  }

  let { tempo, disabled = false, onintent }: Props = $props();

  const steps = $derived(Math.round(tempo.nudge / TEMPO_STEP));
  /** The gauge's half width: the licence's wider side, so the style's own tempo is in the middle. */
  const half = $derived(Math.max(-tempo.low, tempo.high, TEMPO_STEP));
  const nudge = (by: -1 | 1) => onintent({ kind: 'tempo', nudge: (steps + by) * TEMPO_STEP });
</script>

<div class="tempo">
  <Nudge
    label="Tempo nudge"
    down={{
      name: 'Slower',
      glyph: '−',
      disabled: disabled || tempo.nudge - TEMPO_STEP < tempo.low - 1e-9,
    }}
    up={{
      name: 'Faster',
      glyph: '+',
      disabled: disabled || tempo.nudge + TEMPO_STEP > tempo.high + 1e-9,
    }}
    onnudge={nudge}
  >
    Reaches {Math.round(tempo.base * 2 ** tempo.low)}–{Math.round(tempo.base * 2 ** tempo.high)}
  </Nudge>
  <Gauge
    label="The tempo within the style's licence"
    from={-half}
    to={half}
    centre={0}
    value={tempo.nudge}
    reach={[tempo.low, tempo.high]}
  />
</div>

<style>
  .tempo {
    display: grid;
    gap: 10px;
  }
</style>
