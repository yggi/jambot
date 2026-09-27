<!--
  The stage's performers: one row per band performer, drums, bass, chords
  and lead. Each is a `Performer`, taking only what it is given, so the same
  rows show whichever role the player is in (`docs/briefs/host-mode.md`).
-->
<script lang="ts">
  import Performer from './Performer.svelte';
  import type { PerformerView } from '../performers.ts';

  interface Props {
    performers: readonly PerformerView[];
  }

  let { performers }: Props = $props();
</script>

<section class="performers" aria-label="Band performers">
  {#each performers as performer (performer.performer)}
    <Performer {performer} />
  {/each}
</section>

<style>
  .performers {
    display: grid;
    gap: 8px;
  }
</style>
