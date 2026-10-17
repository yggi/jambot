<!--
  The build, small, under the logo in the lobby's banner: the commit's first 7 characters (`dev` for a build that
  doesn't know its commit). A tap opens a sheet with the rest: the commit in full, the branch, the build date, the
  versions of what the app ships (the cells language among them), and whether a new version waits. Releases aren't
  meaningful yet, so the hash is what stands for a build. Lifted from yggi/cell-studio src/ui/Version.svelte.
-->
<script lang="ts">
  import { builtOn, shortVersion } from '../buildInfo.ts';
  import { update } from '../update.svelte.ts';

  const build = __BUILD__;
  let open = $state(false);
  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(build.commit);
      copied = true;
    } catch {
      // no clipboard (an insecure page): the full hash is on screen to select
    }
  }
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

<button
  type="button"
  class="version"
  onclick={() => (open = true)}
  aria-label="Version {shortVersion(build)}, details"
>
  {shortVersion(build)}{#if update.ready}<span class="dot" aria-hidden="true"></span>{/if}
</button>

{#if open}
  <div class="backdrop" onclick={() => (open = false)} role="presentation"></div>
  <div class="sheet" role="dialog" aria-label="Version" aria-modal="true">
    <header>
      <b>Version</b>
      <button type="button" class="close" onclick={() => (open = false)} aria-label="Close"
        >×</button
      >
    </header>
    <dl>
      <dt>Build</dt>
      <dd>{shortVersion(build)}</dd>
      <dt>Commit</dt>
      <dd>
        <code>{build.commit || 'unknown'}</code>
        {#if build.commit}<button type="button" class="quiet" onclick={copy}
            >{copied ? 'Copied' : 'Copy'}</button
          >{/if}
      </dd>
      <dt>Branch</dt>
      <dd>{build.branch || 'unknown'}</dd>
      <dt>Built</dt>
      <dd>{builtOn(build)}</dd>
      {#each build.dependencies as dependency (dependency.name)}
        <dt>{dependency.name}</dt>
        <dd>{dependency.version}</dd>
      {/each}
    </dl>
    {#if update.ready}
      <p class="update" role="status">
        A new version is ready. <button type="button" onclick={() => update.reload()}>Reload</button
        >
      </p>
    {/if}
  </div>
{/if}

<style>
  .version {
    display: block;
    margin: 0;
    padding: 2px 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: 10px;
    line-height: 1;
    letter-spacing: 0.02em;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    margin-left: 3px;
    border-radius: 50%;
    background: var(--amber);
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgb(0 0 0 / 0.45);
  }
  .sheet {
    position: fixed;
    z-index: 61;
    left: 0;
    right: 0;
    bottom: 0;
    max-width: 480px;
    margin: 0 auto;
    max-height: 88svh;
    overflow: auto;
    padding: 14px 16px calc(14px + env(safe-area-inset-bottom));
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: 18px 18px 0 0;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .close {
    border: 0;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 14px;
    margin: 0;
    font-size: 14px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  code {
    font-size: 12px;
  }
  .quiet {
    border: 0;
    background: none;
    color: var(--muted);
    font: inherit;
    cursor: pointer;
  }
  .update {
    margin: 12px 0 0;
    font-size: 14px;
  }
  .update button {
    background: var(--amber);
    color: var(--on-amber);
    border: 0;
    border-radius: 6px;
    padding: 4px 10px;
    font: inherit;
    cursor: pointer;
  }
</style>
