<!--
  A nudge: two buttons joined in one pill, a step down and a step up, with
  what it reaches between them. It moves a value a step at a time and shows
  no value of its own, since the card's headline already reads it. The
  tempo and the key are nudged with it. A side may be disabled, and say why
  in its title.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Side {
    /** What the button is called to a screen reader. */
    name: string;
    /** What it shows: a sign or a glyph. */
    glyph: string;
    disabled?: boolean;
    /** A tooltip, where it says more than the name, such as why it rests. */
    title?: string;
  }

  interface Props {
    label: string;
    down: Side;
    up: Side;
    onnudge: (by: -1 | 1) => void;
    /** What the nudge reaches, between the buttons. */
    children?: Snippet;
  }

  let { label, down, up, onnudge, children }: Props = $props();
</script>

<div class="nudge" role="group" aria-label={label}>
  <button
    type="button"
    aria-label={down.name}
    title={down.title ?? down.name}
    disabled={down.disabled}
    onclick={() => onnudge(-1)}>{down.glyph}</button
  >
  <span class="between">{@render children?.()}</span>
  <button
    type="button"
    aria-label={up.name}
    title={up.title ?? up.name}
    disabled={up.disabled}
    onclick={() => onnudge(1)}>{up.glyph}</button
  >
</div>

<style>
  .nudge {
    display: flex;
    align-items: stretch;
    height: 40px;
    border: 1px solid var(--line);
    border-radius: 20px;
    overflow: hidden;
    background: var(--surface);
  }
  button {
    flex: none;
    width: 56px;
    border: 0;
    background: none;
    font-size: 20px;
    line-height: 1;
  }
  button:hover:not(:disabled) {
    background: var(--teal-bg);
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .between {
    flex: 1;
    display: grid;
    place-items: center;
    border-inline: 1px solid var(--line);
    font-size: 13px;
    color: var(--muted);
    white-space: nowrap;
  }
</style>
