<!--
  You, a card in the lobby's drawer: the name a person goes by in a session,
  made up already, with a button for another. It takes the name and sends
  what is typed; the page keeps it (`Profile`).
-->
<script lang="ts">
  import Card from './Card.svelte';
  import Regenerate from './Regenerate.svelte';
  import Lobby from './glyphs/Lobby.svelte';

  interface Props {
    name: string;
    onname: (name: string) => void;
    /** The name field was left. */
    onsettle: () => void;
    /** Make up another name. */
    onregenerate: () => void;
  }

  let { name, onname, onsettle, onregenerate }: Props = $props();
</script>

{#snippet nameField()}
  <div class="row">
    <input
      type="text"
      aria-label="Your name"
      value={name}
      oninput={(e) => onname(e.currentTarget.value)}
      onblur={onsettle}
      autocomplete="nickname"
    />
    <Regenerate label="Regenerate name" onclick={onregenerate} />
  </div>
{/snippet}

{#snippet glyph()}<Lobby kind="name" />{/snippet}

<Card title="Name" main={nameField} {glyph}>
  <p class="note">The others in a session see you by it.</p>
</Card>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  input {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    font: inherit;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
  }
  .note {
    font-size: 13px;
    color: var(--muted);
  }
</style>
