<!--
  The transport: start and stop. The tempo is the metrum's, nudged there.
-->
<script lang="ts">
  interface Props {
    /** Whether the band is playing or about to: the button reads Stop. */
    playing: boolean;
    ontoggle: () => void;
  }

  let { playing, ontoggle }: Props = $props();
</script>

<section class="transport" aria-label="Transport">
  <button class="play" type="button" onclick={ontoggle}>
    {playing ? 'Stop' : 'Start the band'}
  </button>
</section>

<style>
  .play {
    min-height: 48px;
    padding: 0 22px;
    border: 0;
    border-radius: 24px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 600;
    font-size: 16px;
  }
</style>
