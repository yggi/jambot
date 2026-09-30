<!--
  The band: what stands behind the lobby's door. The music runs top to
  bottom in the order of the composition, one card or `Level` each, under the
  session. It shows the player it is given and sends what the person
  does; it opens no session and holds no device.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Chords from '../components/Chords.svelte';
  import DrumPads from '../components/DrumPads.svelte';
  import Keyboard from '../components/Keyboard.svelte';
  import KeyPicker from '../components/KeyPicker.svelte';
  import Level from '../components/Level.svelte';
  import Metrum from '../components/Metrum.svelte';
  import Muse from '../components/Muse.svelte';
  import Play from '../components/Play.svelte';
  import Plan from '../components/Plan.svelte';
  import Session from '../components/Session.svelte';
  import StylePanel from '../components/StylePanel.svelte';
  import BandCard from '../components/BandCard.svelte';
  import { keyReachOf, melodicReachOf, tempoView } from '../conductor.ts';
  import type { Instruments } from '../instruments.svelte.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import { toggled, withLevel } from '../mix.ts';
  import type { Player } from '../player.svelte.ts';
  import { tracksOf } from '../tracks.ts';

  interface Props {
    player: Player;
    metronome: Metronome;
    instruments: Instruments;
    /** What the session card says; see `Session`. */
    session: {
      hosting: ComponentProps<typeof Session>['hosting'];
      following: ComponentProps<typeof Session>['following'];
    };
    /** Close the session, leave it, or go back to the lobby. */
    onend: () => void;
  }

  let { player, metronome, instruments, session, onend }: Props = $props();

  /** Whether this device follows a host, whose song, style and key it plays. */
  const following = $derived(player.mode === 'client');

  const tracks = $derived(
    tracksOf({
      hud: player.hud,
      sounding: player.sounding,
      pattern: player.pattern,
      heard: player.heard,
      humanNotes: player.humanNotes,
      playerId: player.playerId,
      players: player.players,
      mix: player.mix,
    }),
  );
</script>

<Session
  mode={player.mode}
  hosting={session.hosting}
  following={session.following}
  players={player.players}
  playerId={player.playerId}
  playing={player.playing}
  bar={player.hud.beat === null ? null : (player.hud.bar?.bar ?? null)}
  ontoggle={() => (player.playing ? player.stop() : player.start())}
  {onend}
/>

<!--
    The music, in the order of the composition, from the whole song down to
    each note. A client plays its host's song, style and key, so those
    levels' controls rest; its click and instruments are its own.
  -->
<Level>
  <StylePanel
    track={player.track}
    style={player.hud.style}
    {following}
    onintent={(intent) => player.apply(intent)}
  />
</Level>

<Level>
  <Metrum
    tempo={tempoView(player.track, player.tempoNudge)}
    swing={player.track.swing.to}
    {metronome}
    heard={player.heard}
    playing={player.playing}
    {following}
    onintent={(intent) => player.apply(intent)}
  />
</Level>

<Level>
  <KeyPicker
    {following}
    heading={player.hud.heading}
    heard={player.hud.bar}
    reach={keyReachOf(player.track)}
    home={player.home}
    melodic={player.hud.headingMelodic}
    melodicReach={melodicReachOf(player.track)}
    history={player.harmonicHistory}
    onintent={(intent) => player.apply(intent)}
  />
</Level>

<Level>
  <Plan hud={player.hud} playing={player.playing} />
</Level>

<Level>
  <Chords hud={player.hud} />
</Level>

<Level>
  <BandCard
    {tracks}
    ontoggle={(which, performer) => (player.mix = toggled(player.mix, which, performer))}
    onlevel={(performer, level) => (player.mix = withLevel(player.mix, performer, level))}
  />
</Level>

<Level>
  <Play
    {tracks}
    held={{ lead: instruments.heldLead.size > 0, drums: instruments.heldDrums.size > 0 }}
  >
    {#snippet instrument(part)}
      {#if part === 'lead'}
        <Keyboard
          down={instruments.heldLead}
          scale={player.hud.bar?.melodic ?? []}
          sounding={player.sounding.lead}
          onnote={(note, velocity, on) =>
            instruments.toLead(note, velocity, on, 'the on-screen keys')}
        />
      {:else}
        <DrumPads
          down={instruments.heldDrums}
          sounding={player.sounding.drums}
          onnote={(note, velocity, on) => instruments.toDrums(note, velocity, on, 'the drum pads')}
        />
      {/if}
    {/snippet}
  </Play>
</Level>

<Level>
  <Muse
    muse={player.hud.muse}
    pulse={player.humanNotes.length}
    onforget={() => player.forgetMotif()}
  />
</Level>
