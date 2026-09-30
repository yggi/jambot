<!--
  A group: a titled block in a card's details. A level 3 group is a section
  of the details (the built-in synth, MIDI), a level 4 group a part of a
  section (MIDI's output and input); the heading names the group to a screen
  reader too.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    /** 3 for a section of the details, 4 for a part of a section. */
    level?: 3 | 4;
    children: Snippet;
  }

  let { title, level = 3, children }: Props = $props();

  const id = $props.id();
</script>

<section class="group level{level}" aria-labelledby="{id}-title">
  <svelte:element this={`h${level}`} id="{id}-title">{title}</svelte:element>
  {@render children()}
</section>

<style>
  .group {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .level3 {
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .level4 {
    padding: 10px 12px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  h3,
  h4 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  h4 {
    letter-spacing: 0.04em;
  }
</style>
