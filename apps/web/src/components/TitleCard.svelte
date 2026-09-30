<!--
  The title card: the page's name, "Jambot" with what it is for, at the top
  of every screen. Its glyph is the logo. The details are about (what the
  band is) and settings: the theme, and the address of the lobby server that
  sessions across machines go through, given when the field is left.
-->
<script lang="ts">
  import { THEMES, type ThemeName } from '../theme.svelte.ts';
  import Card from './Card.svelte';
  import Group from './Group.svelte';
  import Segmented from './Segmented.svelte';
  import Logo from './glyphs/Logo.svelte';

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

{#snippet logo()}<Logo />{/snippet}

<Card title="Jambot" untitled main="Jambot" sub="play together" glyph={logo}>
  <Group title="About">
    <p class="note">You play, the Muse listens, the band answers.</p>
  </Group>
  <Group title="Settings">
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
  </Group>
</Card>

<style>
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
