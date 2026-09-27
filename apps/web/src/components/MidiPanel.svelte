<!--
  MIDI: connecting, the output and input ports, the channel each part
  sends on, and the built-in synth, clock and thru toggles. A port or
  channel change is applied at once; `band-output.ts` silences what the old
  one held before adopting it.
-->
<script lang="ts">
  import type { MidiAccess } from '../midi/access.ts';
  import type { Channels } from '../audio/midi-out.ts';
  import type { MidiSettings } from '../midi/settings.svelte.ts';

  interface Props {
    settings: MidiSettings;
    access: MidiAccess | null;
    message: string;
    onconnect: () => void;
    /** All notes off, for hardware left sounding by a suspended tab or a dropped connection. */
    onpanic?: () => void;
  }

  let { settings, access, message, onconnect, onpanic }: Props = $props();

  const PARTS: { key: keyof Channels; label: string }[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'bass', label: 'Bass' },
    { key: 'pad', label: 'Pad' },
    { key: 'stab', label: 'Stab' },
    { key: 'drums', label: 'Drums' },
  ];

  const clampChannel = (value: string) => Math.max(1, Math.min(16, +value || 1));

  function setChannel(part: keyof Channels, value: string) {
    settings.channels = { ...settings.channels, [part]: clampChannel(value) };
  }

  function setOutPort(id: string) {
    settings.outPortId = id;
    settings.outPort = id === 'none' ? null : (access?.outputPort(id) ?? null);
  }

  function setInPort(id: string) {
    settings.inPortId = id;
    access?.listen(id);
  }
</script>

<details class="card">
  <summary>MIDI, key and sound</summary>
  <div class="routing">
    {#if !access}
      <button type="button" onclick={onconnect}>Connect MIDI</button>
    {/if}
    <p class="message">{message}</p>
    {#if access && onpanic}
      <button type="button" onclick={onpanic}>All notes off</button>
    {/if}
    {#if access}
      <label>
        Listen to input
        <select value={settings.inPortId} onchange={(e) => setInPort(e.currentTarget.value)}>
          <option value="none">No MIDI input</option>
          <option value="all">All inputs</option>
          {#each access.inputs as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </label>
      <label>
        Send to output
        <select value={settings.outPortId} onchange={(e) => setOutPort(e.currentTarget.value)}>
          <option value="none">No MIDI output</option>
          {#each access.outputs as p (p.id)}
            <option value={p.id}>{p.name}</option>
          {/each}
        </select>
      </label>
    {/if}
    <div class="channels">
      <p class="label">Output channels</p>
      <div class="chs">
        {#each PARTS as p (p.key)}
          <label>
            {p.label}
            <input
              type="number"
              min="1"
              max="16"
              value={settings.channels[p.key]}
              onchange={(e) => setChannel(p.key, e.currentTarget.value)}
            />
          </label>
        {/each}
      </div>
    </div>
    <label class="check">
      <input
        type="checkbox"
        checked={settings.internal}
        onchange={(e) => (settings.internal = e.currentTarget.checked)}
      />
      Play the built-in synth
    </label>
    <label class="check">
      <input
        type="checkbox"
        checked={settings.clock}
        onchange={(e) => (settings.clock = e.currentTarget.checked)}
      />
      Send MIDI clock, start and stop
    </label>
    <div class="check">
      <label>
        <input
          type="checkbox"
          checked={settings.thru}
          onchange={(e) => (settings.thru = e.currentTarget.checked)}
        />
        Pass what you play to the output on channel
      </label>
      <input
        type="number"
        min="1"
        max="16"
        aria-label="Thru channel"
        value={settings.thruChannel}
        onchange={(e) => (settings.thruChannel = clampChannel(e.currentTarget.value))}
      />
    </div>
  </div>
</details>

<style>
  .card {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 14px;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
  }
  .routing {
    display: grid;
    gap: 10px;
    margin-top: 10px;
  }
  .routing > button {
    justify-self: start;
    min-height: 38px;
    padding: 0 16px;
    border: 1px solid var(--line);
    border-radius: 19px;
    background: var(--surface);
    font-weight: 500;
  }
  .message {
    font-size: 13px;
    color: var(--muted);
    margin: 0;
  }
  label {
    display: grid;
    gap: 2px;
    font-size: 14px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  select,
  input[type='number'] {
    font: inherit;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
    min-height: 34px;
    padding: 0 8px;
  }
  input[type='number'] {
    width: 64px;
  }
  .channels .label {
    font-size: 13px;
    color: var(--muted);
    margin: 0 0 4px;
  }
  .chs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px 10px;
  }
  @media (max-width: 420px) {
    .chs {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
