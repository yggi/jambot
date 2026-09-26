<!--
  The transport: start and stop, and the tempo, nudged 2 BPM at a time.
-->
<script lang="ts">
  import type { Intent } from '../conductor.ts';

  interface Props {
    /** Whether the band is playing or about to: the button reads Stop. */
    playing: boolean;
    /** The tempo the band is heading for. */
    bpm: number;
    ontoggle: () => void;
    onintent: (intent: Intent) => void;
  }

  let { playing, bpm, ontoggle, onintent }: Props = $props();

  const nudge = (by: number) => onintent({ kind: 'axis', axis: 'bpm', value: bpm + by });
</script>

<section class="transport" aria-label="Transport">
  <button class="play" type="button" onclick={ontoggle}>
    {playing ? 'Stop' : 'Start the band'}
  </button>
  <div class="tempo">
    <button type="button" aria-label="Slower" onclick={() => nudge(-2)}>−</button>
    <output aria-label="Tempo">{bpm} BPM</output>
    <button type="button" aria-label="Faster" onclick={() => nudge(2)}>+</button>
  </div>
</section>

<style>
  .transport {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 16px;
    align-items: center;
  }
  .play {
    min-height: 48px;
    padding: 0 22px;
    border: 0;
    border-radius: 24px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 600;
    font-size: 16px;
  }
  .tempo {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-self: end;
  }
  .tempo button {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 20px;
    line-height: 1;
  }
  .tempo output {
    min-width: 84px;
    text-align: center;
    font-weight: 600;
  }
</style>
