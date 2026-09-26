<!--
  The on-screen keyboard: C4 to E5, white and black keys positioned in
  percent over the white keys' width (`keyboardLayout`). A pointer holds a
  note until it lifts, cancels, or the capture is lost.
-->
<script lang="ts">
  import { KEYBOARD_HIGH, KEYBOARD_LOW, keyboardLayout } from '../midi/surfaces.ts';

  interface Props {
    /** Notes currently held, from any source, so a key lights whoever struck it. */
    down: ReadonlySet<number>;
    onnote: (note: number, velocity: number, on: boolean) => void;
  }

  let { down, onnote }: Props = $props();

  const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const nameOf = (note: number) => NAMES[note % 12]! + (Math.floor(note / 12) - 1);
  const layout = keyboardLayout(KEYBOARD_LOW, KEYBOARD_HIGH);

  function press(event: PointerEvent, note: number) {
    event.preventDefault();
    // A synthetic or otherwise stale pointer id can make this throw; capture is
    // a nicety (so a dragged finger still releases this key), not essential.
    try {
      (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    } catch {
      // Not fatal: pointerup/pointercancel still fire on this element.
    }
    onnote(note, 100, true);
  }
  const release = (note: number) => onnote(note, 0, false);
</script>

<div class="keyboard" role="group" aria-label="On-screen keyboard">
  {#each layout as key (key.note)}
    <button
      type="button"
      class={key.black ? 'black' : 'white'}
      class:down={down.has(key.note)}
      style="left: {key.left}%; width: {key.width}%"
      aria-label={nameOf(key.note)}
      onpointerdown={(e) => press(e, key.note)}
      onpointerup={() => release(key.note)}
      onpointercancel={() => release(key.note)}
      onlostpointercapture={() => release(key.note)}
    ></button>
  {/each}
</div>

<style>
  .keyboard {
    position: relative;
    height: 100px;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
  }
  button {
    position: absolute;
    top: 0;
    padding: 0;
    border: 1px solid var(--line);
    touch-action: none;
  }
  .white {
    height: 100%;
    background: var(--bg);
    border-radius: 0 0 7px 7px;
    z-index: 1;
  }
  .black {
    height: 60%;
    background: var(--ink);
    border-color: var(--ink);
    border-radius: 0 0 5px 5px;
    z-index: 2;
  }
  .down {
    background: var(--teal);
    border-color: var(--teal);
  }
</style>
