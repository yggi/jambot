<!--
  The band: what stands behind the lobby's door. The music runs top to
  bottom in the order of the composition, one `Level` each, under the way out
  of the session. It shows the player it is given and sends what the person
  does; it opens no session and holds no device.
-->
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import DrumPads from '../components/DrumPads.svelte';
  import Keyboard from '../components/Keyboard.svelte';
  import KeyPicker from '../components/KeyPicker.svelte';
  import Level from '../components/Level.svelte';
  import MetronomePanel from '../components/MetronomePanel.svelte';
  import MusePanel from '../components/MusePanel.svelte';
  import Performers from '../components/Performers.svelte';
  import SessionBar from '../components/SessionBar.svelte';
  import Stage from '../components/Stage.svelte';
  import StylePanel from '../components/StylePanel.svelte';
  import TempoNudge from '../components/TempoNudge.svelte';
  import Transport from '../components/Transport.svelte';
  import { keyReachOf, tempoView } from '../conductor.ts';
  import type { Instruments } from '../instruments.svelte.ts';
  import type { Metronome } from '../metronome.svelte.ts';
  import { performersOf } from '../performers.ts';
  import type { Player } from '../player.svelte.ts';

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

  const performers = $derived(
    performersOf(player.hud, player.sounding, player.pattern, player.players),
  );

  const prototypeUrl = `${import.meta.env.BASE_URL}prototype.html`;
</script>

<SessionBar mode={player.mode} hosting={session.hosting} following={session.following} {onend} />

<!--
    The music, in the order of the composition, from the whole song down to
    each note. A client plays its host's song, style and key, so those
    levels' controls rest; its metronome and instruments are its own.
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

<Level name="Metrum">
  <TempoNudge
    tempo={tempoView(player.track, player.tempoNudge)}
    disabled={following}
    onintent={(intent) => player.apply(intent)}
  />
  <MetronomePanel {metronome} />
</Level>

<Level name="Key">
  <KeyPicker
    {following}
    heading={player.hud.heading}
    reach={keyReachOf(player.track)}
    home={player.home}
    history={player.harmonicHistory}
    onintent={(intent) => player.apply(intent)}
  />
</Level>

<Level name="Plan and chords">
  <Stage hud={player.hud} playing={player.playing} />
</Level>

<Level name="Tracks">
  <Performers {performers} />

  <Keyboard
    down={instruments.heldLead}
    scale={player.hud.bar?.scale ?? []}
    sounding={player.sounding.lead}
    onnote={(note, velocity, on) => instruments.toLead(note, velocity, on, 'the on-screen keys')}
  />

  <DrumPads
    down={instruments.heldDrums}
    sounding={player.sounding.drums}
    onnote={(note, velocity, on) => instruments.toDrums(note, velocity, on, 'the drum pads')}
  />

  <MusePanel muse={player.hud.muse} onforget={() => player.forgetMotif()} />
</Level>

<p class="note">
  The band plays drums, bass, chords and lead, over MIDI or the built-in synth. Join in on the
  keyboard or the pads above: a dot marks the current scale, and amber shows what the band's own
  lead and drums are playing. Play a few notes within a bar on the keyboard, and the Muse takes them
  as a motif the lead plays back from the bar after next. The score is still in the
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
