<!--
  "A new version is ready": shown while an update waits (update.svelte.ts), until Later. The band is never cut off:
  nothing reloads until Reload is pressed. Lifted from yggi/cell-studio src/ui/UpdateToast.svelte.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { update } from '../update.svelte.ts';

  onMount(() => update.start());
</script>

{#if update.ready && !update.hushed}
  <div class="toast" role="status">
    <span>New version ready</span>
    <button type="button" onclick={() => update.reload()}>Reload</button>
    <button type="button" class="quiet" onclick={() => (update.hushed = true)} aria-label="Later"
      >Later</button
    >
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    z-index: 50;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom) + 12px);
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    color: var(--ink);
    font-size: 14px;
  }
  button {
    background: var(--amber);
    color: var(--on-amber);
    border: 0;
    border-radius: 6px;
    padding: 4px 10px;
    font: inherit;
    cursor: pointer;
  }
  button.quiet {
    background: none;
    color: var(--muted);
  }
</style>
