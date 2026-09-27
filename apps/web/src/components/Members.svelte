<!--
  The stage's members: one row per band member, drums, bass, chords and
  lead. Each is a `Member`, taking only what it is given, so the same rows
  show whichever role the player is in (`docs/briefs/host-mode.md`).
-->
<script lang="ts">
  import Member from './Member.svelte';
  import type { MemberView } from '../members.ts';

  interface Props {
    members: readonly MemberView[];
  }

  let { members }: Props = $props();
</script>

<section class="members" aria-label="Band members">
  {#each members as member (member.member)}
    <Member {member} />
  {/each}
</section>

<style>
  .members {
    display: grid;
    gap: 8px;
  }
</style>
