<!--
  A glyph's frame: the small living picture in a card's summary. Every glyph
  is drawn on the same square (`GLYPH_SIZE`) and fills the room the card
  gives it, so a stack of cards has glyphs of one size. A glyph is
  decoration: what it shows, the card's main and sub elements say in words,
  so it is hidden from a screen reader. `lit` marks it for a drawing that lights, with the class `lit`. It draws in the colour roles of
  `app.css` (`--glyph-lit`, `--glyph-dim`, `--glyph-accent`) and moves only
  by transitions, which `app.css` stops for those who ask for less motion.
-->
<script module lang="ts">
  /** The side of the square every glyph is drawn on, in its own units. */
  export const GLYPH_SIZE = 40;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, lit = false }: { children: Snippet; lit?: boolean } = $props();
</script>

<svg
  class="glyph"
  class:lit
  viewBox="0 0 {GLYPH_SIZE} {GLYPH_SIZE}"
  aria-hidden="true"
  focusable="false"
>
  {@render children()}
</svg>

<style>
  .glyph {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
