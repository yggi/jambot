<!--
  A drawer: settings that aren't the music, folded under one line until
  opened — its name and, beside it, what it is set to now.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    /** What it is set to now, shown while folded too. */
    status?: string;
    children: Snippet;
  }

  let { name, status, children }: Props = $props();
</script>

<details class="drawer">
  <summary class="chevron">
    <span class="name">{name}</span>
    {#if status}<span class="status">{status}</span>{/if}
  </summary>
  <div class="body">
    {@render children()}
  </div>
</details>

<style>
  .drawer {
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 10px 16px;
    min-width: 0;
  }
  summary {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .name {
    font-weight: 600;
    margin-right: auto;
  }
  .status {
    font-size: 13px;
    color: var(--muted);
    text-align: right;
  }
  .body {
    margin-top: 10px;
  }
</style>
