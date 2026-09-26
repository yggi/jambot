<!--
  The drum pads: the kit's General MIDI notes, one pad per sound, laid out
  as `DRUM_KEY_MAP` numbers them. A pointer holds a note until it lifts,
  cancels, or the capture is lost, the same way `Keyboard.svelte` does.
  Amber flashes when the band's own drums strike a pad, showing the rhythm
  as it plays.
-->
<script lang="ts">
  import { DRUM_NOTES } from '@jambot/engine';

  interface Props {
    /** Notes currently held, from any source, so a pad lights whoever struck it. */
    down: ReadonlySet<number>;
    /** The band's own drum hits heard sounding right now. */
    sounding?: readonly number[];
    onnote: (note: number, velocity: number, on: boolean) => void;
  }

  let { down, sounding = [], onnote }: Props = $props();

  const PADS: { note: number; label: string }[] = [
    { note: DRUM_NOTES.kick, label: 'Kick' },
    { note: DRUM_NOTES.snare, label: 'Snare' },
    { note: DRUM_NOTES.closedHat, label: 'Closed hat' },
    { note: DRUM_NOTES.openHat, label: 'Open hat' },
    { note: DRUM_NOTES.pedalHat, label: 'Pedal hat' },
    { note: DRUM_NOTES.rim, label: 'Rim' },
    { note: DRUM_NOTES.ride, label: 'Ride' },
  ];

  function press(event: PointerEvent, note: number) {
    event.preventDefault();
    // A synthetic or otherwise stale pointer id can make this throw; capture is
    // a nicety (so a dragged finger still releases this pad), not essential.
    try {
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    } catch {
      // Not fatal: pointerup/pointercancel still fire on this element.
    }
    onnote(note, 100, true);
  }
  const release = (note: number) => onnote(note, 0, false);
</script>

<div class="pads" role="group" aria-label="Drum pads">
  {#each PADS as pad (pad.note)}
    <button
      type="button"
      class="pad"
      class:sounding={sounding.includes(pad.note)}
      class:down={down.has(pad.note)}
      aria-label={pad.label}
      onpointerdown={(e) => press(e, pad.note)}
      onpointerup={() => release(pad.note)}
      onpointercancel={() => release(pad.note)}
      onlostpointercapture={() => release(pad.note)}
    >
      {pad.label}
    </button>
  {/each}
</div>

<style>
  .pads {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    touch-action: none;
  }
  .pad {
    min-height: 56px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    color: var(--ink);
    font-size: 13px;
    font-weight: 500;
  }
  .pad.sounding {
    background: var(--amber);
    color: var(--on-amber);
  }
  .pad.down {
    background: var(--teal);
    color: var(--on-amber);
  }
</style>
