<script lang="ts">
  import { type Axis, PRESETS, type SectionType } from '@jambot/engine';
  import { Player } from './player.svelte.ts';

  const player = new Player();
  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;

  const SLIDERS: { axis: Axis; label: string; ends: string[] }[] = [
    { axis: 'swing', label: 'Swing', ends: ['straight', 'shuffled', 'swung'] },
    { axis: 'sync', label: 'Syncopation', ends: ['on the beat', 'off the beat'] },
    { axis: 'harm', label: 'Harmony', ends: ['static vamp', 'moving, rich'] },
    { axis: 'artic', label: 'Articulation', ends: ['legato', 'staccato'] },
    { axis: 'energy', label: 'Energy', ends: ['sparse', 'dense'] },
    { axis: 'entropy', label: 'Entropy', ends: ['predictable', 'surprising'] },
  ];
  const SECTION_NAMES: Record<SectionType, string> = {
    intro: 'Intro',
    groove: 'Groove',
    bridge: 'Bridge',
    build: 'Build',
    drop: 'Drop',
    breakdown: 'Breakdown',
  };

  let preset = $state<string>(PRESETS[0]!.name);
  /** Where each axis is going: sliders show targets, not the glide. */
  const target = (axis: Axis) => player.track[axis].to;
  const bpm = $derived(Math.round(target('bpm')));

  function choose(name: string) {
    const chosen = PRESETS.find((p) => p.name === name)!;
    preset = name;
    player.apply({ kind: 'preset', preset: chosen });
  }
  function slide(axis: Axis, value: number) {
    // Energy is the one axis a player rides within a genre.
    if (axis !== 'energy') preset = 'Custom';
    player.apply({ kind: 'axis', axis, value });
  }
  function nudge(by: number) {
    player.apply({ kind: 'axis', axis: 'bpm', value: bpm + by });
  }
</script>

<main>
  <header>
    <h1>Jambot</h1>
    <p>You play, the Muse listens, the band answers.</p>
  </header>

  <section class="transport" aria-label="Transport">
    <button
      class="play"
      type="button"
      onclick={() => (player.playing ? player.stop() : player.start())}
    >
      {player.playing ? 'Stop' : 'Start the band'}
    </button>
    <div class="tempo">
      <button type="button" aria-label="Slower" onclick={() => nudge(-2)}>−</button>
      <output aria-label="Tempo">{bpm} BPM</output>
      <button type="button" aria-label="Faster" onclick={() => nudge(2)}>+</button>
    </div>
  </section>

  <section class="style" aria-label="Style">
    <div class="presets" role="group" aria-label="Genre presets">
      {#each PRESETS as p (p.name)}
        <button type="button" aria-pressed={preset === p.name} onclick={() => choose(p.name)}>
          {p.name}
        </button>
      {/each}
    </div>
    <div class="sliders">
      {#each SLIDERS as s (s.axis)}
        <label>
          {s.label}
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(target(s.axis) * 100)}
            oninput={(e) => slide(s.axis, +e.currentTarget.value / 100)}
          />
          <span class="ends">
            {#each s.ends as end (end)}<span>{end}</span>{/each}
          </span>
        </label>
      {/each}
    </div>
  </section>

  <section class="stage" aria-label="Conductor">
    <div class="stage-top">
      <span class="section">
        {player.position ? SECTION_NAMES[player.position.section] : player.playing ? '…' : 'Ready'}
      </span>
      {#if player.position}<span>Bar {player.position.bar + 1}</span>{/if}
    </div>
    <div class="beats" aria-hidden="true">
      {#each [0, 1, 2, 3] as beat (beat)}
        <i class:on={player.position !== null && beat <= player.position.beat}></i>
      {/each}
    </div>
  </section>

  <p class="note">
    The new app plays the drums so far. The full band, with harmony, melody and the Muse, is in the <a
      href={prototypeUrl}>prototype</a
    >.
  </p>
</main>

<style>
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 14px;
    display: grid;
    gap: 14px;
  }
  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  header p,
  .note {
    color: var(--muted);
    font-size: 14px;
  }
  a {
    color: var(--amber);
  }
  button {
    font: inherit;
    color: var(--ink);
    cursor: pointer;
  }
  .transport {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 16px;
    align-items: center;
  }
  .play {
    min-height: 48px;
    padding: 0 22px;
    border: 0;
    border-radius: 24px;
    background: var(--amber);
    color: var(--on-amber);
    font-weight: 600;
    font-size: 16px;
  }
  .tempo {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-self: end;
  }
  .tempo button {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 20px;
    line-height: 1;
  }
  .tempo output {
    min-width: 84px;
    text-align: center;
    font-weight: 600;
  }
  .style {
    display: grid;
    gap: 10px;
  }
  .presets {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 2px 6px;
  }
  .presets button {
    flex: none;
    min-height: 38px;
    padding: 0 14px;
    border-radius: 19px;
    border: 1px solid var(--line);
    background: var(--surface);
    font-size: 14px;
    font-weight: 500;
  }
  .presets button[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .sliders {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 18px;
  }
  .sliders label {
    display: grid;
    font-size: 14px;
  }
  .ends {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--muted);
    margin-top: -4px;
  }
  input[type='range'] {
    width: 100%;
    accent-color: var(--amber);
    min-height: 32px;
    margin: 0;
  }
  .stage {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 16px 18px 18px;
    display: grid;
    gap: 12px;
  }
  .stage-top {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    align-items: baseline;
    color: var(--muted);
    font-size: 14px;
  }
  .section {
    font-weight: 800;
    font-size: 20px;
    color: var(--amber);
  }
  .beats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
  }
  .beats i {
    height: 8px;
    border-radius: 4px;
    background: var(--line);
  }
  .beats i.on {
    background: var(--amber);
  }
  @media (max-width: 420px) {
    .sliders {
      gap: 4px 12px;
    }
  }
</style>
