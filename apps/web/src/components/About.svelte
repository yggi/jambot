<!--
  About, a card in the lobby's drawer: the page's name, "Jambot", and what it
  is for, its glyph the logo; unfolded, what the band is and the signature
  every screen of the lobby carries.
-->
<script lang="ts">
  import Card from './Card.svelte';
  import Logo from './glyphs/Logo.svelte';
</script>

{#snippet logo()}<Logo />{/snippet}

<Card title="Jambot" untitled main="Jambot" sub="play together" glyph={logo}>
  <p class="note">You play, the Muse listens, the band answers.</p>
  <footer>
    <span>all rites reversed</span>
    <svg class="pentagon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <polygon points="10,2 18,8 15,17.5 5,17.5 2,8" />
    </svg>
    <span>kallisti collective, 3192 YOLD</span>
  </footer>
</Card>

<style>
  .note {
    font-size: 14px;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
    font-size: 13px;
  }
  .pentagon {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
</style>
