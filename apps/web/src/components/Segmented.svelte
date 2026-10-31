<!--
  A segmented choice: one button per option in a joined row, exactly one
  pressed, as a radio group. An option may be dimmed (disabled) and carry a
  name for a tooltip and a screen reader where its text is short. Given
  `columns`, the options are joined in rows of that many instead of in one,
  the last cell taking the rest of a row that is not full, with the four
  corner cells curved to the outline so a pressed one's ring follows it. An
  option may glow, as near as it is to what is (the style's presets, lit by
  how near the style is to each).
-->
<script lang="ts" generics="Value extends string">
  import type { Snippet } from 'svelte';

  interface Option {
    value: Value;
    /** What the segment says. */
    text: string;
    /** The full name, as tooltip and accessible name, where `text` is short. */
    name?: string;
    disabled?: boolean;
    /** A small picture before the text, decoration: the text or `name` says it in words. */
    icon?: Snippet;
    /** How near this option is to what is, from 0 to 1, lit as a glow behind it (the style's presets). */
    glow?: number;
  }

  interface Props {
    label: string;
    options: readonly Option[];
    value: Value;
    /** Every segment rests. */
    disabled?: boolean;
    /** Join the options in rows of this many, instead of in one row. */
    columns?: number;
    onselect: (value: Value) => void;
  }

  let { label, options, value, disabled = false, columns, onselect }: Props = $props();

  const count = $derived(options.length);
  /** Which cell of the rows is which corner, and how far the last one reaches. */
  const cornerOf = (i: number) =>
    columns === undefined
      ? {}
      : {
          tl: i === 0,
          tr: i === Math.min(columns, count) - 1,
          bl: i === Math.floor((count - 1) / columns) * columns,
          br: i === count - 1,
        };
  const spanOf = (i: number) =>
    columns !== undefined && i === count - 1 && count % columns !== 0
      ? `span ${columns - (count % columns) + 1}`
      : undefined;
</script>

<div
  class="segmented"
  class:grid={columns !== undefined}
  style:grid-template-columns={columns === undefined ? undefined : `repeat(${columns}, 1fr)`}
  role="radiogroup"
  aria-label={label}
>
  {#each options as option, i (option.value)}
    {@const corner = cornerOf(i)}
    <button
      type="button"
      class:tl={corner.tl}
      class:tr={corner.tr}
      class:bl={corner.bl}
      class:br={corner.br}
      style:grid-column={spanOf(i)}
      style:--glow={option.glow === undefined ? undefined : option.glow.toFixed(3)}
      role="radio"
      aria-label={option.name}
      title={option.name}
      aria-checked={option.value === value}
      disabled={disabled || option.disabled}
      onclick={() => onselect(option.value)}
      >{#if option.icon}<span class="icon" aria-hidden="true">{@render option.icon()}</span
        >{/if}{option.text}</button
    >
  {/each}
</div>

<style>
  .icon {
    display: inline-grid;
    vertical-align: -3px;
    margin-right: 6px;
  }
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
  .segmented:not(.grid) button:first-child {
    border-radius: 21px 0 0 21px;
  }
  .segmented:not(.grid) button:last-child {
    border-radius: 0 21px 21px 0;
  }
  /* In rows the four corner cells do, each its own corner. */
  .grid {
    display: grid;
  }
  .grid button {
    padding: 4px 6px;
    font-size: 13px;
    line-height: 1.2;
  }
  .tl {
    border-top-left-radius: 21px;
  }
  .tr {
    border-top-right-radius: 21px;
  }
  .bl {
    border-bottom-left-radius: 21px;
  }
  .br {
    border-bottom-right-radius: 21px;
  }
  /* A glow: the option's nearness, as much amber in its face. */
  button[style*='--glow'] {
    background: color-mix(in srgb, var(--amber) calc(var(--glow) * 40%), var(--surface));
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
