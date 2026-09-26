<script lang="ts">
  import Stage from './components/Stage.svelte';
  import StylePanel from './components/StylePanel.svelte';
  import Transport from './components/Transport.svelte';
  import { Player } from './player.svelte.ts';

  const player = new Player();
  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;
</script>

<main>
  <header>
    <h1>Jambot</h1>
    <p>You play, the Muse listens, the band answers.</p>
  </header>

  <Transport
    playing={player.playing}
    bpm={Math.round(player.track.bpm.to)}
    ontoggle={() => (player.playing ? player.stop() : player.start())}
    onintent={(intent) => player.apply(intent)}
  />

  <StylePanel
    track={player.track}
    preset={player.hud.style.preset}
    onintent={(intent) => player.apply(intent)}
  />

  <Stage hud={player.hud} playing={player.playing} />

  <p class="note">
    The band plays drums, bass, chords and lead. The score, MIDI out and the Muse, which listens to
    players, are still in the <a href={prototypeUrl}>prototype</a>.
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
</style>
