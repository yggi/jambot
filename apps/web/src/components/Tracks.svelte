<!--
  The stage's tracks: one row per band member, drums, bass, chords and lead.
  Each is a `Track`, taking only what it is given, so the same rows show
  whichever role the player is in (`docs/briefs/host-mode.md`).
-->
<script lang="ts">
  import Track from './Track.svelte';
  import type { TrackView } from '../tracks.ts';

  interface Props {
    tracks: readonly TrackView[];
  }

  let { tracks }: Props = $props();
</script>

<section class="tracks" aria-label="Tracks">
  {#each tracks as track (track.part)}
    <Track {track} />
  {/each}
</section>

<style>
  .tracks {
    display: grid;
    gap: 8px;
  }
</style>
