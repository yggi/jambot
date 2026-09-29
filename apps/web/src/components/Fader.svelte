<!--
  A fader: one level from 0 to 1, with its name and its position in percent.
  It holds no value: it shows the one it is given and sends the one dragged
  to, so the same fader serves a master volume, and a track's in a mixer.
-->
<script lang="ts">
  interface Props {
    label: string;
    /** The level, from 0 to 1. */
    value: number;
    onchange: (value: number) => void;
  }

  let { label, value, onchange }: Props = $props();

  const percent = $derived(Math.round(value * 100));
</script>

<label class="fader">
  <span class="name">{label}</span>
  <input
    type="range"
    min="0"
    max="100"
    value={percent}
    oninput={(e) => onchange(+e.currentTarget.value / 100)}
  />
  <span class="value">{percent} %</span>
</label>

<style>
  .fader {
    display: grid;
    grid-template-columns: auto 1fr 3.5em;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }
  input {
    width: 100%;
    min-width: 0;
    min-height: 32px;
    margin: 0;
    accent-color: var(--amber);
  }
  .value {
    text-align: right;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
