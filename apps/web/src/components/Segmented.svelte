<!--
  A segmented choice: one button per option in a joined row, exactly one
  pressed, as a radio group. An option may be dimmed (disabled) and carry a
  name for a tooltip and a screen reader where its text is short.
-->
<script lang="ts" generics="Value extends string">
  interface Option {
    value: Value;
    /** What the segment says. */
    text: string;
    /** The full name, as tooltip and accessible name, where `text` is short. */
    name?: string;
    disabled?: boolean;
  }

  interface Props {
    label: string;
    options: readonly Option[];
    value: Value;
    /** Every segment rests. */
    disabled?: boolean;
    onselect: (value: Value) => void;
  }

  let { label, options, value, disabled = false, onselect }: Props = $props();
</script>

<div class="segmented" role="radiogroup" aria-label={label}>
  {#each options as option (option.value)}
    <button
      type="button"
      role="radio"
      aria-label={option.name}
      title={option.name}
      aria-checked={option.value === value}
      disabled={disabled || option.disabled}
      onclick={() => onselect(option.value)}>{option.text}</button
    >
  {/each}
</div>

<style>
  .segmented {
    display: flex;
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
    border-radius: 22px;
    overflow: hidden;
  }
  button {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 44px;
    padding: 0 6px;
    border: 0;
    border-radius: 0;
    background: var(--surface);
    font-size: 14px;
  }
  /* The ends take the pill's inner radius, so a pressed segment's ring follows the curve instead of being clipped by it. */
  button:first-child {
    border-radius: 21px 0 0 21px;
  }
  button:last-child {
    border-radius: 0 21px 21px 0;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button[aria-checked='true'] {
    background: var(--teal-bg);
    box-shadow: inset 0 0 0 1px var(--teal);
  }
</style>
