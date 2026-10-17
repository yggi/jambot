<!--
  The settings, a card in the lobby's drawer: the theme, and the address of
  the lobby server that sessions across machines go through, given when the
  field is left.
-->
<script lang="ts">
  import { THEMES, type ThemeName } from '../theme.svelte.ts';
  import Card from './Card.svelte';
  import Segmented from './Segmented.svelte';
  import Lobby from './glyphs/Lobby.svelte';

  interface Props {
    theme: ThemeName;
    ontheme: (theme: ThemeName) => void;
    /** The lobby server's address, empty for none. */
    address: string;
    onaddress: (url: string) => void;
  }

  let { theme, ontheme, address, onaddress }: Props = $props();

  const OPTIONS = THEMES.map((value) => ({
    value,
    text: value[0]!.toUpperCase() + value.slice(1),
  }));

  // The address as typed; it is given once the person is done (`change`).
  // svelte-ignore state_referenced_locally
  let typed = $state(address);
  $effect(() => void (typed = address));
</script>

{#snippet gear()}<Lobby kind="gear" />{/snippet}

<Card
  title="Settings"
  main="Settings"
  sub={address === '' ? 'This browser only' : address}
  glyph={gear}
>
  <div class="settings">
    <Segmented label="Theme" value={theme} options={OPTIONS} onselect={ontheme} />
    <label>
      Lobby server
      <input
        type="text"
        bind:value={typed}
        onchange={() => onaddress(typed)}
        placeholder="none: this browser only"
        autocomplete="off"
        spellcheck="false"
      />
    </label>
    <p class="note">
      Every player gives the same lobby server: ws:// on a local network, wss:// when hosted.
    </p>
  </div>
</Card>

<style>
  .settings {
    display: grid;
    gap: 10px;
  }
  .note {
    font-size: 13px;
    color: var(--muted);
  }
  label {
    display: grid;
    gap: 2px;
    min-width: 0;
    font-size: 14px;
  }
  input {
    width: 100%;
    min-width: 0;
    font: inherit;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
  }
</style>
