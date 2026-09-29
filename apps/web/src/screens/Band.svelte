<!--
  The band: what stands behind the lobby's door. The music runs top to
  bottom in the order of the composition, one `Level` each, under the way out
  of the session. It shows the player it is given and sends what the person
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
  import MusePanel from '../components/MusePanel.svelte';
  import Plan from '../components/Plan.svelte';
  import SessionBar from '../components/SessionBar.svelte';
  import StylePanel from '../components/StylePanel.svelte';
  import Tracks from '../components/Tracks.svelte';
  import Transport from '../components/Transport.svelte';
  import { keyReachOf, melodicReachOf, tempoView } from '../conductor.ts';
  import type { Instruments } from '../instruments.svelte.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import { toggled } from '../mix.ts';
  import type { Player } from '../player.svelte.ts';
  import { tracksOf } from '../tracks.ts';

  interface Props {
    player: Player;
    metronome: Metronome;
    instruments: Instruments;
    /** What the session bar says; see `SessionBar`. */
    session: {
      hosting: ComponentProps<typeof SessionBar>['hosting'];
      following: ComponentProps<typeof SessionBar>['following'];
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

  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;
</script>

<SessionBar mode={player.mode} hosting={session.hosting} following={session.following} {onend} />

<!--
    The music, in the order of the composition, from the whole song down to
    each note. A client plays its host's song, style and key, so those
    levels' controls rest; its click and instruments are its own.
  -->
<Level name="Transport" resting={following}>
  <Transport
    playing={player.playing}
    ontoggle={() => (player.playing ? player.stop() : player.start())}
  />
</Level>

<Level name="Style" resting={following}>
  <StylePanel
    track={player.track}
    style={player.hud.style}
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
  <Tracks
    {tracks}
    ontoggle={(which, performer) => (player.mix = toggled(player.mix, which, performer))}
  >
    {#snippet instrument(performer)}
      {#if performer === 'lead'}
        <Keyboard
          down={instruments.heldLead}
          scale={player.hud.bar?.melodic ?? []}
          sounding={player.sounding.lead}
          onnote={(note, velocity, on) =>
            instruments.toLead(note, velocity, on, 'the on-screen keys')}
        />
      {:else if performer === 'drums'}
        <DrumPads
          down={instruments.heldDrums}
          sounding={player.sounding.drums}
          onnote={(note, velocity, on) => instruments.toDrums(note, velocity, on, 'the drum pads')}
        />
      {/if}
    {/snippet}
  </Tracks>
</Level>

<Level>
  <MusePanel muse={player.hud.muse} onforget={() => player.forgetMotif()} />
</Level>

<p class="note">
  The band plays drums, bass, chords and lead, over MIDI or the built-in synth. Join in on the
  lead's keyboard or the drums' pads, under the track selected: a dot marks the scale the lead plays
  over, and amber shows what the band's own lead and drums are playing. Play a few notes within a
  bar on the keyboard, and the Muse takes them as a motif the lead plays back from the bar after
  next, in your colour. The score is still in the
  <a href={prototypeUrl}>prototype</a>.
</p>

<style>
  .note {
    color: var(--muted);
    font-size: 14px;
  }
  a {
    color: var(--amber);
  }
</style>
