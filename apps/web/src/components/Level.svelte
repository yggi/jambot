<!--
  One level of the composition, as the page lays them out top to bottom:
  transport, style, metrum, key, plan, chords, tracks. A heading names
  it, unless it has no `name` because the card inside carries its own
  title (`Card`); `resting` disables the controls in it, for a level a
  client takes from its host rather than wishing for itself. A fieldset
  only disables its form controls and hides nothing, so a client still sees
  what it can't change.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    name?: string;
    /** Whether its controls rest: a client follows its host's. */
    resting?: boolean;
    children: Snippet;
  }

  let { name, resting = false, children }: Props = $props();
</script>

<div class="level">
  {#if name}<h2>{name}</h2>{/if}
  <fieldset disabled={resting}>
    {@render children()}
  </fieldset>
</div>

<style>
  .level {
    display: grid;
    gap: 8px;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  fieldset {
    display: grid;
    gap: 14px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
</style>
