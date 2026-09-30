<!--
  A button that makes up another: a circle of two arrows, with no text, so
  what it regenerates is its accessible name and tooltip. It sits beside the
  field whose value it replaces.
-->
<script lang="ts">
  interface Props {
    /** What it makes up again: "Regenerate name". */
    label: string;
    disabled?: boolean;
    onclick: () => void;
  }

  let { label, disabled = false, onclick }: Props = $props();
</script>

<button type="button" class="regenerate" aria-label={label} title={label} {disabled} {onclick}>
  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path d="M16 8 A6.5 6.5 0 0 0 4.2 6.2" />
    <path d="M16.5 3.5 V8 H12" />
    <path d="M4 12 A6.5 6.5 0 0 0 15.8 13.8" />
    <path d="M3.5 16.5 V12 H8" />
  </svg>
</button>

<style>
  .regenerate {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--surface);
  }
  .regenerate:disabled {
    cursor: default;
    opacity: 0.5;
  }
  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
