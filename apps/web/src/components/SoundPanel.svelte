<!--
  The details of the sound card: how this device sounds, in two sections.
  The built-in synth is one switch (its level is the card's volume). MIDI
  is the connection, with Refresh to look at the ports again, and All notes
  off for hardware left sounding, then two parts: the output (the port, the
  channel each part sends on, the drum notes, the clock) and the input (the
  port listened to, and passing what you play on to the output). A port or
  channel change is applied at once; `band-output.ts` silences what the old
  one held before adopting it.
-->
<script lang="ts">
  import type { DrumSound } from '@jambot/engine';
  import { DRUM_PRESETS, type PortOption, presetNameOf } from '@yggi/webmidi/core';
  import type { MidiAccess } from '@yggi/webmidi/web';
  import type { Channels } from '../audio/midi-out.ts';
  import type { MidiSettings } from '../midi/settings.svelte.ts';
  import Group from './Group.svelte';

  interface Props {
    settings: MidiSettings;
    access: MidiAccess | null;
    /** The ports plugged in, as of the last look. */
    ports?: { inputs: readonly PortOption[]; outputs: readonly PortOption[] };
    message: string;
    onconnect: () => void;
    /** Look at the ports again. */
    onrefresh?: () => void;
    /** All notes off, for hardware left sounding by a suspended tab or a dropped connection. */
    onpanic?: () => void;
  }

  let {
    settings,
    access,
    ports = { inputs: [], outputs: [] },
    message,
    onconnect,
    onrefresh,
    onpanic,
  }: Props = $props();

  /** Whether a port chosen before isn't among the ports plugged in now. */
  const missing = (list: readonly PortOption[], id: string) =>
    id !== 'none' && id !== 'all' && !list.some((port) => port.id === id);

  const PARTS: { key: keyof Channels; label: string }[] = [
    { key: 'lead', label: 'Lead' },
    { key: 'bass', label: 'Bass' },
    { key: 'pad', label: 'Pad' },
    { key: 'stab', label: 'Stab' },
    { key: 'drums', label: 'Drums' },
  ];

  const DRUM_SOUNDS: { key: DrumSound; label: string }[] = [
    { key: 'kick', label: 'Kick' },
    { key: 'rim', label: 'Rim' },
    { key: 'snare', label: 'Snare' },
    { key: 'closedHat', label: 'Closed hat' },
    { key: 'pedalHat', label: 'Pedal hat' },
    { key: 'openHat', label: 'Open hat' },
    { key: 'ride', label: 'Ride' },
  ];

  const clampChannel = (value: string) => Math.max(1, Math.min(16, +value || 1));
  const clampNote = (value: string) => Math.max(0, Math.min(127, +value || 0));

  function setChannel(part: keyof Channels, value: string) {
    settings.channels = { ...settings.channels, [part]: clampChannel(value) };
  }

  function setDrumNote(sound: DrumSound, value: string) {
    settings.drumNotes = { ...settings.drumNotes, [sound]: clampNote(value) };
  }

  /** The preset the drum notes are, or '' for a map edited by hand (webmidi names it 'Custom'). */
  const drumPreset = $derived.by(() => {
    const name = presetNameOf(settings.drumMap);
    return name in DRUM_PRESETS ? name : '';
  });

  function setDrumPreset(name: string) {
    const preset = DRUM_PRESETS[name];
    if (preset) settings.drumMap = { ...preset };
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

<div class="sound">
  <Group title="Built-in synth">
    <label class="check">
      <input
        type="checkbox"
        checked={settings.internal}
        onchange={(e) => (settings.internal = e.currentTarget.checked)}
      />
      Play the built-in synth
    </label>
  </Group>

  <Group title="MIDI">
    <div class="status">
      <p class="message">{message}</p>
      <div class="buttons">
        {#if !access}
          <button type="button" onclick={onconnect}>Connect MIDI</button>
        {:else}
          <button type="button" onclick={onrefresh}>Refresh ports</button>
          {#if onpanic}<button type="button" onclick={onpanic}>All notes off</button>{/if}
        {/if}
      </div>
    </div>

    <Group title="Output" level={4}>
      {#if access}
        <label>
          Send to output
          <select value={settings.outPortId} onchange={(e) => setOutPort(e.currentTarget.value)}>
            <option value="none">No MIDI output</option>
            {#each ports.outputs as p (p.id)}
              <option value={p.id}>{p.name}</option>
            {/each}
            {#if missing(ports.outputs, settings.outPortId)}
              <option value={settings.outPortId}>Not connected</option>
            {/if}
          </select>
        </label>
      {/if}
      <div class="channels">
        <p class="label">Channels</p>
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
      <div class="channels">
        <p class="label">Drum notes</p>
        <label>
          Preset
          <select value={drumPreset} onchange={(e) => setDrumPreset(e.currentTarget.value)}>
            <option value="" disabled>Custom</option>
            {#each Object.keys(DRUM_PRESETS) as name (name)}
              <option value={name}>{name}</option>
            {/each}
          </select>
        </label>
        <div class="chs">
          {#each DRUM_SOUNDS as s (s.key)}
            <label>
              {s.label}
              <input
                type="number"
                min="0"
                max="127"
                value={settings.drumNotes[s.key]}
                onchange={(e) => setDrumNote(s.key, e.currentTarget.value)}
              />
            </label>
          {/each}
        </div>
      </div>
      <label class="check">
        <input
          type="checkbox"
          checked={settings.clock}
          onchange={(e) => (settings.clock = e.currentTarget.checked)}
        />
        Send MIDI clock, start and stop
      </label>
    </Group>

    <Group title="Input" level={4}>
      {#if access}
        <label>
          Listen to input
          <select value={settings.inPortId} onchange={(e) => setInPort(e.currentTarget.value)}>
            <option value="none">No MIDI input</option>
            <option value="all">All inputs</option>
            {#each ports.inputs as p (p.id)}
              <option value={p.id}>{p.name}</option>
            {/each}
            {#if missing(ports.inputs, settings.inPortId)}
              <option value={settings.inPortId}>Not connected</option>
            {/if}
          </select>
        </label>
      {/if}
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
    </Group>
  </Group>
</div>

<style>
  .sound {
    display: grid;
    gap: 14px;
  }
  .status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  button {
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
  .check,
  .check label {
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
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px 10px;
  }
</style>
