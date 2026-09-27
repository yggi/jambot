<!--
  The circle of fifths, full-sized: the key the band is heading for, always
  shown. A toggle bares an experiment: the same wheel doubling as a live
  radar of the harmonic history, every pitch class actually played lately,
  weighted and fading, not just the seven of the current scale.
-->
<script lang="ts">
  import CircleOfFifths from './CircleOfFifths.svelte';

  interface Props {
    /** The key the band is heading for: its tonic, as a pitch class 0–11, C = 0. */
    tonic: number;
    /** That key's notes, as pitch classes 0–11, C = 0. */
    scale: readonly number[];
    /** One weight per pitch class, 0–11, for the harmonic-history radar. */
    history: readonly number[];
  }

  let { tonic, scale, history }: Props = $props();

  let showHistory = $state(false);
</script>

<section class="key-wheel" aria-label="Circle of fifths">
  <div class="wheel-row">
    <div class="wheel">
      <CircleOfFifths {tonic} {scale} history={showHistory ? history : undefined} />
    </div>
    <div class="side">
      <label class="toggle">
        <input type="checkbox" bind:checked={showHistory} />
        Harmonic history
      </label>
      <p class="caption">
        {showHistory
          ? 'Every pitch class the band has actually played lately, weighted and fading — not just the current scale.'
          : 'The key the band is heading for. Toggle to see what it has actually played.'}
      </p>
    </div>
  </div>
</section>

<style>
  .key-wheel {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 16px 18px 18px;
  }
  .wheel-row {
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
  }
  .wheel {
    width: min(360px, 100%);
    flex-shrink: 0;
  }
  .side {
    display: grid;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
  }
  .caption {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }
</style>
